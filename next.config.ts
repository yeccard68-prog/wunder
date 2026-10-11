import type { NextConfig } from "next";

// Static export: the app ships as plain HTML/JS so Capacitor can wrap it
// into an Android app (see README "Android / Google Play").
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*"], // test on phone via LAN
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
