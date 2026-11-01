import type { NextConfig } from "next";

const apiOrigin = process.env.SEATCRAFT_API_ORIGIN ?? "http://localhost:5199";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Emits .next/standalone so the Docker image ships only the files it needs.
  output: "standalone",
  // Kept off: the badge collided with the topbar chips and the mobile nav.
  // Compile and runtime errors still surface in the terminal and error overlay.
  devIndicators: false,
  env: {
    // Shown in the UI as a hint only — every call is made server-side.
    NEXT_PUBLIC_API_ORIGIN: apiOrigin
  }
};

export default nextConfig;
