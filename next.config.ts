import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this directory to avoid
  // false-positive detection of lockfiles in parent directories.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
