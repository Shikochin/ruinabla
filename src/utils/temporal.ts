import { Temporal } from 'temporal-polyfill'

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return Temporal.Now.plainDateISO().toString()
}

/**
 * Format Unix timestamp (seconds) to localized date string
 */
export function formatTimestamp(timestamp: number, locale: string = 'zh-CN'): string {
  const instant = Temporal.Instant.fromEpochMilliseconds(timestamp * 1000)
  const zonedDateTime = instant.toZonedDateTimeISO('Asia/Shanghai')

  return zonedDateTime.toPlainDate().toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Parse ISO date string to Temporal.PlainDate
 */
export function parseISODate(isoString: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(isoString)
}

/**
 * Format ISO datetime string to localized string
 */
export function formatISODateTime(isoString: string, locale: string = 'zh-CN'): string {
  const instant = Temporal.Instant.from(isoString)
  const zonedDateTime = instant.toZonedDateTimeISO('Asia/Shanghai')

  return zonedDateTime.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: number, locale: string = 'zh-CN'): string {
  const instant = Temporal.Instant.fromEpochMilliseconds(timestamp * 1000)
  const now = Temporal.Now.instant()

  const duration = now.since(instant)
  const seconds = duration.total('seconds')

  const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (seconds < 60) return relative.format(0, 'second')
  if (seconds < 3600) return relative.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86400) return relative.format(-Math.floor(seconds / 3600), 'hour')
  if (seconds < 604800) return relative.format(-Math.floor(seconds / 86400), 'day')
  return formatTimestamp(timestamp, locale)
}
