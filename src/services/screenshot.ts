import { chromium, type Browser } from "playwright"

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    console.log("[playwright] launching browser...")
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    })
    console.log("[playwright] browser launched")
  }
  return browser
}

export async function screenshotHTML(html: string): Promise<Buffer> {
  const b = await getBrowser()
  const page = await b.newPage()

  try {
    await page.setContent(html, { waitUntil: "networkidle" })

    const element = await page.$("#tweet")
    if (!element) {
      throw new Error("Tweet element not found in rendered HTML")
    }

    const buffer = await element.screenshot({
      type: "png",
      omitBackground: false,
    })

    return buffer
  } finally {
    await page.close()
  }
}

export async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}
