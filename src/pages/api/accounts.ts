import type { APIRoute } from "astro";
import { ACCOUNTS } from "../../config/accounts";
import { ok } from "../../lib/api-response";

export const GET: APIRoute = async () => {
  return ok(ACCOUNTS);
};
