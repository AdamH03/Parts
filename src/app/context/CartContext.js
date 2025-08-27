// src/context/CartContext.jsx
"use client";

import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  function addToCart(item, quantity = 1) {
    setCartItems((prevItems) => {
      // Ensure we store a clean serviceId without UI suffixes
      const cleanServiceId =
        item.serviceId?.split("-")[0] ?? item.id.split("-")[0];

      // Unique cart item ID for UI purposes
      const cartItemId = `${cleanServiceId}-${Date.now()}`;

      // Find an existing cart entry for the same serviceId
      const existingItem = prevItems.find(
        (i) => i.serviceId === cleanServiceId
      );

      const availableStock = item.qty ?? Infinity;
      const requestedQuantity = Math.min(quantity, availableStock);

      if (existingItem) {
        const newQuantity = existingItem.quantity + requestedQuantity;
        if (newQuantity > availableStock) {
          return prevItems; // prevent exceeding stock
        }
        return prevItems.map((i) =>
          i.serviceId === cleanServiceId
            ? { ...i, quantity: newQuantity }
            : i
        );
      }

      // Add as a new cart entry with preserved data
      return [
        ...prevItems,
        {
          ...item,
          cartItemId,     // for UI key uniqueness
          serviceId: cleanServiceId, // clean DB key for lookups
          quantity: requestedQuantity,
        },
      ];
    });
  }

  const totalQuantity = cartItems.reduce(
    (acc, item) => acc + (item.quantity ?? 0),
    0
  );

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 0),
    0
  );

  return (
    <CartContext.Provider
      value={{ cartItems, setCartItems, addToCart, totalQuantity, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

    function setSuggestedCartItems(suggestedItems) {
      setCartItems(suggestedItems.map(item => ({
        ...item,
        quantity: item.quantity ?? 1,
        cartItemId: `${item.serviceId}-${Date.now()}`,
      })));
    }

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
