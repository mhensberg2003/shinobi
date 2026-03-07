import "server-only";

export type SeedboxConfig = {
  rpcUrl: string;
  username: string;
  password: string;
  httpBaseUrl?: string;
};

export function getSeedboxConfig(): SeedboxConfig | null {
  const rpcUrl = process.env.SEEDBOX_RPC_URL?.trim();
  const username = process.env.SEEDBOX_RPC_USER?.trim();
  const password = process.env.SEEDBOX_RPC_PASSWORD?.trim();
  const httpBaseUrl = process.env.SEEDBOX_HTTP_BASE_URL?.trim();

  if (!rpcUrl || !username || !password) {
    return null;
  }

  return {
    rpcUrl,
    username,
    password,
    httpBaseUrl: httpBaseUrl || undefined,
  };
}

export function requireSeedboxConfig(): SeedboxConfig {
  const config = getSeedboxConfig();

  if (!config) {
    throw new Error(
      "Missing seedbox configuration. Populate SEEDBOX_RPC_URL, SEEDBOX_RPC_USER, and SEEDBOX_RPC_PASSWORD.",
    );
  }

  return config;
}
