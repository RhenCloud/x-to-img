import { Hono } from "hono"
import type { ConvertRequest } from "../types"
import { parseIdFromURL, fetchTweetData } from "../services/tweet-fetcher"
import { renderTweetToPNG } from "../services/render.tsx"

const convertRoute = new Hono()

convertRoute.get("/convert", async (c) => {
  const url = c.req.query("url")
  const theme = (c.req.query("theme") || "light") as ConvertRequest["theme"]

  if (!url) {
    return c.json({ success: false, error: "Missing 'url' query parameter" }, 400)
  }

  return handleConvert(c, { url, theme })
})

convertRoute.post("/convert", async (c) => {
  let body: ConvertRequest
  try {
    body = await c.req.json<ConvertRequest>()
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400)
  }

  if (!body.url) {
    return c.json({ success: false, error: "Missing 'url' in request body" }, 400)
  }

  return handleConvert(c, body)
})

async function handleConvert(c: any, req: ConvertRequest) {
  const tweetId = parseIdFromURL(req.url)
  if (!tweetId) {
    return c.json(
      {
        success: false,
        error:
          "Invalid tweet URL. Expected format: https://x.com/user/status/123 or https://twitter.com/user/status/123",
      },
      400
    )
  }

  try {
    const tweetData = await fetchTweetData(tweetId)
    const kv = c.env?.FONT_KV
    const image = await renderTweetToPNG(tweetData, req.theme || "light", kv)

    c.header("Content-Type", "image/png")
    c.header("Cache-Control", "public, max-age=3600")
    return c.body(image)
  } catch (err: any) {
    console.error("Conversion error:", err.message)
    return c.json(
      { success: false, error: err.message || "Internal server error" },
      500
    )
  }
}

export default convertRoute
