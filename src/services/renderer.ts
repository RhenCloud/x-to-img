import type { TweetData } from "../types"

export function buildTweetHTML(tweet: TweetData, theme: "light" | "dark" | "dim" = "light"): string {
  const themes = {
    light: {
      bg: "#ffffff",
      text: "#0f1419",
      secondary: "#536471",
      border: "#eff3f4",
      link: "#1d9bf0",
      metricBg: "#f7f9f9",
    },
    dim: {
      bg: "#15202b",
      text: "#f7f9f9",
      secondary: "#8b98a5",
      border: "#38444d",
      link: "#1d9bf0",
      metricBg: "#1e2732",
    },
    dark: {
      bg: "#000000",
      text: "#e7e9ea",
      secondary: "#71767b",
      border: "#2f3336",
      link: "#1d9bf0",
      metricBg: "#16181c",
    },
  }

  const t = themes[theme]
  const avatar = tweet.author.avatar_url
    ? tweet.author.avatar_url.replace("_normal", "_200x200")
    : ""

  function formatNumber(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
  }

  function escapeHTML(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
  }

  function renderTweetText(text: string): string {
    let html = escapeHTML(text)
    html = html.replace(
      /(https?:\/\/[^\s]+)/g,
      `<a href="$1" style="color:${t.link};text-decoration:none">$1</a>`
    )
    html = html.replace(/(@\w+)/g, `<span style="color:${t.link}">$1</span>`)
    html = html.replace(/(#\w+)/g, `<span style="color:${t.link}">$1</span>`)
    html = html.replace(/\n/g, "<br>")
    return html
  }

  function renderMedia(media: TweetData["media"]): string {
    if (!media || media.length === 0) return ""
    return media
      .filter((m) => m.type === "photo")
      .map(
        (m) =>
          `<img src="${escapeHTML(m.url)}" style="display:block;width:100%;border-radius:16px;border:1px solid ${t.border};margin-top:12px" />`
      )
      .join("")
  }

  function renderQuotedTweet(qt: TweetData): string {
    return `
    <div style="border:1px solid ${t.border};border-radius:16px;padding:12px;margin-top:12px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <img src="${escapeHTML(qt.author.avatar_url.replace("_normal", "_200x200"))}" width="20" height="20" style="border-radius:50%" />
        <span style="font-weight:700;font-size:13px;color:${t.text}">${escapeHTML(qt.author.name)}</span>
        <span style="font-size:13px;color:${t.secondary}">@${escapeHTML(qt.author.screen_name)}</span>
      </div>
      <div style="font-size:14px;color:${t.text};word-wrap:break-word">${renderTweetText(qt.text)}</div>
      ${renderMedia(qt.media)}
    </div>`
  }

  const mediaHTML = renderMedia(tweet.media)
  const quotedHTML = tweet.quoted_tweet ? renderQuotedTweet(tweet.quoted_tweet) : ""

  const dateStr = new Date(tweet.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const timestamp = new Date(tweet.created_at).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: ${t.bg};
    color: ${t.text};
    display: flex;
    justify-content: center;
    -webkit-font-smoothing: antialiased;
  }
  #tweet {
    width: 560px;
    padding: 16px 20px;
  }
</style>
</head>
<body>
<div id="tweet">
  <div style="display:flex;gap:10px">
    <img src="${escapeHTML(avatar)}" width="48" height="48" style="border-radius:50%" />
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
        <span style="font-weight:700;font-size:15px;color:${t.text}">${escapeHTML(tweet.author.name)}</span>
        ${tweet.author.screen_name ? `<span style="font-size:15px;color:${t.secondary}">@${escapeHTML(tweet.author.screen_name)}</span>` : ""}
      </div>
      <div style="font-size:23px;line-height:1.3;word-wrap:break-word;margin-top:4px;color:${t.text}">
        ${renderTweetText(tweet.text)}
      </div>
      ${mediaHTML}
      ${quotedHTML}
      <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
        <span style="font-size:15px;color:${t.secondary}">${timestamp}</span>
        <span style="font-size:15px;color:${t.secondary}">·</span>
        <span style="font-size:15px;color:${t.secondary}">${dateStr}</span>
        ${tweet.metrics.views !== null ? `<span style="font-size:15px;color:${t.secondary}">·</span><span style="font-size:15px;color:${t.secondary};font-weight:700;color:${t.text}">${formatNumber(tweet.metrics.views)} Views</span>` : ""}
      </div>
      <div style="border-top:1px solid ${t.border};margin-top:12px;padding-top:8px;display:flex;gap:20px;font-size:13px">
        <span style="color:${t.secondary}"><strong style="color:${t.text}">${formatNumber(tweet.metrics.retweets)}</strong> Reposts</span>
        <span style="color:${t.secondary}"><strong style="color:${t.text}">${formatNumber(tweet.metrics.likes)}</strong> Likes</span>
        <span style="color:${t.secondary}"><strong style="color:${t.text}">${formatNumber(tweet.metrics.replies)}</strong> Replies</span>
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}
