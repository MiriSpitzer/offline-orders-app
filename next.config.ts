import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const revision = crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: ["/", "/order", "/orders", "/stores"].map((url) => ({ url, revision })),
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
