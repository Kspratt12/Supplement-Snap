/**
 * Best-effort per-key rate limit kept in memory.
 * On serverless this resets when an instance is recycled and is not shared
 * across instances, so it only slows abuse down. Use a shared store
 * (Upstash, Vercel KV) if you need hard limits.
 */
const hits = new Map<string, number[]>()

export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return true
  }
  recent.push(now)
  hits.set(key, recent)
  return false
}
