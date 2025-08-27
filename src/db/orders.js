import {getCurrentSessionInfo, getCurrentUser} from "@/auth/nextjs/currentUser";
import {prisma} from "@/lib/prisma";

export async function getTotalOrdersForBusiness() {
    const session = await getCurrentSessionInfo();
    const user = await getCurrentUser();
  
    if (!session || session.role !== "BUSINESS") return 0;
  
    return await prisma.order.count({
      where: { businessId: user.id },
    });
  }
  

  export async function getProfitForBusiness() {
    const session = await getCurrentSessionInfo();
    const user = await getCurrentUser();
    if (!session || session.role !== "BUSINESS") return 0;
  
    const orders = await prisma.order.findMany({
      where: { businessId: user.id },
      select: {
        productId: true,
      },
    });
  
    if (orders.length === 0) return 0;
  
    // Fetch PartOfferings prices for this business and these products
    const serviceIds = orders.map(o => o.productId);
  
    const partOfferings = await prisma.partOffering.findMany({
      where: {
        businessId: user.id,
        serviceId: { in: serviceIds },
      },
      select: {
        serviceId: true,
        price: true,
      },
    });
  
    // Map serviceId to price for quick lookup
    const priceMap = Object.fromEntries(partOfferings.map(po => [po.serviceId, po.price]));
  
    // Sum up prices for all orders
    return orders.reduce((sum, order) => sum + (priceMap[order.productId] || 0), 0);
  }
  

  export async function getTotalSales() {
    const orders = await prisma.order.findMany({
      select: {
        businessId: true,
        productId: true,
      },
    });
  
    if (orders.length === 0) return 0;
  
    // Fetch all relevant PartOfferings for orders
    const businessIds = [...new Set(orders.map(o => o.businessId))];
    const serviceIds = [...new Set(orders.map(o => o.productId))];
  
    const partOfferings = await prisma.partOffering.findMany({
      where: {
        businessId: { in: businessIds },
        serviceId: { in: serviceIds },
      },
      select: {
        businessId: true,
        serviceId: true,
        price: true,
      },
    });
  
    // Create lookup map with key `businessId_serviceId` to price
    const priceMap = {};
    for (const po of partOfferings) {
      priceMap[`${po.businessId}_${po.serviceId}`] = po.price;
    }
  
    return orders.reduce((sum, order) => {
      return sum + (priceMap[`${order.businessId}_${order.productId}`] || 0);
    }, 0);
  }
  

  export async function getAverageTransactionsPerDay() {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'asc' },
      select: { created_at: true },
    });
  
    if (orders.length === 0) return 0;
  
    const totalTransactions = orders.length;
    const firstOrderDate = orders[0].created_at;
    const now = new Date();
  
    const diffInDays = Math.max(
      Math.floor((now.getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24)),
      1
    );
  
    return totalTransactions / diffInDays;
  }
  