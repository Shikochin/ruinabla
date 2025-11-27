import { computed } from 'vue'
import { defineStore } from 'pinia'

import { getEntryBySlug, PostEntries } from '@/data/post'

export const usePostStore = defineStore('Post', () => {
  const entries = computed(() => PostEntries)

  const featuredEntry = computed(() => PostEntries[0]!)

  const recentlyRecovered = computed(() => PostEntries.slice(1, 4))

  const timelineEntries = computed(() =>
    [...PostEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  )

  const beaconSignals = computed(() => PostEntries.slice(0, 3))

  const tagCloud = computed(() =>
    PostEntries.flatMap((entry) => entry.tags).reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] ?? 0) + 1
      return acc
    }, {}),
  )

  const findBySlug = (slug: string) => getEntryBySlug(slug)

  return {
    entries,
    featuredEntry,
    recentlyRecovered,
    timelineEntries,
    beaconSignals,
    tagCloud,
    findBySlug,
  }
})
