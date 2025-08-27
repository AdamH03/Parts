"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext"; // adjust path
import { ShoppingCartIcon } from "@heroicons/react/24/outline"; // or any icon you prefer

export default function CartButton() {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  return (
    <>
      <button
        onClick={() => setCartOpen(!cartOpen)}
        className="relative p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
        aria-label="Toggle cart"
        type="button"
      >
        <ShoppingCartIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        {cartItems.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {totalQuantity}
          </span>
        )}
      </button>

      {cartOpen && (
        <div className="fixed top-16 right-4 w-80 max-h-[70vh] overflow-auto bg-white dark:bg-gray-800 shadow-lg border border-gray-300 dark:border-gray-700 rounded p-4 z-50">
          <h3 className="text-lg font-semibold mb-4">Your Cart</h3>
          {cartItems.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">Your cart is empty.</p>
          ) : (
            <>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {cartItems.map((item) => (
                  <li key={item.id} className="py-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {item.quantity} × €{item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-4">
                <p className="font-semibold text-right">Total: €{totalPrice.toFixed(2)}</p>
                <button
                  onClick={() => {
                    clearCart();
                    setCartOpen(false);
                  }}
                  className="mt-2 w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white py-2 rounded"
                >
                  Clear Cart
                </button>
                <Link
                  href="/cart"
                  onClick={() => setCartOpen(false)}
                  className="block mt-2 text-center bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white py-2 rounded"
                >
                  Go to Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
