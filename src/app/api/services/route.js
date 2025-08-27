import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        partOfferings: true,
      },
    });

    const formatted = services.map((service) => {
      const primaryOffering = service.partOfferings?.[0];

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        price: primaryOffering?.price ?? 0,
        image: service.image,
        businessId: primaryOffering?.businessId ?? null,
        partOfferings: service.partOfferings, // Optional: include full offerings array
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(
      "Failed to fetch business services:",
      error?.message || error || "Unknown error"
    );
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { name, description, price, image, businessId } = await request.json();

    const service = await prisma.service.create({
      data: {
        name,
        description,
        image,
        partOfferings: {
          create: {
            price: parseFloat(price),
            business: {
              connect: {
                id: businessId,
              },
            },
          },
        },
      },
      include: {
        partOfferings: true,
      },
    });

    return NextResponse.json(service);
  } catch (e) {
    console.error("Failed to create service:", e);
    return NextResponse.json(
      {
        success: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}
