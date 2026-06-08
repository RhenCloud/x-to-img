# X to Image API

Convert X/Twitter tweets to PNG images. Deployable on Cloudflare Workers.

## Tech Stack

- **Runtime**: Cloudflare Workers (also runs on [Bun](https://bun.sh))
- **Framework**: [Hono](https://hono.dev)
- **Font**: [Maple Mono CN](https://github.com/subframe7536/maple-font) (via GitHub Releases CDN)
- **Rendering**: [Satori](https://github.com/vercel/satori) + [resvg-wasm](https://github.com/nicedoc/resvg-js)

## Setup

```bash
bun install
```

## Deploy to Cloudflare Workers

```bash
# 1. Create KV namespace (first time only)
npx wrangler kv:namespace create FONT_KV

# 2. Copy the returned id into wrangler.jsonc kv_namespaces[0].id

# 3. Set API token secret (optional)
npx wrangler secret put API_TOKEN

# 4. Deploy
npx wrangler deploy
```

## Local Development

```bash
# Bun
bun run bun:dev

# Workers emulator
npx wrangler dev
```

## Font Caching

Font files (~18MB Regular + Bold TTF) are downloaded from GitHub Releases on first cold start and cached in KV (`FONT_KV`). Subsequent requests read directly from KV, avoiding re-download and ZIP extraction overhead.

## Authentication

If `API_TOKEN` is set, all `/api/*` routes require:

```
Authorization: Bearer <your-secret-token>
```

Otherwise returns `401`. If `API_TOKEN` is not set, no auth required.

## API

### GET /api/convert

```
GET /api/convert?url=<tweet_url>&theme=light|dim|dark
```

### POST /api/convert

```json
POST /api/convert
{
  "url": "https://x.com/user/status/123",
  "theme": "dark"
}
```

Returns `image/png`.

### Health Check

```
GET /health
```
