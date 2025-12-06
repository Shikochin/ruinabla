/**
 * Calculate reading time in minutes based on text content
 * @param content - HTML or markdown content
 * @param wordsPerMinute - Average reading speed (default: 200 for Chinese, 250 for English)
 * @returns Estimated reading time in minutes
 */
export function calculateReadingTime(content: string, wordsPerMinute = 200): number {
  if (!content) return 1

  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, '')

  // For Chinese/Japanese/Korean text, count characters
  // For other languages, count words
  const cjkChars = text.match(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g)
  const cjkCount = cjkChars ? cjkChars.length : 0

  // Count non-CJK words
  const words = text
    .replace(/[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/g, '')
    .trim()
    .split(/\s+/)
  const wordCount = words.filter((w) => w.length > 0).length

  // For CJK, average reading speed is about 350-500 characters per minute
  // For English, it's about 200-250 words per minute
  const cjkMinutes = cjkCount / 400
  const wordMinutes = wordCount / wordsPerMinute

  const totalMinutes = Math.ceil(cjkMinutes + wordMinutes)

  // Minimum 1 minute
  return Math.max(1, totalMinutes)
}
