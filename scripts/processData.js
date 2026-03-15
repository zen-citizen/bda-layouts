import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to validate file exists
function validateFileExists(filePath, description = 'File') {
  if (!fs.existsSync(filePath)) {
    process.exit(1);
  }
  return true;
}

// Helper function to safely read file with error handling
function safeReadFile(filePath, encoding = 'utf-8', description = 'File') {
  validateFileExists(filePath, description);
  
  // Check file size (warn if > 10MB)
  try {
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    if (fileSizeMB > 10) {
      // File is large, processing may take longer
    }
  } catch (error) {
    process.exit(1);
  }
  
  // Read file with error handling
  try {
    return fs.readFileSync(filePath, encoding);
  } catch (error) {
    process.exit(1);
  }
}

// Read CSV file
const csvPath = path.join(__dirname, '../sites.csv');
const csvContent = safeReadFile(csvPath, 'utf-8', 'CSV file');

// Validate CSV content
if (!csvContent || csvContent.trim().length === 0) {
  process.exit(1);
}

// Parse CSV - handle multi-line header
const lines = csvContent.trim().split('\n');

// Validate CSV has minimum required lines (header + at least one data row)
if (lines.length < 3) {
  process.exit(1);
}

// Parse multi-line header (first 2 lines)
// Line 1: Most columns ending with "Contact Number - Site Information Coordinator"
// Line 2: "9am-5pm on working days","Total Area (in Sqm)",Rate Per Sq.Mtr in Rs.,Rate per sq.ft in Rs.,Total Area (in sq ft),Total Minimum Bid Price
// Line 3: First data row (starts with Sl_No 1)

// Combine first 2 header lines to handle quoted fields spanning multiple lines
let combinedHeader;
let allHeaders;
try {
  combinedHeader = lines[0] + '\n' + lines[1];
  allHeaders = parseCSVLine(combinedHeader);
  
  if (!allHeaders || allHeaders.length === 0) {
    process.exit(1);
  }
} catch (error) {
  process.exit(1);
}

const headers = [];

// Process headers - combine Contact Number and Total Area fields
for (let i = 0; i < allHeaders.length; i++) {
  const header = allHeaders[i].trim();
  
  if (header.includes('Contact Number')) {
    // This is the start of Contact Number - combine with next field (9am-5pm...)
    if (i + 1 < allHeaders.length && allHeaders[i + 1].includes('9am-5pm')) {
      headers.push('Contact Number - Site Information Coordinator\n9am-5pm on working days');
      i++; // Skip next field as it's part of Contact Number
    } else {
      headers.push(header);
    }
  } else if (header.includes('Total Area') && !header.includes('(in Sqm)')) {
    // This is "Total Area" - combine with next field "(in Sqm)"
    if (i + 1 < allHeaders.length && allHeaders[i + 1].includes('(in Sqm)')) {
      headers.push('Total Area\n(in Sqm)');
      i++; // Skip next field as it's part of Total Area
    } else {
      headers.push(header);
    }
  } else if (header.includes('(in Sqm)') && !header.includes('Total Area')) {
    // This is the continuation - should have been handled above, skip
    continue;
  } else if (header.includes('9am-5pm')) {
    // This is continuation of Contact Number - should have been handled above, skip
    continue;
  } else {
    headers.push(header);
  }
}

// Helper function to parse CSV line handling quoted fields
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

const sites = [];
const layouts = new Set();
const siteSizes = new Set();
const types = new Set();

// Process data rows in batches for better performance and progress tracking
const BATCH_SIZE = 50;
const dataRows = lines.slice(2); // Skip header lines (first 2, line 3 onwards are data)
const totalRows = dataRows.length;


