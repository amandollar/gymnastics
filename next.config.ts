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
      { source: "/login", destination: "/admin/login", permanent: true },
      { source: "/dashboard", destination: "/admin/dashboard", permanent: true },
      { source: "/plans", destination: "/admin/plans", permanent: true },
      { source: "/coaches", destination: "/admin/coaches", permanent: true },
      { source: "/coaches/attendance", destination: "/admin/coaches/attendance", permanent: true },
      { source: "/coaches/:id", destination: "/admin/coaches/:id", permanent: true },
      { source: "/attendance", destination: "/admin/attendance", permanent: true },
      { source: "/enquiries", destination: "/admin/enquiries", permanent: true },
      { source: "/settings", destination: "/admin/settings", permanent: true },
      { source: "/students", destination: "/admin/students", permanent: true },
      { source: "/students/new", destination: "/admin/students/new", permanent: true },
      { source: "/students/bulk-upload", destination: "/admin/students/bulk-upload", permanent: true },
      { source: "/students/print-ids", destination: "/admin/students/print-ids", permanent: true },
      { source: "/students/:id", destination: "/admin/students/:id", permanent: true },
      { source: "/students/:id/edit", destination: "/admin/students/:id/edit", permanent: true },
    ];
  },
};

// Trigger dev server restart to reload prisma client
export default nextConfig;
