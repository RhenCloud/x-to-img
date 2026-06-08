import { createMiddleware } from "hono/factory";

const g = globalThis as any

const API_TOKEN = (() => {
  if (g.Deno) return g.Deno.env.get("API_TOKEN")
  if (g.process) return g.process.env?.API_TOKEN
  return undefined
})();

export const auth = createMiddleware(async (c, next) => {
  if (!API_TOKEN) {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  if (token !== API_TOKEN) {
    return c.json({ success: false, error: "Invalid token" }, 401);
  }

  return next();
});
