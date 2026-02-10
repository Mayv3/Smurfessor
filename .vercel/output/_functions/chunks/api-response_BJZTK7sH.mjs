function ok(data) {
  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
function err(code, message, status = 500, detail) {
  return new Response(
    JSON.stringify({ ok: false, error: { code, message, status, detail } }),
    {
      status,
      headers: { "Content-Type": "application/json" }
    }
  );
}

export { err as e, ok as o };
