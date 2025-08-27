// src/components/CartEmails.jsx
"use client";

import React, { useState } from "react";

export default function CartEmails({ cartItems }) {
  if (!cartItems || cartItems.length === 0) return null;

  // Group cart items by garage/business
  const itemsByGarage = cartItems.reduce((acc, item) => {
    const garageName = item.business?.name || "Unknown Garage";
    if (!acc[garageName]) acc[garageName] = [];
    acc[garageName].push(item);
    return acc;
  }, {});

  // Construct email body per garage
  const emails = Object.entries(itemsByGarage).map(([garageName, items]) => {
    const partsList = items
      .map(i => `${i.name} - Qty: ${i.quantity}`)
      .join("\n");

    const emailBody = `Hello ${garageName},\n\nWe would like to order the following parts:\n${partsList}\n\nThank you.`;
    const email = items[0]?.business?.email || "";

    const mailtoLink = `mailto:${email}?subject=Parts Order&body=${encodeURIComponent(emailBody)}`;

    return { garageName, email, emailBody, mailtoLink };
  });

  return (
    <div className="cart-emails mt-6">
      <h2 className="text-xl font-bold mb-4">Suggested Email(s)</h2>
      <div className="grid gap-4">
        {emails.map(({ garageName, email, emailBody, mailtoLink }) => {
          const [expanded, setExpanded] = useState(false);

          return (
            <div
              key={garageName}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg mb-2">{garageName}</h3>
              <input
                type="text"
                value={email}
                readOnly
                className="w-full border rounded p-2 text-white mb-2"
                onClick={(e) => e.target.select()}
              />
              <div className="mb-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="px-3 py-1 text-black bg-gray-100 rounded hover:bg-gray-400 transition"
                >
                  {expanded ? "Hide Email" : "Show Email"}
                </button>
              </div>
              {expanded && (
                <textarea
                  readOnly
                  value={emailBody}
                  className="w-full border rounded p-2 text-white mb-2 resize-none"
                  rows={Math.min(10, emailBody.split("\n").length + 1)}
                  onClick={(e) => e.target.select()}
                />
              )}
              <a
                href={mailtoLink}
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Send Email
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
