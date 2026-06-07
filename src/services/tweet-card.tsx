import type { CSSProperties } from "react"
import type { TweetData } from "../types"

const S = (props: CSSProperties) => props

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function codepointToTwemojiSVG(cp: string): string {
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${cp}.svg`
}

function charToTwemojiSVG(char: string): string {
  const cp = char.codePointAt(0)?.toString(16) || ""
  return codepointToTwemojiSVG(cp)
}

const EMOJI_REGEX =
  /(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?)(?:\u200D(?:\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?))*/gu

function parseTextAndEmoji(text: string): Array<
  | { type: "text"; text: string; url?: never }
  | { type: "emoji"; url: string; char: string; text?: never }
> {
  if (!text) return []
  const parts: Array<{
    type: "text" | "emoji"
    text?: string
    url?: string
    char?: string
  }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  EMOJI_REGEX.lastIndex = 0
  while ((match = EMOJI_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", text: text.slice(lastIndex, match.index) })
    }
    parts.push({
      type: "emoji",
      url: charToTwemojiSVG(match[0]),
      char: match[0],
    })
    lastIndex = EMOJI_REGEX.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", text: text.slice(lastIndex) })
  }

  return parts as any
}

function InlineEmojiText({
  text,
  style,
  emojiSize = 22,
}: {
  text: string
  style: CSSProperties
  emojiSize?: number
}) {
  const parts = parseTextAndEmoji(text)
  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === "emoji") {
          return (
            <img
              key={i}
              src={part.url}
              width={emojiSize}
              height={emojiSize}
              style={S({ verticalAlign: "middle" })}
            />
          )
        }
        return (
          <span key={i} style={style}>
            {part.text}
          </span>
        )
      })}
    </span>
  )
}

function renderRichLine(
  line: string,
  colors: ThemeColors
): Array<{ type: "text" | "emoji"; text?: string; url?: string }> {
  const parts = parseTextAndEmoji(line)
  const result: Array<any> = []

  for (const part of parts) {
    if (part.type === "emoji") {
      result.push(part)
      continue
    }
    result.push({ type: "text", text: part.text })
  }

  return result
}

interface ThemeColors {
  bg: string
  text: string
  secondary: string
  border: string
  link: string
}

const THEMES: Record<string, ThemeColors> = {
  light: { bg: "#ffffff", text: "#0f1419", secondary: "#536471", border: "#cfd9de", link: "#1d9bf0" },
  dim: { bg: "#15202b", text: "#f7f9f9", secondary: "#8b98a5", border: "#38444d", link: "#1d9bf0" },
  dark: { bg: "#000000", text: "#e7e9ea", secondary: "#71767b", border: "#2f3336", link: "#1d9bf0" },
}

function QuotedTweet({ tweet }: { tweet: TweetData }) {
  const colors = THEMES.light
  const avatar = tweet.author.avatar_url.replace("_normal", "_200x200")

  return (
    <div
      style={S({
        display: "flex",
        flexDirection: "column",
        borderWidth: "1px",
        borderColor: colors.border,
        borderRadius: "16px",
        padding: "12px",
        marginTop: "12px",
      })}
    >
      <div style={S({ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" })}>
        <img
          src={avatar}
          width={20}
          height={20}
          style={S({ borderRadius: "50%" })}
        />
        <InlineEmojiText
          text={tweet.author.name}
          style={S({ fontSize: "13px", fontWeight: 700, color: colors.text })}
          emojiSize={18}
        />
        <span style={S({ fontSize: "13px", color: colors.secondary })}>
          @{tweet.author.screen_name}
        </span>
      </div>
      <div
        style={S({
          display: "flex",
          flexDirection: "column",
          fontSize: "14px",
          color: colors.text,
        })}
      >
        {renderTweetBody(tweet.text, colors)}
      </div>
    </div>
  )
}

function renderTweetBody(text: string, colors: ThemeColors) {
  const lines = text.split("\n")
  return lines.map((line, i) => {
    const segments = renderRichLine(line, colors)
    const children = segments.map((seg, j) => {
      if (seg.type === "emoji") {
        return (
          <img
            key={j}
            src={seg.url}
            width={24}
            height={24}
            style={S({ verticalAlign: "middle" })}
          />
        )
      }
      return (
        <span key={j} style={S({ color: colors.text })}>
          {seg.text}
        </span>
      )
    })

    return (
      <div
        key={i}
        style={S({
          display: "flex",
          flexWrap: "wrap",
          marginBottom: i < lines.length - 1 ? "6px" : "0px",
        })}
      >
        {children}
      </div>
    )
  })
}

export function TweetCard({
  tweet,
  theme = "light",
}: {
  tweet: TweetData
  theme?: "light" | "dark" | "dim"
}) {
  const colors = THEMES[theme] || THEMES.light
  const avatar = tweet.author.avatar_url
    ? tweet.author.avatar_url.replace("_normal", "_200x200")
    : ""

  const photos = tweet.media?.filter((m) => m.type === "photo") || []

  return (
    <div
      style={S({
        display: "flex",
        flexDirection: "column",
        width: "560px",
        backgroundColor: colors.bg,
        padding: "20px",
        fontFamily: "Inter, Noto Sans SC",
      })}
    >
      <div style={S({ display: "flex", gap: "12px" })}>
        <img
          src={avatar}
          width={48}
          height={48}
          style={S({ borderRadius: "50%" })}
        />
        <div
          style={S({
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: "4px",
          })}
        >
          <div style={S({ display: "flex", alignItems: "center", gap: "4px" })}>
            <InlineEmojiText
              text={tweet.author.name}
              style={S({ fontSize: "15px", fontWeight: 700, color: colors.text })}
              emojiSize={20}
            />
            <span style={S({ fontSize: "15px", color: colors.secondary })}>
              @{tweet.author.screen_name}
            </span>
          </div>

          <div
            style={S({
              display: "flex",
              flexDirection: "column",
              fontSize: "23px",
              lineHeight: 1.3,
              color: colors.text,
            })}
          >
            {renderTweetBody(tweet.text, colors)}
          </div>

          {photos.map((m, i) => (
            <img
              key={i}
              src={m.url}
              style={S({
                width: "100%",
                borderRadius: "16px",
                marginTop: "12px",
              })}
            />
          ))}

          {tweet.quoted_tweet && <QuotedTweet tweet={tweet.quoted_tweet} />}

          <div
            style={S({
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "12px",
              fontSize: "15px",
              color: colors.secondary,
            })}
          >
            <span>{formatTime(tweet.created_at)}</span>
            <span>·</span>
            <span>{formatDate(tweet.created_at)}</span>
            {tweet.metrics.views !== null && (
              <>
                <span>·</span>
                <span style={S({ fontWeight: 700, color: colors.text })}>
                  {formatNumber(tweet.metrics.views)} Views
                </span>
              </>
            )}
          </div>

          <div
            style={S({
              display: "flex",
              gap: "20px",
              marginTop: "12px",
              borderTopWidth: "1px",
              borderTopColor: colors.border,
              paddingTop: "12px",
              fontSize: "13px",
            })}
          >
            <span style={S({ color: colors.secondary })}>
              <span style={S({ fontWeight: 700, color: colors.text })}>
                {formatNumber(tweet.metrics.retweets)}
              </span>{" "}
              Reposts
            </span>
            <span style={S({ color: colors.secondary })}>
              <span style={S({ fontWeight: 700, color: colors.text })}>
                {formatNumber(tweet.metrics.likes)}
              </span>{" "}
              Likes
            </span>
            <span style={S({ color: colors.secondary })}>
              <span style={S({ fontWeight: 700, color: colors.text })}>
                {formatNumber(tweet.metrics.replies)}
              </span>{" "}
              Replies
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
