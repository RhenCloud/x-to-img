import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const interDir = join(__dirname, "../../node_modules/@fontsource/inter/files")
const notoDir = join(__dirname, "../../node_modules/@fontsource/noto-sans-sc/files")

const FILES = {
  interRegular: join(interDir, "inter-latin-400-normal.woff"),
  interBold: join(interDir, "inter-latin-700-normal.woff"),
  notoRegular: join(notoDir, "noto-sans-sc-chinese-simplified-400-normal.woff"),
  notoBold: join(notoDir, "noto-sans-sc-chinese-simplified-700-normal.woff"),
}

let fontCache: {
  interRegular: ArrayBuffer
  interBold: ArrayBuffer
  notoRegular: ArrayBuffer
  notoBold: ArrayBuffer
} | null = null

export async function loadFonts() {
  if (fontCache) return fontCache

  const [interRegular, interBold, notoRegular, notoBold] = await Promise.all([
    Bun.file(FILES.interRegular).arrayBuffer(),
    Bun.file(FILES.interBold).arrayBuffer(),
    Bun.file(FILES.notoRegular).arrayBuffer(),
    Bun.file(FILES.notoBold).arrayBuffer(),
  ])

  fontCache = { interRegular, interBold, notoRegular, notoBold }
  return fontCache
}

export function getSatoriFonts(fonts: Awaited<ReturnType<typeof loadFonts>>) {
  return [
    {
      name: "Inter",
      data: fonts.interRegular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Inter",
      data: fonts.interBold,
      weight: 700 as const,
      style: "normal" as const,
    },
    {
      name: "Noto Sans SC",
      data: fonts.notoRegular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Noto Sans SC",
      data: fonts.notoBold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ]
}
