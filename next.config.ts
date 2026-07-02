import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/portal",
        destination: "/parents",
        permanent: true,
      },
      {
        source: "/portal/:path*",
        destination: "/parents/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/parents",
        destination: "/portal",
      },
      {
        source: "/parents/:path*",
        destination: "/portal/:path*",
      },
    ];
  },
};

// Trigger dev server restart to reload prisma client
export default nextConfig;
