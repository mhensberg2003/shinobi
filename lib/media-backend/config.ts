import "server-only";

export type MediaBackendConfig = {
  baseUrl: string;
  secret: string;
};

export function getMediaBackendConfig(): MediaBackendConfig | null {
  const baseUrl = process.env.SHINOBI_BACKEND_URL?.trim();
  const secret = process.env.SHINOBI_BACKEND_SECRET?.trim();

  if (!baseUrl || !secret) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    secret,
  };
}

export function requireMediaBackendConfig(): MediaBackendConfig {
  const config = getMediaBackendConfig();

  if (!config) {
    throw new Error("Missing SHINOBI_BACKEND_URL or SHINOBI_BACKEND_SECRET.");
  }

  return config;
}
