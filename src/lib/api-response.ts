export function ok<T>(data: T): Response {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function err(
  code: string,
  message: string,
  status = 500,
  detail?: string,
): Response {
  return new Response(
    JSON.stringify({ ok: false, error: { code, message, status, detail } }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}
