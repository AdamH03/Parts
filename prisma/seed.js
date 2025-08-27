const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

let hashedPassword;
let salt;
let buyers = [];
let businesses = [];
let services = [];
let admin;
let defaultBusiness;

function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    if (!password || !salt) return reject(new Error('Password and salt required'));
    crypto.scrypt(password.normalize(), salt, 64, (err, hash) => {
      if (err) reject(err);
      else resolve(hash.toString('hex').normalize());
    });
  });
}

function generateImage(type, i) {
  switch (type) {
    case "buyerProfileImg":
      return `https://dummyimage.com/400x400/00ff00/fff&text=Buyer${i}`;
    case "businessLogo":
      return `https://dummyimage.com/400x400/ff0000/fff&text=Biz${i}`;
    case "serviceImage":
      return `https://dummyimage.com/400x400/0000ff/fff&text=Service${i}`;
    default:
      return `https://dummyimage.com/400x400/cccccc/000&text=Image`;
  }
}

async function createBuyers(amount) {
  for (let i = 0; i < amount; i++) {
    const email = `buyer${i}@techsandthecity.works`;
    const name = `Buyer${i}`;

    buyers.push(await prisma.buyer.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: hashedPassword,
        salt,
        profile_img: generateImage("buyerProfileImg", i),
      },
    }));
  }
}

async function createBusinesses(amount) {
  for (let i = 0; i < amount; i++) {
    const email = `business${i}@techsandthecity.works`;
    const name = `Business${i}`;

    businesses.push(await prisma.business.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: hashedPassword,
        salt,
        logo: generateImage("businessLogo", i),
      },
    }));
  }
}

async function createAdmin() {
  const email = "admin@techsandthecity.works";
  const name = "Admin";
  const password = await hashPassword("admin", "admin_salt");

  admin = await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      password,
      salt: "admin_salt",
      profile_img: generateImage("buyerProfileImg", 999),
    },
  });
}

function isNumeric(str) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}

function isDateLike(str) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(str);
}

function safeParseInt(value) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

function safeParseFloat(value) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
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
  const mfcParts = maxFrnCatRaw?.trim().split(/ +/) ?? [];
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
    qty: safeParseInt(qty),
    location,
    list: safeParseFloat(list),
    cost: safeParseFloat(cost),
    value: safeParseFloat(value),
    min: safeParseInt(min),
    max: safeParseInt(max),
    frn,
    cat,
    avg: safeParseFloat(avg),
    lastRec,
    lastSold,
    mrg: safeParseFloat(mrg),
    ytd: safeParseFloat(ytd),
    lastYr: safeParseFloat(lastYr),
  };
}

async function insertPartsIntoDB(lines) {
  for (const line of lines) {
    if (!line.trim()) continue;
    const part = parseLine(line);
    if (!part || !part.code) continue;

    try {
      // Upsert Service by code
      const service = await prisma.service.upsert({
        where: { code: part.code },
        update: {
          name: part.name || "Unnamed",
          description: part.name || null,
          frn: part.frn || null,
          cat: part.cat || null,
        },
        create: {
          code: part.code,
          name: part.name || "Unnamed",
          description: part.name || null,
          frn: part.frn || null,
          cat: part.cat || null,
          image: generateImage("serviceImage", Math.floor(Math.random() * 1000)),
        },
      });

      // Upsert PartOffering
      await prisma.partOffering.upsert({
        where: {
          businessId_serviceId: {
            businessId: defaultBusiness.id,
            serviceId: service.id,
          },
        },
        update: {
          price: part.list || 0,
          qty: part.qty,
          location: part.location,
          list: part.list,
          cost: part.cost,
          value: part.value,
          min: part.min,
          max: part.max,
          avg: part.avg,
          lastRec: part.lastRec,
          lastSold: part.lastSold,
          mrg: part.mrg,
          ytd: part.ytd,
          lastYr: part.lastYr,
        },
        create: {
          businessId: defaultBusiness.id,
          serviceId: service.id,
          price: part.list || 0,
          qty: part.qty,
          location: part.location,
          list: part.list,
          cost: part.cost,
          value: part.value,
          min: part.min,
          max: part.max,
          avg: part.avg,
          lastRec: part.lastRec,
          lastSold: part.lastSold,
          mrg: part.mrg,
          ytd: part.ytd,
          lastYr: part.lastYr,
        },
      });
    } catch (err) {
      console.error(`Failed inserting part with code ${part.code}:`, err.message);
    }
  }
}

async function main() {
  await createAdmin();
  salt = crypto.randomBytes(16).toString('hex');
  hashedPassword = await hashPassword("password123", salt);
  await createBuyers(5);
  await createBusinesses(5);
  defaultBusiness = businesses[0];

  const dataPath = './XtraFile Kia'; // <-- Adjust this if needed
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const lines = rawData.split('\n');
  await insertPartsIntoDB(lines);

  console.log('✅ Seeding finished.');
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
