import type { NextConfig } from "next";
import { execFileSync } from "child_process";

let gitHash = "unknown";
try {
  gitHash = execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();
} catch {
  // Vercel builds don't have a git repo — use VERCEL_GIT_COMMIT_SHA if available
  gitHash = (process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown").slice(0, 7);
}

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_GIT_HASH: gitHash,
  },
};

export default nextConfig;
