import "server-only";

export type SeedboxConfig = {
  apiUrl: string;
  username: string;
  password: string;
  httpBaseUrl?: string;
  httpPathRoot?: string;
  httpUsername: string;
  httpPassword: string;
};

export function getSeedboxConfig(): SeedboxConfig | null {
  const apiUrl = process.env.SEEDBOX_API_URL?.trim() || process.env.SEEDBOX_RPC_URL?.trim();
  const username = process.env.SEEDBOX_API_USER?.trim() || process.env.SEEDBOX_RPC_USER?.trim();
  const password = process.env.SEEDBOX_API_PASSWORD?.trim() || process.env.SEEDBOX_RPC_PASSWORD?.trim();
  const httpBaseUrl = process.env.SEEDBOX_HTTP_BASE_URL?.trim();
  const httpPathRoot = process.env.SEEDBOX_HTTP_PATH_ROOT?.trim();
  const httpUsername = process.env.SEEDBOX_HTTP_USER?.trim();
  const httpPassword = process.env.SEEDBOX_HTTP_PASSWORD?.trim();

  if (!apiUrl || !username || !password) {
    return null;
  }

  return {
    apiUrl,
    username,
    password,
    httpBaseUrl: httpBaseUrl || undefined,
    httpPathRoot: httpPathRoot || undefined,
    httpUsername: httpUsername || username,
    httpPassword: httpPassword || password,
  };
}

export function requireSeedboxConfig(): SeedboxConfig {
  const config = getSeedboxConfig();

  if (!config) {
    throw new Error(
      "Missing seedbox configuration. Populate SEEDBOX_API_URL, SEEDBOX_API_USER, and SEEDBOX_API_PASSWORD.",
    );
  }

  return config;
}
