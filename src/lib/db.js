import { prisma } from "@/lib/prisma";

// Look up serviceId by a unique code
export async function getServiceIdFromCode(code) {
  if (!code) return null;
  try {
    const service = await prisma.service.findUnique({
      where: { code },
      select: { id: true },
    });
    return service ? service.id : null;
  } catch (err) {
    console.error(`[lib/db] Error in getServiceIdFromCode("${code}"):`, err);
    return null;
  }
}

// Fetch all offerings for a list of service IDs
export async function getOfferingsByServiceIds(serviceIds) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) return [];
  try {
    const offerings = await prisma.partOffering.findMany({
      where: { serviceId: { in: serviceIds } },
      include: {
        business: true,
        service: true,
      },
    });
    return offerings;
  } catch (err) {
    console.error("[lib/db] Error in getOfferingsByServiceIds:", err);
    return [];
  }
}
