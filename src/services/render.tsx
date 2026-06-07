import satori from "satori"
import { Resvg, initWasm } from "@resvg/resvg-wasm"
import { loadFonts, getSatoriFonts } from "./font"
import { TweetCard } from "./tweet-card"
import type { TweetData } from "../types"

let wasmReady = false

async function ensureWasm() {
  if (wasmReady) return
  try {
    const wasmBytes = await Bun.file(
      new URL(
        "../../node_modules/@resvg/resvg-wasm/index_bg.wasm",
        import.meta.url
      )
    ).arrayBuffer()
    await initWasm(wasmBytes)
  } catch {
    const cdns = [
      "https://cdn.jsdelivr.net/npm/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
      "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm",
    ]
    for (const url of cdns) {
      try {
        await initWasm(fetch(url))
        break
      } catch {}
    }
  }
  wasmReady = true
}

export async function renderTweetToPNG(
  tweet: TweetData,
  theme: "light" | "dark" | "dim" = "light"
): Promise<Buffer> {
  await ensureWasm()
  const fonts = await loadFonts()
  const satoriFonts = getSatoriFonts(fonts)

  const svg = await satori(
    <TweetCard tweet={tweet} theme={theme} />,
    {
      width: 560,
      fonts: satoriFonts,
    }
  )

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 560 },
  })
  const png = resvg.render().asPng()
  return Buffer.from(png)
}
