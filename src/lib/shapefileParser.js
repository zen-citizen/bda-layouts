import shp from 'shpjs'

/**
 * Parses a shapefile and converts it to GeoJSON
 * @param {string} shpUrl - URL to the .shp file
 * @param {string} dbfUrl - URL to the .dbf file
 * @param {string} shxUrl - URL to the .shx file (optional but recommended)
 * @param {string} prjUrl - URL to the .prj file (optional, for projection info)
 * @returns {Promise<Object>} GeoJSON feature collection
 */
export async function parseShapefile(shpUrl, dbfUrl, shxUrl = null, prjUrl = null) {
  try {
    // Validate file sizes - shapefile headers are typically 100+ bytes
    const MIN_FILE_SIZE = 100
    
    // Create AbortController for timeout handling
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    // Fetch the shapefile components with timeout
    const fetchPromises = [
      fetch(shpUrl, { signal: controller.signal }),
      fetch(dbfUrl, { signal: controller.signal })
    ]
    
    // Include .shx if provided
    if (shxUrl) {
      fetchPromises.push(fetch(shxUrl, { signal: controller.signal }))
    }
    
    const responses = await Promise.all(fetchPromises)
    clearTimeout(timeoutId)
    
    const [shpResponse, dbfResponse, shxResponse] = responses
    
    if (!shpResponse.ok) {
      throw new Error(`Failed to fetch .shp file: ${shpResponse.status} ${shpResponse.statusText}`)
    }
    if (!dbfResponse.ok) {
      throw new Error(`Failed to fetch .dbf file: ${dbfResponse.status} ${dbfResponse.statusText}`)
    }
    if (shxUrl && shxResponse && !shxResponse.ok) {
      // Continue without .shx file if fetch fails
    }
    
    // Convert responses to ArrayBuffers
    const shpBuffer = await shpResponse.arrayBuffer()
    const dbfBuffer = await dbfResponse.arrayBuffer()
    const shxBuffer = shxUrl && shxResponse?.ok ? await shxResponse.arrayBuffer() : null
    
    // Validate buffers
    if (shpBuffer.byteLength < MIN_FILE_SIZE) {
      throw new Error(`.shp file is too small (${shpBuffer.byteLength} bytes). Expected at least ${MIN_FILE_SIZE} bytes.`)
    }
    if (dbfBuffer.byteLength < MIN_FILE_SIZE) {
      throw new Error(`.dbf file is too small (${dbfBuffer.byteLength} bytes). Expected at least ${MIN_FILE_SIZE} bytes.`)
    }
    
    // Parse shapefile to GeoJSON using shpjs
    // shpjs expects an object with shp, dbf, and optionally shx as ArrayBuffers
    const shpjsInput = { shp: shpBuffer, dbf: dbfBuffer }
    if (shxBuffer) {
      shpjsInput.shx = shxBuffer
    }
    
    let result
    try {
      result = await shp(shpjsInput)
    } catch (shpError) {
      // Re-throw with more context
      throw new Error(`Shapefile parsing failed: ${shpError.message || shpError.toString()}. This may indicate the shapefile is empty, corrupted, or in an unsupported format.`)
    }
    
    // shpjs may return a FeatureCollection directly, or we need to wrap it
    let geoJson
    if (result && result.type === 'FeatureCollection') {
      geoJson = result
    } else if (Array.isArray(result)) {
      // If it's an array of features, wrap it in a FeatureCollection
      if (result.length === 0) {
        throw new Error('Shapefile contains no features (empty array returned)')
      }
      geoJson = {
        type: 'FeatureCollection',
        features: result
      }
    } else if (result && result.features) {
      geoJson = result
    } else if (!result) {
      throw new Error('shpjs returned null or undefined - shapefile may be empty or invalid')
    } else {
      throw new Error(`Unexpected shapefile parse result format: ${JSON.stringify(Object.keys(result))}`)
    }
    
    return geoJson
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Shapefile fetch timed out. The files may be too large or the server is slow.')
    }
    if (error.message?.includes('504')) {
      throw new Error('Server timeout (504). The shapefile files may be too large. Try restarting the dev server.')
    }
    if (error.message?.includes('no layers found') || error.message?.includes('no layers')) {
      throw new Error('Shapefile contains no layers/features. The file may be empty or the format is not supported.')
    }
    
    // Re-throw with original message if it's already descriptive
    throw error
  }
}
