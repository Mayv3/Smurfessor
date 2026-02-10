export enum RiotErrorCode {
  NOT_FOUND = "NOT_FOUND",
  NOT_IN_GAME = "NOT_IN_GAME",
  KEY_INVALID = "KEY_INVALID",
  UNAUTHORIZED = "UNAUTHORIZED",
  RATE_LIMITED = "RATE_LIMITED",
  SPECTATOR_UNAVAILABLE = "SPECTATOR_UNAVAILABLE",
  NETWORK_ERROR = "NETWORK_ERROR",
  UNKNOWN = "UNKNOWN",
}

export class RiotApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
    public readonly code: RiotErrorCode,
    public readonly detail: string,
  ) {
    super(`[${code}] ${detail} (${status} ${endpoint})`);
    this.name = "RiotApiError";
  }
}
