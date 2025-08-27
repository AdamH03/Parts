import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { parseLine } from "@/lib/parseLine";

const prisma = new PrismaClient();

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");
  const businessId = formData.get("businessId");

  if (!file || !businessId) {
    return NextResponse.json({ error: "Missing file or businessId" }, { status: 400 });
  }

  // Check if business exists
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = buffer.toString("utf-8");

  const lines = text.split(/\r?\n/);
  let collecting = false;
  let dashLineCount = 0;
  let serviceCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      dashLineCount = 0;
      collecting = false;
      continue;
    }

    if (/^-+$/.test(trimmed)) {
      dashLineCount++;
      if (dashLineCount === 2) collecting = true;
      continue;
    }

    if (!collecting) continue;

    const part = parseLine(line);
    if (!part) continue;

    try {
      // Upsert the Service first
      const service = await prisma.service.upsert({
        where: { code: part.code },
        update: {
          name: part.name,
          description: part.description ?? null,
          image: `https://dummyimage.com/400x400/000/fff&text=${encodeURIComponent(part.code)}`,
          cat: part.cat,
          frn: part.frn,
        },
        create: {
          code: part.code,
          name: part.name,
          description: part.description ?? null,
          image: `https://dummyimage.com/400x400/000/fff&text=${encodeURIComponent(part.code)}`,
          cat: part.cat,
          frn: part.frn,
        },
      });

      // Upsert the PartOffering for this business and service
      await prisma.partOffering.upsert({
        where: {
          businessId_serviceId: {
            businessId: business.id,
            serviceId: service.id,
          },
        },
        update: {
          price: part.list ?? 0,
          qty: part.qty,
          location: part.location,
          list: part.list ?? 0,
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
          businessId: business.id,
          serviceId: service.id,
          price: part.list ?? 0,
          qty: part.qty,
          location: part.location,
          list: part.list ?? 0,
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

      serviceCount++;
    } catch (err) {
      console.error("Error upserting part:", part.code, err.message);
    }
  }

  return NextResponse.json({ message: `✅ Inserted or updated ${serviceCount} services` });
}
