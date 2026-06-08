# AGENTS.md

x-to-img: Hono API that converts X/Twitter tweets to PNG images. Runs on Cloudflare Workers, Deno Deploy, or Bun.

## 项目概览

- Hono v4 + TypeScript strict + React/Satori (JSX→SVG) + resvg WASM (SVG→PNG)
- 渲染的 tweet 卡片使用 Maple Mono CN 字体（运行时从 GitHub Releases 下载，缓存于 KV）
- tweet 数据来自 `cdn.syndication.twimg.com`（无需认证，需 Chrome UA）
- 多运行时适配：Cloudflare Workers KV / Deno KV / 内存回退

## 关键命令

```bash
# Cloudflare Workers
bun run dev          # wrangler dev
bun run deploy       # wrangler deploy

# Deno
deno task dev        # deno run --watch + 所有权限
deno task deploy     # deployctl deploy

# Bun 本地
bun run bun:dev      # bun run --watch src/index.ts
```

**没有 lint / typecheck / test 脚本。** 验证修改只能靠手动运行。

## 多运行时陷阱

### 导入必须带扩展名（Deno 要求）

所有本地相对导入必须显式带 `.ts` 或 `.tsx` 扩展名，否则 Deno Deploy 部署时会报 `Module not found`：

```ts
// 正确
import { auth } from "./middleware/auth.ts"
import { TweetCard } from "./tweet-card.tsx"

// 错误（Deno 部署失败）
import { auth } from "./middleware/auth"
```

### globalThis 访问必须用 as any

strict mode 下 `globalThis.Deno` 和 `globalThis.process` 会报 TS 类型错误。统一通过 `(globalThis as any)` 访问：

```ts
// 正确
const g = globalThis as any
if (g.Deno) g.Deno.env.get("KEY")

// 错误
globalThis.Deno           // TS 错误
typeof globalThis.process // TS 错误
```

### process.env 在 Deno 中不存在

auth 中间件使用运行时检测模式获取 API_TOKEN。新增代码如需读取环境变量，参考 `src/middleware/auth.ts` 中的模式。

### 入口自启动

`src/index.ts` 底部有 Deno 自启动逻辑 `Deno.serve(app.fetch)`，Cloudflare Workers 则通过 `export default app` 导出。

## 类型系统约定

- Hono app 使用泛型声明 Bindings 和 Variables 类型（见 `src/index.ts:17`）
- route / middleware 需要对应声明 Variables 类型，否则 `c.get("kv")` 会报 never 类型错误
- 避免 `any`，对运行时桥接代码（如 KV 适配、WASM 导入）使用 `as any` 是允许的
- 所有 import 使用 `type` 关键字导入纯类型

## 架构要点

| 文件                            | 职责                                             |
| ------------------------------- | ------------------------------------------------ |
| `src/index.ts`                  | Hono app 组装、运行时检测、中间件注册            |
| `src/routes/convert.ts`         | GET/POST `/api/convert` 处理                     |
| `src/services/tweet-fetcher.ts` | tweet URL 解析 + CDN 抓取 + 数据映射             |
| `src/services/tweet-card.tsx`   | 纯 React 组件，渲染 tweet 卡片布局               |
| `src/services/render.tsx`       | Satori SVG 生成 + resvg PNG 光栅化               |
| `src/services/font.ts`          | 手动 ZIP 解析 + 字体提取 + KV 缓存               |
| `src/services/kv.ts`            | CF Workers KV / Deno KV 统一接口                 |
| `src/middleware/auth.ts`        | Bearer token 认证（通过 API_TOKEN 环境变量启用） |
| `src/types.ts`                  | 共享 TypeScript 类型定义                         |

## 关键注意

- **字体下载量大**：ZIP 约 140MB，`font.ts` 限制 200MB。冷启动首请求会有明显延迟。
- **resvg WASM**：`render.tsx` 优先从 `node_modules` 加载，失败则回退到 jsdelivr / unpkg CDN。
- **Deno KV 需 `--unstable-kv` 标志**，已在 `deno.jsonc` 任务中配置。
- 没有新增依赖之前先确认是否已有类似工具可用（pako 已用于 inflate，resvg 已用于 SVG→PNG）。

## 行为规则

- 修改代码前先阅读相邻文件和调用链
- 最小化修改范围，优先局部改动
- 不要绕过 TypeScript 类型系统
- 新增依赖必须能说明原因
- 所有改动需在 Cloudflare Workers 和 Deno Deploy 两个运行时都兼容
