import { A as ACCOUNTS } from '../../chunks/accounts_BS9-O4eu.mjs';
import { o as ok } from '../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  return ok(ACCOUNTS);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
