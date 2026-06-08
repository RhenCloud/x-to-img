const FONT_ZIP_URL = "https://github.com/subframe7536/maple-font/releases/download/v7.9/MapleMono-CN.zip";

const TARGET_FILES = ["MapleMono-CN-Regular.ttf", "MapleMono-CN-Bold.ttf"] as const;

const KV_KEYS = {
  regular: "font:maple-mono-cn:regular",
  bold: "font:maple-mono-cn:bold",
} as const;

interface FontCache {
  regular: ArrayBuffer;
  bold: ArrayBuffer;
}

let fontCache: FontCache | null = null;

function readU16(buf: Uint8Array, off: number) {
  return (buf[off] | (buf[off + 1] << 8)) >>> 0;
}

function readU32(buf: Uint8Array, off: number) {
  return (buf[off] | (buf[off + 1] << 8) | (buf[off + 2] << 16) | (buf[off + 3] << 24)) >>> 0;
}

function findEOCD(buf: Uint8Array) {
  const maxSearch = Math.min(buf.length, 65557);
  for (let i = buf.length - 22; i >= buf.length - maxSearch; i--) {
    if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x05 && buf[i + 3] === 0x06) {
      return i;
    }
  }
  return -1;
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(compressed);
  writer.close();
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

async function extractFonts(zipped: ArrayBuffer, filenames: readonly string[]) {
  const buf = new Uint8Array(zipped);
  const eocdOff = findEOCD(buf);
  if (eocdOff < 0) throw new Error("Invalid ZIP: EOCD not found");

  const entriesTotal = readU16(buf, eocdOff + 10);
  const cdOff = readU32(buf, eocdOff + 16);

  const result = new Map<string, ArrayBuffer>();
  const inflatePromises: Promise<void>[] = [];

  let pos = cdOff;
  for (let i = 0; i < entriesTotal; i++) {
    const sig = readU32(buf, pos);
    if (sig !== 0x02014b50) throw new Error("Invalid central directory entry");
    const method = readU16(buf, pos + 10);
    const compSize = readU32(buf, pos + 20);
    const uncompSize = readU32(buf, pos + 24);
    const nameLen = readU16(buf, pos + 28);
    const extraLen = readU16(buf, pos + 30);
    const commentLen = readU16(buf, pos + 32);
    const localOff = readU32(buf, pos + 42);

    const name = new TextDecoder().decode(buf.subarray(pos + 46, pos + 46 + nameLen));

    if (filenames.includes(name)) {
      const lhPos = localOff;
      const lhNameLen = readU16(buf, lhPos + 26);
      const lhExtraLen = readU16(buf, lhPos + 28);
      const dataOff = lhPos + 30 + lhNameLen + lhExtraLen;

      if (method === 0) {
        result.set(name, buf.slice(dataOff, dataOff + uncompSize).buffer as ArrayBuffer)
      } else if (method === 8) {
        const compressed = buf.slice(dataOff, dataOff + compSize)
        inflatePromises.push(
          (async () => {
            const decompressed = await inflateRaw(new Uint8Array(compressed))
            result.set(name, decompressed.buffer as ArrayBuffer)
          })(),
        )
      } else {
        throw new Error(`Unsupported compression method: ${method}`);
      }
    }

    pos += 46 + nameLen + extraLen + commentLen;
  }

  await Promise.all(inflatePromises);
  return result;
}

async function downloadAndExtract(): Promise<FontCache> {
  const resp = await fetch(FONT_ZIP_URL);
  if (!resp.ok) throw new Error(`Failed to download fonts: ${resp.status}`);
  const zipBuf = await resp.arrayBuffer();

  const files = await extractFonts(zipBuf, TARGET_FILES);
  const regular = files.get("MapleMono-CN-Regular.ttf");
  const bold = files.get("MapleMono-CN-Bold.ttf");
  if (!regular || !bold) throw new Error("Font files not found in zip");

  return { regular, bold };
}

export async function loadFonts(kv?: KVNamespace): Promise<FontCache> {
  if (fontCache) return fontCache;

  if (kv) {
    const [cachedRegular, cachedBold] = await Promise.all([
      kv.get(KV_KEYS.regular, "arrayBuffer"),
      kv.get(KV_KEYS.bold, "arrayBuffer"),
    ]);

    if (cachedRegular && cachedBold) {
      fontCache = { regular: cachedRegular as ArrayBuffer, bold: cachedBold as ArrayBuffer }
      return fontCache
    }
  }

  const fonts = await downloadAndExtract();

  if (kv) {
    await Promise.all([kv.put(KV_KEYS.regular, fonts.regular), kv.put(KV_KEYS.bold, fonts.bold)]);
  }

  fontCache = fonts;
  return fontCache;
}

export function getSatoriFonts(fonts: FontCache) {
  return [
    {
      name: "Maple Mono CN",
      data: fonts.regular,
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "Maple Mono CN",
      data: fonts.bold,
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}
