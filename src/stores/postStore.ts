import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { Temporal } from 'temporal-polyfill'

export interface Post {
  slug: string
  title: string
  date: string
  tags: string[]
  category: string
  summary?: string
  readingMinutes: number
  pinned?: boolean
  hide?: boolean
  license?: string
  content?: string // Optional, loaded on demand
}

export const usePostStore = defineStore('Post', () => {
  const posts = ref<Post[]>([])
  const loaded = ref(false)

  const fetchPosts = async () => {
    if (loaded.value) return
    try {
      const res = await fetch('/api/posts')
      if (!res.ok) throw new Error('Failed to fetch posts')
      const data = await res.json()
      posts.value = data
      loaded.value = true
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPostContent = async (slug: string) => {
    const post = posts.value.find((p) => p.slug === slug)
    if (post?.content) return

    try {
      const res = await fetch(`/api/posts/${slug}`)
      if (!res.ok) throw new Error('Failed to fetch post content')
      const data = await res.json()

      // Update existing post or add new one if not found (e.g. direct link)
      const index = posts.value.findIndex((p) => p.slug === slug)
      if (index !== -1) {
        posts.value[index] = { ...posts.value[index], ...data }
      } else {
        posts.value.push(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const entries = computed(() => posts.value)

  const visibleEntries = computed(() => posts.value.filter((entry) => !entry.hide))

  const featuredEntry = computed(() => visibleEntries.value[0])

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

  const findBySlug = (slug: string) => posts.value.find((entry) => entry.slug === slug)

  const getEntriesByTag = (tag: string) =>
    postEntries.value.filter((entry) => entry.tags.includes(tag))

  const getEntriesByCategory = (category: string) =>
    postEntries.value.filter((entry) => entry.category === category)

  return {
    posts,
    loaded,
    fetchPosts,
    fetchPostContent,
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
