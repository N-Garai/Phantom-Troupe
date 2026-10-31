import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* fully static — the landing site is just files; any static host serves it
     (see render.yaml). No server, no runtime, nothing to keep alive. */
  output: "export",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
