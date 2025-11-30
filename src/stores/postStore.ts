import { computed } from 'vue'
import { defineStore } from 'pinia'
import { Temporal } from '@js-temporal/polyfill'
import { getEntryBySlug, PostEntries } from '@/data/post'

export const usePostStore = defineStore('Post', () => {
  const entries = computed(() => PostEntries)

  const featuredEntry = computed(() => PostEntries[0]!)

  const recentlyRecovered = computed(() => PostEntries.slice(1, 4))

  const timelineEntries = computed(() =>
    [...PostEntries].sort((a, b) =>
      Temporal.PlainDate.compare(Temporal.PlainDate.from(b.date), Temporal.PlainDate.from(a.date)),
    ),
  )

  const beaconSignals = computed(() => PostEntries.slice(0, 3))

  const tagCloud = computed(() =>
    PostEntries.flatMap((entry) => entry.tags).reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1
      return acc
    }, {}),
  )

  const findBySlug = (slug: string) => getEntryBySlug(slug)

  const getEntriesByTag = (tag: string) =>
    timelineEntries.value.filter((entry) => entry.tags.includes(tag))

  const getEntriesByCategory = (category: string) =>
    timelineEntries.value.filter((entry) => entry.category === category)

  return {
    entries,
    featuredEntry,
    recentlyRecovered,
    timelineEntries,
    beaconSignals,
    tagCloud,
    findBySlug,
    getEntriesByTag,
    getEntriesByCategory,
  }
})
