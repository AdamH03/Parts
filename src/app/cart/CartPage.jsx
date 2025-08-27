"use client";

import React from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";

export default function CartPage({ optimisedPlans = {} }) {
  const { cartItems, totalPrice, totalQuantity } = useCart();
  const { bestPrice, maxCoverage, bestTwo } = optimisedPlans;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="text-gray-500">
          Your cart is empty.{" "}
          <Link href="/services" className="text-blue-600 hover:underline">
            Browse parts
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Cart Items List */}
          <ul className="space-y-6">
            {cartItems.map((item, index) => {
              const quantity = Number(item.quantity ?? 0);
              const price = Number(item.price ?? 0);
              const lineTotal = !isNaN(price * quantity)
                ? (price * quantity).toFixed(2)
                : "N/A";
              const name = item.name || item.service?.name || `Item #${index + 1}`;
              const seller = item.business?.name || item.businessId || "Unknown Seller";

              return (
                <li
                  key={item.id}
                  className="border p-4 rounded-md shadow-sm flex justify-between items-start"
                >
                  <div>
                    <p className="font-semibold text-lg">{name}</p>
                    <p className="text-sm text-gray-600">Seller: {seller}</p>
                    <p className="text-sm text-gray-600">Qty: {quantity}</p>
                    <p className="text-sm text-gray-600">Unit Price: €{price.toFixed(2)}</p>
                  </div>
                  <div className="text-right font-medium text-lg">€{lineTotal}</div>
                </li>
              );
            })}
          </ul>

          {/* Cart Totals */}
          <div className="mt-8 border-t pt-4 flex justify-between items-center font-semibold text-xl">
            <span>Total ({totalQuantity} items):</span>
            <span>€{!isNaN(totalPrice) ? totalPrice.toFixed(2) : "0.00"}</span>
          </div>

          {/* Optimized Plan Suggestions */}
          <div className="mt-10 space-y-6">
            <h2 className="text-2xl font-semibold">Optimized Suggestions</h2>

            {/* 💶 Cheapest Across All Garages */}
            <div>
              <h3 className="font-bold">💶 Cheapest Overall (Any Garage)</h3>
              {bestPrice?.plan?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    Lowest cost across all garages — total: €{bestPrice.total.toFixed(2)}
                  </p>
                  <ul className="text-sm list-disc list-inside text-gray-700">
                    {bestPrice.plan.map((entry, i) => (
                      <li key={i}>
                        {entry.quantity} x {entry.name} from {entry.business.name} @ €
                        {entry.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-500">Your cart already reflects the cheapest plan.</p>
              )}
            </div>

            {/* 🏢 Cheapest from Single Garage */}
            <div>
              <h3 className="font-bold">🏢 Cheapest from One Garage</h3>
              {maxCoverage?.plan?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    Fulfilled by {maxCoverage.plan[0]?.business.name} — total: €
                    {maxCoverage.total.toFixed(2)}
                  </p>
                  <ul className="text-sm list-disc list-inside text-gray-700">
                    {maxCoverage.plan.map((entry, i) => (
                      <li key={i}>
                        {entry.quantity} x {entry.name} @ €{entry.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-500">No single garage can fulfill all items.</p>
              )}
            </div>

            {/* 🧠 Cheapest Using Two Garages */}
            <div>
              <h3 className="font-bold">🧠 Cheapest Using Minimum Garages (2)</h3>
              {bestTwo?.plan?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-1">
                    Uses{" "}
                    {new Set(bestTwo.plan.map((p) => p.business.id)).size} garages — total: €
                    {bestTwo.total.toFixed(2)}
                  </p>
                  <ul className="text-sm list-disc list-inside text-gray-700">
                    {bestTwo.plan.map((entry, i) => (
                      <li key={i}>
                        {entry.quantity} x {entry.name} from {entry.business.name} @ €
                        {entry.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-500">No two-garage plan could fulfill all items.</p>
              )}
            </div>
          </div>

          {/* Checkout Button */}
          <div className="mt-6 text-right">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              onClick={() => alert("Checkout not implemented yet")}
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
