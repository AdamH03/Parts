// src/app/api/cart/offerings/route.js
import { NextResponse } from "next/server";
import { getServiceIdFromCode, getOfferingsByServiceIds } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function aggregateQuantities(items) {
  // items: [{ serviceId?, code?, quantity }]
  const qtyBySid = new Map();
  for (const it of items) {
    if (!it.serviceId) continue;
    const q = Number(it.quantity ?? 1);
    qtyBySid.set(it.serviceId, (qtyBySid.get(it.serviceId) ?? 0) + q);
  }
  return qtyBySid;
}

function buildOfferingsIndex(offerings) {
  const byService = new Map();
  const byGarage = new Map();
  for (const o of offerings) {
    if (!byService.has(o.serviceId)) byService.set(o.serviceId, []);
    byService.get(o.serviceId).push(o);

    if (!byGarage.has(o.businessId))
      byGarage.set(o.businessId, { business: o.business, services: new Set(), offerings: [] });

    byGarage.get(o.businessId).services.add(o.serviceId);
    byGarage.get(o.businessId).offerings.push(o);
  }
  return { byService, byGarage };
}

function cheapestOffering(arr) {
  let min = null;
  for (const o of arr || []) {
    if (!min || o.price < min.price) min = o;
  }
  return min;
}

function comboCoversAll(comboIds, byGarage, targetServiceIds) {
  const covered = new Set();
  for (const gid of comboIds) {
    const g = byGarage.get(gid);
    if (!g) continue;
    for (const sid of g.services) covered.add(sid);
  }
  return targetServiceIds.every((sid) => covered.has(sid));
}

function calcPlanForCombo(comboIds, byService, qtyBySid) {
  const comboSet = new Set(comboIds);
  const plan = [];
  let total = 0;

  for (const [sid, qty] of qtyBySid.entries()) {
    const options = (byService.get(sid) || []).filter((o) => comboSet.has(o.businessId));
    const pick = cheapestOffering(options);
    if (!pick) return null; // combo doesn't actually cover something
    plan.push({
      serviceId: sid,
      quantity: qty,
      price: pick.price,
      name: pick.service?.name ?? "",
      business: pick.business,
    });
    total += pick.price * qty;
  }
  return { plan, total };
}

function calcBestPricePlan(byService, qtyBySid) {
  const plan = [];
  const garages = new Set();
  let total = 0;

  for (const [sid, qty] of qtyBySid.entries()) {
    const pick = cheapestOffering(byService.get(sid));
    if (!pick) return null;
    plan.push({
      serviceId: sid,
      quantity: qty,
      price: pick.price,
      name: pick.service?.name ?? "",
      business: pick.business,
    });
    total += pick.price * qty;
    garages.add(pick.businessId);
  }

  return {
    total,
    plan,
    garages: Array.from(garages).map((id) => ({
      id,
      name:
        byService.get(plan[0]?.serviceId)?.find((o) => o.businessId === id)?.business?.name ||
        "Unknown",
    })),
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];

    if (cartItems.length === 0) {
      return NextResponse.json({ offerings: [], optimisations: { minGarages: [], bestPrice: null } });
    }

    // Resolve serviceIds (support mix of serviceId and code)
    const withSid = cartItems.filter((i) => i.serviceId);
    const withCode = cartItems.filter((i) => !i.serviceId && i.code);

    let serviceIds = withSid.map((i) => i.serviceId);
    if (withCode.length > 0) {
      const resolved = await Promise.all(
        withCode.map((i) => getServiceIdFromCode(i.code))
      );
      const mapped = resolved.filter(Boolean);
      // attach resolved IDs onto the items so quantities aggregate correctly
      mapped.forEach((sid, idx) => (withCode[idx].serviceId = sid));
      serviceIds = [...serviceIds, ...mapped];
    }

    // Deduplicate serviceIds
    serviceIds = Array.from(new Set(serviceIds));
    if (serviceIds.length === 0) {
      return NextResponse.json({ offerings: [], optimisations: { minGarages: [], bestPrice: null } });
    }

    // Aggregate quantities by serviceId
    const qtyBySid = aggregateQuantities([...withSid, ...withCode]);

    // Fetch offerings for all serviceIds
    const offerings = await getOfferingsByServiceIds(serviceIds);

    // Index offerings
    const { byService, byGarage } = buildOfferingsIndex(offerings);

    // Target services we must cover
    const targetServiceIds = Array.from(qtyBySid.keys());

    // Enumerate garage combos to find minimum count
    const garageIds = Array.from(byGarage.keys());
    let minCount = Infinity;
    let minCombos = [];

    const dfs = (start, chosen) => {
      if (chosen.length > minCount) return;
      if (comboCoversAll(chosen, byGarage, targetServiceIds)) {
        if (chosen.length < minCount) {
          minCount = chosen.length;
          minCombos = [chosen.slice()];
        } else if (chosen.length === minCount) {
          minCombos.push(chosen.slice());
        }
        return;
      }
      for (let i = start; i < garageIds.length; i++) {
        chosen.push(garageIds[i]);
        dfs(i + 1, chosen);
        chosen.pop();
      }
    };
    dfs(0, []);

    // Build detailed solutions for all minimum combos
    let minGarageSolutions = [];
    if (minCombos.length > 0 && minCount !== Infinity) {
      minGarageSolutions = minCombos
        .map((combo) => {
          const result = calcPlanForCombo(combo, byService, qtyBySid);
          if (!result) return null;
          return {
            garages: combo.map((id) => ({
              id,
              name: byGarage.get(id)?.business?.name ?? "Unknown",
            })),
            total: result.total,
            plan: result.plan,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.total - b.total);
    }

    // Best price plan (ignoring garage count)
    const bestPrice = calcBestPricePlan(byService, qtyBySid);

    return NextResponse.json({
      offerings,
      optimisations: {
        minGarages: minGarageSolutions,
        bestPrice,
      },
    });
  } catch (err) {
    console.error("[API /cart/offerings] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
