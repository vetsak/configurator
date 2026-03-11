import type { NextConfig } from "next";
import { execFileSync } from "child_process";

const gitHash = execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_GIT_HASH: gitHash,
  },
};

export default nextConfig;
