# X to Image API

Convert X/Twitter tweets to PNG images.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Hono](https://hono.dev)
- **Browser**: [Playwright](https://playwright.dev)

## Setup

```bash
bun install
bunx playwright install chromium
```

## Usage

```bash
# optional: set an API token for authentication
export API_TOKEN=your-secret-token

bun run dev     # development with hot reload
bun run start   # production
```

Server runs on `http://localhost:3000`.

## Authentication

If `API_TOKEN` env var is set, all `/api/*` routes require:

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
