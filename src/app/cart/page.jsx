"use client";
import CartEmails from "@/components/CartEmails";
import React, { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { cartItems, totalPrice, totalQuantity } = useCart();
  const [loading, setLoading] = useState(true);
  const [optimised, setOptimised] = useState({ minGarages: [], bestPrice: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOfferingsAndOptimise() {
      setLoading(true);
      setError(null);

      try {
        if (!cartItems || cartItems.length === 0) {
          setOptimised({ minGarages: [], bestPrice: null });
          setLoading(false);
          return;
        }

        const res = await fetch("/api/cart/offerings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItems }),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Failed to fetch offerings: ${t}`);
        }

        const data = await res.json();
        // New API returns { offerings, optimisations: { minGarages, bestPrice } }
        const minGarages = data?.optimisations?.minGarages ?? [];
        const bestPrice = data?.optimisations?.bestPrice ?? null;

        setOptimised({ minGarages, bestPrice });
      } catch (e) {
        console.error("Error optimising cart:", e);
        setError(e.message || "Failed to optimise cart");
      } finally {
        setLoading(false);
      }
    }

    fetchOfferingsAndOptimise();
  }, [cartItems]);

  const { minGarages, bestPrice } = optimised;

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
                  key={item.cartItemId || item.id || index}
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

          {/* Total */}
          <div className="mt-8 border-t pt-4 flex justify-between items-center font-semibold text-xl">
            <span>Total ({totalQuantity} items):</span>
            <span>€{!isNaN(totalPrice) ? totalPrice.toFixed(2) : "0.00"}</span>
          </div>
          {/* Optimised Plans */}
          <div className="mt-10 space-y-8">
            <h2 className="text-2xl font-semibold">Optimised Suggestions</h2>

            {/* 🏢 Minimum Garages */}
            <div>
              <h3 className="font-bold">🏢 Minimum Garages</h3>

              {loading ? (
                <p className="text-gray-500">Calculating…</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : minGarages?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Minimum number of garages required:{" "}
                    <span className="font-semibold">
                      {minGarages[0].garages.length}
                    </span>
                  </p>

                  <ul className="space-y-4">
                    {minGarages.map((solution, idx) => (
                      <li key={idx} className="border rounded-md p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-700">
                            Garages:{" "}
                            {solution.garages.map((g) => g.name).join(", ")}
                          </div>
                          <div className="font-semibold">
                            Total: €{solution.total.toFixed(2)}
                          </div>
                        </div>

                        {/* Plan breakdown */}
                        <ul className="mt-3 text-sm list-disc list-inside text-gray-700">
                          {solution.plan.map((entry, i) => (
                            <li key={i}>
                              {entry.quantity} × {entry.name} from {entry.business.name} @ €
                              {entry.price.toFixed(2)}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 text-right">
                          <button
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                            onClick={() => alert("Purchase flow not implemented yet")}
                          >
                            Buy
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-500">
                  No combination of garages could cover all items.
                </p>
              )}
            </div>

            {/* 💶 Best Price (any garages) */}
            <div>
              <h3 className="font-bold">💶 Best Price (Any Garages)</h3>

              {loading ? (
                <p className="text-gray-500">Calculating…</p>
              ) : error ? (
                <p className="text-red-600">{error}</p>
              ) : bestPrice?.plan?.length > 0 ? (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Cheapest option across all garages — total: €
                    {bestPrice.total.toFixed(2)}
                  </p>

                  <ul className="text-sm list-disc list-inside text-gray-700">
                    {bestPrice.plan.map((entry, i) => (
                      <li key={i}>
                        {entry.quantity} × {entry.name} from {entry.business.name} @ €
                        {entry.price.toFixed(2)}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 text-right">
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                      onClick={() => alert("Purchase flow not implemented yet")}
                    >
                      Buy for best price
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No best-price plan found.</p>
              )}
            </div>
                        <CartEmails cartItems={cartItems} />

          </div>
        </>
      )}
    </div>
  );
}
