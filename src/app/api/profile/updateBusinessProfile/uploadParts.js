import formidable from "formidable";
import fs from "fs";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export const config = {
  api: {
    bodyParser: false
  }
};

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

async function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ message: "Error parsing form" });
    }

    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const content = fs.readFileSync(uploadedFile.filepath, "utf-8");
      const lines = content.split(/\r?\n/);

      let collecting = false;
      let dashCount = 0;
      const frnMap = new Map();
      let unknownBusiness = null;
      const services = [];

      const salt = "upload_salt";
      const hashedPassword = await hashPassword("default", salt);

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) {
          dashCount = 0;
          collecting = false;
          continue;
        }

        if (/^-+$/.test(trimmed)) {
          dashCount++;
          if (dashCount === 2) collecting = true;
          continue;
        }

        if (!collecting) continue;

        const part = parseLine(trimmed);
        if (!part) continue;

        let business;

        if (part.frn) {
          if (!frnMap.has(part.frn)) {
            const email = `auto-${part.frn.toLowerCase()}@parts.local`;
            const name = part.frn;

            const newBiz = await prisma.business.upsert({
              where: { email },
              update: {},
              create: {
                email,
                name,
                password: hashedPassword,
                salt,
                logo: `https://dummyimage.com/400x400/ff0000/fff&text=${encodeURIComponent(name)}`
              },
            });

            frnMap.set(part.frn, newBiz);
          }

          business = frnMap.get(part.frn);
        } else {
          if (!unknownBusiness) {
            unknownBusiness = await prisma.business.upsert({
              where: { email: "unknown@parts.local" },
              update: {},
              create: {
                email: "unknown@parts.local",
                name: "UNKNOWN",
                password: hashedPassword,
                salt,
                logo: `https://dummyimage.com/400x400/cccccc/000000&text=UNKNOWN`
              }
            });
          }

          business = unknownBusiness;
        }

        const newService = await prisma.service.create({
          data: {
            name: part.name,
            description: `${part.code}`,
            price: part.list ?? 0,
            image: `https://dummyimage.com/400x400/000000/ffffff&text=${encodeURIComponent(part.code ?? 'Part')}`,
            businessId: business.id,
            frn: part.frn ?? "",
            code: part.code,
            qty: part.qty,
            location: part.location,
            list: part.list ?? 0,
            cost: part.cost,
            value: part.value,
            min: part.min,
            max: part.max,
            cat: part.cat,
            avg: part.avg,
            lastRec: part.lastRec,
            lastSold: part.lastSold,
            mrg: part.mrg,
            ytd: part.ytd,
            lastYr: part.lastYr,
          }
        });

        services.push(newService);
      }

      return res.status(200).json({
        message: `✅ Uploaded ${services.length} parts`,
        count: services.length
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Server error", error: e.message });
    }
  });
}
