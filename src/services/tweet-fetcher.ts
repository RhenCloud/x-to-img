import type { TweetData } from "../types"

function parseIdFromURL(url: string): string | null {
  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status(?:es)?\/(\d+)/,
  ]
  for (const p of patterns) {
    const match = url.match(p)
    if (match) return match[1]
  }
  return null
}

function extractFilename(cdnURL: string): string {
  const parts = cdnURL.split("/")
  return parts.pop() || ""
}

export async function fetchTweetData(tweetId: string): Promise<TweetData> {
  const apiURL = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`

  const res = await fetch(apiURL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `Failed to fetch tweet data: ${res.status} ${res.statusText} - ${text}`
    )
  }

  const raw = (await res.json()) as Record<string, any>

  const media: TweetData["media"] = []
  if (raw.mediaDetails && Array.isArray(raw.mediaDetails)) {
    for (const m of raw.mediaDetails) {
      const type = m.type === "photo" ? "photo" : "video"
      const url = m.media_url_https || m.media_url || ""
      media.push({ type, url, width: m.width, height: m.height })
    }
  }

  const author = raw.user || raw.core?.user_results?.result

  let quotedTweet: TweetData | null = null
  if (raw.quoted_tweet) {
    quotedTweet = parseRawTweet(raw.quoted_tweet)
  }

  return {
    id: raw.id_str || raw.id || tweetId,
    text: raw.text || raw.full_text || "",
    author: {
      name: author?.name || "Unknown",
      screen_name: author?.screen_name || author?.legacy?.screen_name || "",
      avatar_url: author?.profile_image_url_https || author?.legacy?.profile_image_url_https || "",
    },
    created_at: raw.created_at || new Date().toISOString(),
    media,
    metrics: {
      likes: raw.favorite_count ?? raw.likes ?? 0,
      retweets: raw.retweet_count ?? raw.retweets ?? 0,
      replies: raw.reply_count ?? raw.conversation_count ?? 0,
      views: raw.views?.count ? parseInt(raw.views.count, 10) : null,
    },
    quoted_tweet: quotedTweet,
  }
}

function parseRawTweet(raw: Record<string, any>): TweetData {
  const media: TweetData["media"] = []
  if (raw.mediaDetails) {
    for (const m of raw.mediaDetails) {
      media.push({
        type: m.type === "photo" ? "photo" : "video",
        url: m.media_url_https || m.media_url || "",
        width: m.width,
        height: m.height,
      })
    }
  }

  return {
    id: raw.id_str || raw.id || "",
    text: raw.text || raw.full_text || "",
    author: {
      name: raw.user?.name || "Unknown",
      screen_name: raw.user?.screen_name || "",
      avatar_url: raw.user?.profile_image_url_https || "",
    },
    created_at: raw.created_at || new Date().toISOString(),
    media,
    metrics: {
      likes: raw.favorite_count ?? 0,
      retweets: raw.retweet_count ?? 0,
      replies: raw.reply_count ?? 0,
      views: null,
    },
  }
}

export { parseIdFromURL }
