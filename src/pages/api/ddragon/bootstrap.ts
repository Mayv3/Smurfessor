import type { APIRoute } from "astro";
import { bootstrap } from "../../../lib/ddragon/index";
import { ok, err } from "../../../lib/api-response";

export const GET: APIRoute = async () => {
  try {
    const data = await bootstrap();
    return ok(data);
  } catch (e) {
    return err(
      "DDRAGON_ERROR",
      "Failed to fetch Data Dragon assets",
      500,
      String(e),
    );
  }
};
