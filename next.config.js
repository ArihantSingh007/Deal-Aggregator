/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in responses — trivial but standard hardening.
  poweredByHeader: false,

  images: {
    // A wildcard "**" hostname lets anyone pass an arbitrary external image URL
    // through your /_next/image optimization endpoint — effectively turning
    // your server into a free image proxy for other sites, which can run up
    // hosting costs and is a known abuse vector. List real hostnames instead.
    // Add your own CDN / Amazon / Flipkart image hosts here as you add real
    // products — this list only needs to cover hosts actual product images
    // come from, not the retailer sites themselves (amazon.in, flipkart.com
    // never serve the <img> src directly).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" }, // used by seed data only
      { protocol: "https", hostname: "m.media-amazon.com" }, // Amazon product images
      { protocol: "https", hostname: "images-na.ssl-images-amazon.com" },
      { protocol: "https", hostname: "images-eu.ssl-images-amazon.com" },
      { protocol: "https", hostname: "images-fe.ssl-images-amazon.com" },
      { protocol: "https", hostname: "ecx.images-amazon.com" },
      { protocol: "https", hostname: "rukminim1.flixcart.com" }, // Flipkart product images
      { protocol: "https", hostname: "rukminim2.flixcart.com" },
      { protocol: "https", hostname: "rukmin1.flixcart.com" },
      { protocol: "https", hostname: "rukmin2.flixcart.com" },
      { protocol: "https", hostname: "img1a.flixcart.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google OAuth user avatars
    ],
  },

  async headers() {
    // A "safe baseline" CSP: script-src/style-src need 'unsafe-inline' because
    // Next.js injects an inline hydration script and Framer Motion animates
    // via inline `style` attributes — blocking those would break the entire
    // site, not just tighten it. This is a genuine, well-worn trade-off in
    // the Next.js ecosystem, not a workaround specific to this app. What it
    // still buys you: no arbitrary external script/style can be loaded
    // (script-src/style-src 'self'), no clickjacking (frame-ancestors),
    // no base-tag or form-action hijacking, no plugin/object embeds.
    // Upgrading to a nonce-based CSP (which would drop 'unsafe-inline' for
    // scripts) requires generating a per-request nonce in middleware and
    // threading it through next/script — a bigger change, intentionally not
    // done here blind since getting it wrong breaks the whole app.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.vercel-insights.com https://*.vercel-scripts.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com",
      "object-src 'none'",
    ].join("; ");

    return [
      {
        // Applies to every route, including API routes.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
          // Only meaningful once actually served over HTTPS in production —
          // harmless locally over http://localhost.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
