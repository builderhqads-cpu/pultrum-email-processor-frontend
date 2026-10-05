import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Build/version info (Renato 2026-10-05): shown in the app so "did the fix go
// up?" is answerable at a glance. deploy.sh can pass BUILD_SHA/BUILD_TIME; when
// absent we fall back to the local git short SHA (dev) or "dev".
function gitShortSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

function appVersion(): string {
  try {
    return (
      JSON.parse(readFileSync("./package.json", "utf8")).version ?? "0.0.0"
    );
  } catch {
    return "0.0.0";
  }
}

const buildSha = process.env.BUILD_SHA || gitShortSha() || "dev";
const buildTime = process.env.BUILD_TIME || new Date().toISOString();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion(),
    NEXT_PUBLIC_BUILD_SHA: buildSha,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
  },
};

export default withNextIntl(nextConfig);
