const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
  let location = "";
  let list, cost, value, min, maxFrnCatRaw, avg, lastRec, maybeLastSold, mrg, ytd, lastYr;

  if (isNumeric(maybeLocation)) {
    list = maybeLocation;
  } else {
    location = maybeLocation;
    list = rest.shift();
  }

  [cost, value, min, maxFrnCatRaw, avg, lastRec, maybeLastSold, mrg, ytd, lastYr] = rest;

  let max = "", frn = "", cat = "";
  const mfcParts = maxFrnCatRaw.trim().split(/ +/);
  if (mfcParts.length === 3) {
    [max, frn, cat] = mfcParts;
  } else if (mfcParts.length === 2) {
    [max, frn] = mfcParts;
  } else if (mfcParts.length === 1) {
    max = mfcParts[0];
  }

  let lastSold = "";
  if (isDateLike(maybeLastSold)) {
    lastSold = maybeLastSold;
  } else {
    lastYr = ytd;
    ytd = mrg;
    mrg = maybeLastSold;
  }

  return {
    code,
    name: desc,
    qty: parseInt(qty),
    location,
    list: parseFloat(list),
    cost: parseFloat(cost),
    value: parseFloat(value),
    min: parseInt(min),
    max: parseInt(max),
    frn,
    cat,
    avg: parseFloat(avg),
    lastRec,
    lastSold,
    mrg: parseFloat(mrg),
    ytd: parseFloat(ytd),
    lastYr: parseFloat(lastYr),
  };
}

async function insertPartsIntoDB(filePath) {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  let collecting = false;
  let dashLineCount = 0;
  const business = await prisma.business.findFirst(); // Pick the first business

  if (!business) {
    console.error("❌ No businesses found in DB.");
    return;
  }

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      dashLineCount = 0;
      collecting = false;
      continue;
    }

    if (/^-+$/.test(trimmed)) {
      dashLineCount++;
      if (dashLineCount === 2) {
        collecting = true;
      }
      continue;
    }

    if (!collecting) continue;

    const part = parseLine(line);
    if (!part) continue;

    await prisma.service.create({
      data: {
        ...part,
        description: `Auto-imported part ${part.code}`,
        price: part.list ?? 0,
        image: `https://dummyimage.com/400x400/000000/ffffff&text=${encodeURIComponent(part.code ?? 'Part')}`,
        businessId: business.id,
      },
    });
  }

  console.log("✅ Parts inserted into service table");
}

insertPartsIntoDB("XtraFile Kia")
  .catch(console.error)
  .finally(() => prisma.$disconnect());
