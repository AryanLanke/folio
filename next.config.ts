import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Only lets the browser load scripts, styles, fonts and requests from Folio itself, and stops
// other sites from showing Folio inside a frame. Inline scripts stay allowed so pages can stay
// static (nonces would make every page render per request). 'wasm-unsafe-eval' and data: in
// connect-src are for the PDF export, whose layout engine is WebAssembly it loads from a data:
// URL; 'unsafe-eval' is only for React in dev.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "connect-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // For older browsers that don't know frame-ancestors
  { key: "X-Frame-Options", value: "DENY" },
  // Don't let the browser guess a file's type and run it as something else
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Other sites see only that a visitor came from Folio, never which page
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The microphone is allowed for Folio itself (voice typing in Build with AI), never for others
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
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
