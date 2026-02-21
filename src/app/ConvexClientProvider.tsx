"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  // Throwing here makes the error obvious in dev + Vercel logs.
  // In production you may want a nicer error boundary.
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL. Set it in .env.local and in Vercel project env vars."
  );
}

const client = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
