function env(key: string, fallback: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (import.meta as any).env?.[key] ?? process.env[key];
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

export const FEATURES = {
  spectator: env("FEATURE_SPECTATOR", "true") === "true",
  matchHistory: env("FEATURE_MATCH_HISTORY", "false") === "true",
} as const;
