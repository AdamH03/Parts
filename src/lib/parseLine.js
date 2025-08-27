export function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

export function isDateLike(str) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(str);
}

export function parseLine(line) {
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
  if (mfcParts.length === 3) [max, frn, cat] = mfcParts;
  else if (mfcParts.length === 2) [max, frn] = mfcParts;
  else if (mfcParts.length === 1) max = mfcParts[0];

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
