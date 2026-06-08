import satori from "satori"
import { Resvg, initWasm } from "@resvg/resvg-wasm"
import { loadFonts, getSatoriFonts } from "./font.ts"
import type { FontKV } from "./kv.ts"
import { TweetCard } from "./tweet-card.tsx"
import type { TweetData } from "../types.ts"

let wasmReady = false

async function ensureWasm() {
  if (wasmReady) return

  try {
    const { default: wasmBin } = await import("../../node_modules/@resvg/resvg-wasm/index_bg.wasm")
    await initWasm(wasmBin)
    wasmReady = true
    return
  } catch {}

  for (const url of [
    "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
    "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
  ]) {
    try {
      const resp = await fetch(url)
      if (!resp.ok) continue
      await initWasm(resp)
      wasmReady = true
      return
    } catch {}
  }

  throw new Error("Failed to load resvg WASM")
}

const CARD_W = 560
const SCALE = 3

export async function renderTweetToPNG(
  tweet: TweetData,
  theme: "light" | "dark" | "dim" = "light",
  kv?: FontKV
): Promise<Uint8Array> {
  await ensureWasm()
  const fonts = await loadFonts(kv)
  const satoriFonts = getSatoriFonts(fonts)

  const svg = await satori(
    <TweetCard tweet={tweet} theme={theme} />,
    {
      width: CARD_W,
      fonts: satoriFonts,
    }
  )

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_W * SCALE },
    shapeRendering: 2,
    textRendering: 2,
  })
  return resvg.render().asPng()
}
