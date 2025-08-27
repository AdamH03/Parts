const fs = require('fs');
const xlsx = require('xlsx');

function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

function isDateLike(str) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(str);
}

function parseLine(line) {
  const tokens = line.trim().split(/ {2,}/);
  if (tokens.length < 10) return null;

  let [code, desc, qty, maybeLocation, ...rest] = tokens;

  // Handle optional location
  let location = "";
  let list, cost, value, min, maxFrnCatRaw, avg, lastRec, maybeLastSold, mrg, ytd, lastYr;

  if (isNumeric(maybeLocation)) {
    list = maybeLocation;
  } else {
    location = maybeLocation;
    list = rest.shift();
  }

  [cost, value, min, maxFrnCatRaw, avg, lastRec, maybeLastSold, mrg, ytd, lastYr] = rest;

  // Parse max/frn/cat properly
  let max = "", frn = "", cat = "";
  const mfcParts = maxFrnCatRaw.trim().split(/ +/);
  if (mfcParts.length === 3) {
    [max, frn, cat] = mfcParts;
  } else if (mfcParts.length === 2) {
    [max, frn] = mfcParts;
  } else if (mfcParts.length === 1) {
    max = mfcParts[0];
  }

  // Handle optional Last Sold
  let lastSold = "";
  if (isDateLike(maybeLastSold)) {
    lastSold = maybeLastSold;
  } else {
    // It's missing, shift right
    lastYr = ytd;
    ytd = mrg;
    mrg = maybeLastSold;
  }

  return [
    code, desc, qty, location, list, cost, value, min, max,
    frn, cat, avg, lastRec, lastSold, mrg, ytd, lastYr
  ];
}

function convertTextToExcel(inputPath, outputPath) {
  const lines = fs.readFileSync(inputPath, 'utf-8').split('\n');

  const data = [];
  const headers = [
    'Code', 'Description', 'Qty', 'Location', 'List', 'Cost', 'Value',
    'Min', 'Max', 'Frn', 'Cat', 'Avg', 'Last Rec', 'Last Sold',
    'Mrg%', 'Unit Ytd', 'Last Yr'
  ];
  data.push(headers);

  let collecting = false;
  let dashLineCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Reset if we hit an empty line
    if (trimmed === "") {
      dashLineCount = 0;
      collecting = false;
      continue;
    }

    // Count dashed lines
    if (/^-+$/.test(trimmed)) {
      dashLineCount++;
      if (dashLineCount === 2) {
        collecting = true;
      }
      continue;
    }

    if (!collecting) continue;

    const row = parseLine(line);
    if (row) data.push(row);
  }

  const worksheet = xlsx.utils.aoa_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  xlsx.writeFile(workbook, outputPath);
  console.log(`✅ Excel file created: ${outputPath}`);
}

convertTextToExcel("XtraFile Kia", "clean_inventory.xlsx");
