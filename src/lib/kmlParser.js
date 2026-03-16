import JSZip from "jszip";
import toGeoJSON from "@mapbox/togeojson";
import { formatName } from "./utils";

/**
 * Parses a KMZ file (compressed KML) and converts it to GeoJSON
 * @param {File|Blob|ArrayBuffer} file - The KMZ file to parse
 * @returns {Promise<Object>} GeoJSON feature collection
 */
export async function parseKMZ(file) {
  // Load the KMZ file
  const zip = await JSZip.loadAsync(file);

  // Find the KML file in the archive (usually named 'doc.kml' or similar)
  const kmlFiles = Object.keys(zip.files).filter((name) => {
    const file = zip.files[name];
    return !file.dir && /\.kml$/i.test(name);
  });

  if (kmlFiles.length === 0) {
    throw new Error("No KML file found in KMZ archive");
  }

  // Use the first KML file found (usually 'doc.kml')
  const kmlFile = zip.files[kmlFiles[0]];

  // Extract and parse the KML content
  const kmlText = await kmlFile.async("string");
  const kmlDom = new DOMParser().parseFromString(kmlText, "text/xml");

  // Check for parsing errors
  const parserError = kmlDom.querySelector("parsererror");
  if (parserError) {
    throw new Error("Failed to parse KML XML: " + parserError.textContent);
  }

  // Convert KML to GeoJSON
  const geoJson = toGeoJSON.kml(kmlDom);

  return geoJson;
}

/**
 * Parses a KML file (uncompressed) and converts it to GeoJSON,
 * tagging each feature with its parent Folder name.
 * @param {string} kmlText - The KML XML content as a string
 * @returns {Object} GeoJSON feature collection with `folder` property on each feature
 */
export function parseKML(kmlText) {
  const kmlDom = new DOMParser().parseFromString(kmlText, "text/xml");

  const parserError = kmlDom.querySelector("parsererror");
  if (parserError) {
    throw new Error("Failed to parse KML XML: " + parserError.textContent);
  }

  const ns = "http://www.opengis.net/kml/2.2";
  const folders = kmlDom.getElementsByTagNameNS(ns, "Folder");
  const allFeatures = [];

  for (const folder of folders) {
    const nameEl = folder.getElementsByTagNameNS(ns, "name")[0];
    const folderName = nameEl?.textContent?.trim() || "Unknown";

    // Build a minimal KML document containing just this folder's placemarks
    const placemarks = folder.getElementsByTagNameNS(ns, "Placemark");
    if (placemarks.length === 0) continue;

    const wrapper = kmlDom.implementation.createDocument(ns, "kml", null);
    const doc = wrapper.createElementNS(ns, "Document");
    wrapper.documentElement.appendChild(doc);
    for (const pm of placemarks) {
      doc.appendChild(pm.cloneNode(true));
    }

    const geoJson = toGeoJSON.kml(wrapper);
    for (const feature of geoJson.features) {
      feature.properties = feature.properties || {};
      feature.properties.folder = folderName;
      // Normalize name properties at parse time
      const p = feature.properties;
      if (p.LAYOUT_NAM) p.LAYOUT_NAM = formatName(p.LAYOUT_NAM);
      if (p["Name of Layout"]) p["Name of Layout"] = formatName(p["Name of Layout"]);
      if (p.vil_eng) p.vil_eng = formatName(p.vil_eng);
      if (p.name) p.name = formatName(p.name);
      allFeatures.push(feature);
    }
  }

  return { type: "FeatureCollection", features: allFeatures };
}
