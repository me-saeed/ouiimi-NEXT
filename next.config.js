/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't bake MONGODB_URI into build - read at runtime from .env.production
  // Other secrets can stay here for client-side access if needed
  env: {
    // MONGODB_URI removed - will be read from process.env at runtime (server-side only)
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    // Keep other env vars that might be needed client-side
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic dependencies from server-side bundling
      config.externals = config.externals || [];
      config.externals.push({
        'node-mailjet': 'commonjs node-mailjet',
        'vm2': 'commonjs vm2',
        'coffee-script': 'commonjs coffee-script',
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

