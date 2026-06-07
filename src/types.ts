export interface TweetData {
  id: string
  text: string
  author: {
    name: string
    screen_name: string
    avatar_url: string
  }
  created_at: string
  media: Array<{
    type: "photo" | "video"
    url: string
    width?: number
    height?: number
  }>
  metrics: {
    likes: number
    retweets: number
    replies: number
    views: number | null
  }
  quoted_tweet?: TweetData | null
}

export interface ConvertRequest {
  url: string
  width?: number
  theme?: "light" | "dark" | "dim"
}

export interface ConvertResponse {
  success: boolean
  image?: Buffer
  error?: string
}
