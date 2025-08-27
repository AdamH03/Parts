// util/cartOptimiser.js
export default function optimiseCart(cartItems, offeringsMap) {
  return {
    bestPrice: getBestPrice(cartItems, offeringsMap),
    maxCoverage: getSingleGaragePlan(cartItems, offeringsMap),
    bestTwo: getTwoGaragePlan(cartItems, offeringsMap),
  };
}

// 💶 Best Price — pick cheapest offering per item regardless of garage
function getBestPrice(cartItems, offeringsMap) {
  let total = 0;
  const plan = cartItems.map((item) => {
    const offerings = offeringsMap[item.serviceId] || [];
    if (offerings.length === 0) return null;

    const cheapest = offerings.reduce((min, o) =>
      o.price < min.price ? o : min,
      offerings[0]
    );

    total += cheapest.price * item.quantity;

    return {
      ...item,
      name: cheapest.service.name,
      price: cheapest.price,
      business: cheapest.business,
    };
  }).filter(Boolean);

  return { total, plan };
}

// 🏢 Single Garage — find garage that can supply all items
function getSingleGaragePlan(cartItems, offeringsMap) {
  const garageTotals = {};

  cartItems.forEach((item) => {
    const offerings = offeringsMap[item.serviceId] || [];
    offerings.forEach((off) => {
      if (!garageTotals[off.businessId]) {
        garageTotals[off.businessId] = { plan: [], total: 0, count: 0 };
      }
      garageTotals[off.businessId].plan.push({
        ...item,
        name: off.service.name,
        price: off.price,
        business: off.business,
      });
      garageTotals[off.businessId].total += off.price * item.quantity;
      garageTotals[off.businessId].count += 1;
    });
  });

  const bestGarage = Object.values(garageTotals).find(
    (g) => g.count === cartItems.length
  );

  return bestGarage || { total: 0, plan: [] };
}

// ⚖️ Best Two Garages — minimise number of garages while keeping cost low
function getTwoGaragePlan(cartItems, offeringsMap) {
  const garages = {};
  Object.values(offeringsMap).flat().forEach((off) => {
    garages[off.businessId] = off.business;
  });
  const garageIds = Object.keys(garages);

  let best = { total: Infinity, plan: [] };

  for (let i = 0; i < garageIds.length; i++) {
    for (let j = i; j < garageIds.length; j++) {
      const pair = [garageIds[i], garageIds[j]];
      let total = 0;
      const plan = [];
      let valid = true;

      for (const item of cartItems) {
        const offerings = (offeringsMap[item.serviceId] || []).filter((o) =>
          pair.includes(o.businessId)
        );

        if (offerings.length === 0) {
          valid = false;
          break;
        }

        const cheapest = offerings.reduce((min, o) =>
          o.price < min.price ? o : min,
          offerings[0]
        );

        plan.push({
          ...item,
          name: cheapest.service.name,
          price: cheapest.price,
          business: cheapest.business,
        });
        total += cheapest.price * item.quantity;
      }

      if (valid && total < best.total) {
        best = { total, plan };
      }
    }
  }

  return best.total === Infinity ? { total: 0, plan: [] } : best;
}
