import { b as bootstrap } from '../../../chunks/index_F0teeQqx.mjs';
import { o as ok, e as err } from '../../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async () => {
  try {
    const data = await bootstrap();
    return ok(data);
  } catch (e) {
    return err(
      "DDRAGON_ERROR",
      "Failed to fetch Data Dragon assets",
      500,
      String(e)
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
