import { getCurrentSessionInfo, getCurrentUser } from "@/auth/nextjs/currentUser";
import { prisma } from "@/lib/prisma";

export async function getAllServices() {
  return await prisma.service.findMany({
    include: {
      // There is no direct "business" on service, so include partOfferings with business
      partOfferings: {
        include: {
          business: true,
        },
      },
    },
  });
}

export async function getServiceById(id) {
  return await prisma.service.findUnique({
    where: { id },
    include: {
      partOfferings: {
        include: {
          business: true,
        },
      },
      reviews: true,
    },
  });
}

export async function getBusinessServices() {
  const session = await getCurrentSessionInfo();
  const user = await getCurrentUser();

  if (!session || session.role !== "BUSINESS") return [];

  // Find all partOfferings for the business, include the related services
  const partOfferings = await prisma.partOffering.findMany({
    where: { businessId: user.id },
    include: {
      service: true,
    },
    orderBy: { created_at: "desc" },
  });

  // Return the related services
  return partOfferings.map((po) => po.service);
}
