// /src/components/ServiceList.jsx
import React from 'react';

export default function ServiceList({ services }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {services.map(service => {
        const prices = service.partOfferings
          .map(po => po.price)
          .filter(p => typeof p === 'number' && !isNaN(p));

        const minPrice = prices.length > 0 ? Math.min(...prices) : null;

        return (
          <div
            key={service.id}
            className="border rounded-xl p-4 shadow-md bg-white hover:shadow-lg transition"
          >
            <h2 className="text-lg font-semibold">{service.name}</h2>
            <p className="text-sm text-gray-600">{service.description}</p>
            <p className="text-green-600 font-medium mt-2">
              {minPrice !== null ? `From €${minPrice.toFixed(2)}` : 'No price available'}
            </p>
          </div>
        );
      })}
    </div>
  );
}
