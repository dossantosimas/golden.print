import type { NextConfig } from "next";
const config: NextConfig = { poweredByHeader: false, distDir: process.env.GOLDEN_PRINT_E2E === "1" ? ".next-e2e" : ".next", devIndicators: false, serverExternalPackages: ["pg"], async headers() { return [{ source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }, { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }, { key: "X-Frame-Options", value: "DENY" }] }]; } }; export default config;

