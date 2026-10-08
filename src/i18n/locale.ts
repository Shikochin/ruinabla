export const supportedLocales = ['zh-CN', 'en-US', 'ja-JP'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export function resolveLocale(value: string | null): SupportedLocale {
  return supportedLocales.find((locale) => locale === value) ?? 'zh-CN'
}
