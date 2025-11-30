import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePostStore } from './postStore'

// Mock the data module
vi.mock('@/data/post', () => {
  return {
    PostEntries: [
      {
        title: 'Regular 1',
        date: '2023-01-01',
        pinned: false,
        tags: [],
        readingMinutes: 1,
        slug: 'r1',
        component: {},
      },
      {
        title: 'Pinned 1',
        date: '2023-02-01',
        pinned: true,
        tags: [],
        readingMinutes: 1,
        slug: 'p1',
        component: {},
      },
      {
        title: 'Regular 2',
        date: '2023-03-01',
        pinned: false,
        tags: [],
        readingMinutes: 1,
        slug: 'r2',
        component: {},
      },
      {
        title: 'Pinned 2',
        date: '2023-04-01',
        pinned: true,
        tags: [],
        readingMinutes: 1,
        slug: 'p2',
        component: {},
      },
      {
        title: 'Regular 3',
        date: '2023-05-01',
        pinned: false,
        tags: [],
        readingMinutes: 1,
        slug: 'r3',
        component: {},
      },
      {
        title: 'Hidden Post',
        date: '2023-06-01',
        pinned: false,
        tags: [],
        readingMinutes: 1,
        slug: 'hidden',
        component: {},
        hide: true,
      },
    ],
    getEntryBySlug: vi.fn(),
  }
})

describe('postStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('pickedUpPostsEntries sorts pinned posts first and limits to 4', () => {
    const store = usePostStore()
    const entries = store.pickedUpPostsEntries

    // Expected order: Pinned 2 (newest pinned), Pinned 1 (oldest pinned), Regular 3 (newest regular), Regular 2 (next regular)
    // Total 4
    expect(entries.length).toBe(4)
    expect(entries[0].title).toBe('Pinned 2')
    expect(entries[1].title).toBe('Pinned 1')
    expect(entries[2].title).toBe('Regular 3')
    expect(entries[3].title).toBe('Regular 2')
  })

  it('filters out hidden posts', () => {
    const store = usePostStore()
    const entries = store.postEntries
    const hidden = entries.find((e) => e.title === 'Hidden Post')
    expect(hidden).toBeUndefined()

    const pickedUp = store.pickedUpPostsEntries.find((e) => e.title === 'Hidden Post')
    expect(pickedUp).toBeUndefined()
  })
})
