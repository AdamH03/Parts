// app/cart/ClientWrapper.jsx
"use client";

import dynamic from "next/dynamic";

// Use dynamic import here
const CartPage = dynamic(() => import("./CartPage"), { ssr: false });

export default function ClientWrapper({ optimisedPlans }) {
  return <CartPage optimisedPlans={optimisedPlans} />;
}
