import { computed } from 'vue'
import { defineStore } from 'pinia'
import { Temporal } from 'temporal-polyfill'
import { getEntryBySlug, PostEntries } from '@/data/post'

export const usePostStore = defineStore('Post', () => {
  const entries = computed(() => PostEntries)

  const visibleEntries = computed(() => PostEntries.filter((entry) => !entry.hide))

  const featuredEntry = computed(() => visibleEntries.value[0]!)

  const recentlyRecovered = computed(() => visibleEntries.value.slice(1, 4))

  const postEntries = computed(() =>
    [...visibleEntries.value].sort((a, b) =>
      Temporal.PlainDate.compare(Temporal.PlainDate.from(b.date), Temporal.PlainDate.from(a.date)),
    ),
  )

  const pickedUpPostsEntries = computed(() => {
    const pinned = postEntries.value.filter((entry) => entry.pinned)
    const regular = postEntries.value.filter((entry) => !entry.pinned)

    const sortedPinned = pinned.sort((a, b) =>
      Temporal.PlainDate.compare(Temporal.PlainDate.from(b.date), Temporal.PlainDate.from(a.date)),
    )
    const sortedRegular = regular.sort((a, b) =>
      Temporal.PlainDate.compare(Temporal.PlainDate.from(b.date), Temporal.PlainDate.from(a.date)),
    )

    const all = [...sortedPinned, ...sortedRegular]
    const limit = Math.max(pinned.length, 4)
    return all.slice(0, limit)
  })

  const beaconSignals = computed(() => visibleEntries.value.slice(0, 3))

  const tagCloud = computed(() =>
    visibleEntries.value
      .flatMap((entry) => entry.tags)
      .reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1
        return acc
      }, {}),
  )

  const findBySlug = (slug: string) => getEntryBySlug(slug)

  const getEntriesByTag = (tag: string) =>
    postEntries.value.filter((entry) => entry.tags.includes(tag))

  const getEntriesByCategory = (category: string) =>
    postEntries.value.filter((entry) => entry.category === category)

  return {
    entries,
    featuredEntry,
    recentlyRecovered,
    postEntries,
    pickedUpPostsEntries,
    beaconSignals,
    tagCloud,
    findBySlug,
    getEntriesByTag,
    getEntriesByCategory,
  }
})