// Process rows in batches
for (let batchStart = 0; batchStart < totalRows; batchStart += BATCH_SIZE) {
  const batchEnd = Math.min(batchStart + BATCH_SIZE, totalRows);
  const batchNumber = Math.floor(batchStart / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(totalRows / BATCH_SIZE);
  
  // Process each row in the current batch
  for (let i = batchStart; i < batchEnd; i++) {
    const line = dataRows[i];
    if (!line.trim()) continue;
    
    try {
      const values = parseCSVLine(line);
      
      const site = {};
      headers.forEach((header, index) => {
        // Handle duplicate Lat/Long columns by taking the first one
        if (header === 'Lat' && site.Lat) return;
        if (header === 'Long' && site.Long) return;
        site[header] = values[index] || '';
      });
      
      // Clean and process data
      // Handle duplicate Lat/Long columns - use first occurrence
      const latValue = site.Lat && site.Lat !== 'Not Found' && site.Lat.trim() !== '' 
        ? site.Lat.trim() 
        : null;
      const lngValue = site.Long && site.Long !== 'Not Found' && site.Long.trim() !== '' 
        ? site.Long.trim() 
        : null;
      
      const lat = latValue ? parseFloat(latValue) : null;
      const lng = lngValue ? parseFloat(lngValue) : null;
      
      // Validate that parsed values are valid finite numbers
      const hasValidCoordinates = lat != null && lng != null && 
                                   !Number.isNaN(lat) && !Number.isNaN(lng) &&
                                   Number.isFinite(lat) && Number.isFinite(lng);
      
      // Find Size column (could be "Size" or "Size " after trimming)
      const sizeClassificationValue = site['Size'] || site['Size '] || '';
      
      // Generate Google Maps link from coordinates if missing or "NA"
      let googleMapsLink = site['Google Maps Link'] || '';
      if (hasValidCoordinates && (!googleMapsLink || googleMapsLink.trim() === '' || googleMapsLink === 'NA')) {
        googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      }
      
      // Extract contact number - handle both possible header formats (with newline or combined)
      let contactNumber = '';
      const contactHeaderKeys = [
        'Contact Number - Site Information Coordinator\n9am-5pm on working days',
        'Contact Number - Site Information Coordinator\r\n9am-5pm on working days',
        'Contact Number - Site Information Coordinator'
      ];
      for (const key of contactHeaderKeys) {
        if (site[key] && site[key].trim() !== '') {
          contactNumber = site[key].trim();
          break;
        }
      }
      // Also try finding by checking all keys that include "Contact Number"
      if (!contactNumber) {
        for (const key in site) {
          if (key.includes('Contact Number') && site[key] && site[key].trim() !== '') {
            contactNumber = site[key].trim();
            break;
          }
        }
      }
      
      const processedSite = {
        slNo: parseInt(site.Sl_No) || i + 1,
        siteSize: site['Site Size'] || '',
        type: site.Type || '',
        layout: site.Layout || '', // Keep for filtering purposes
        layoutDetails: site['Layout Details'] || '',
        siteNo: site.Site_No || '',
        eToW: site['E to W'] || '',
        nToS: site['N to S'] || '',
        totalArea: site['Total_Area (in sq.m)'] || '',
        sizeClassification: sizeClassificationValue.trim(), // Size classification bucket for filtering
        lat: hasValidCoordinates ? lat : null,
        lng: hasValidCoordinates ? lng : null,
        hasCoordinates: hasValidCoordinates,
        biddingSession: parseInt(site.Sl_No) <= 42 ? 1 : 2,
        surveyNo: site['Survey No.'] || '',
        contactNumber: contactNumber,
        ratePerSqMtr: site['Rate Per Sq.Mtr in Rs.'] || '',
        googleMapsLink: googleMapsLink
      };
      
      if (processedSite.layout) {
        layouts.add(processedSite.layout);
      }
      if (processedSite.siteSize) {
        siteSizes.add(processedSite.siteSize);
      }
      if (processedSite.type) {
        types.add(processedSite.type);
      }
      
      sites.push(processedSite);
    } catch (error) {
      // Continue processing other rows
    }
  }
}

// Create output
const output = {
  sites,
  layouts: Array.from(layouts).sort(),
  siteSizes: Array.from(siteSizes).sort(),
  types: Array.from(types).sort(),
  stats: {
    total: sites.length,
    withCoordinates: sites.filter(s => s.hasCoordinates).length,
    session1: sites.filter(s => s.biddingSession === 1).length,
    session2: sites.filter(s => s.biddingSession === 2).length
  }
};

// Write JSON file
const outputPath = path.join(__dirname, '../src/data/sites.json');
try {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
} catch (error) {
  process.exit(1);
}

try {
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
} catch (error) {
  process.exit(1);
}
