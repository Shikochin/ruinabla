<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Temporal } from 'temporal-polyfill'
import { Octokit } from '@octokit/core'
import SectionHeader from '@/components/ui/SectionHeader.vue'
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder.vue'

// vite exposes env vars if it starts with VITE
const TOKEN: string = import.meta.env.VITE_RECENT_COMMENTS_PAT

interface Comment {
  id: string
  body: string
  author: {
    login: string
    avatarUrl: string
  }
  createdAt: string
  url: string
  discussion: {
    title: string
    url: string
  }
}

interface DiscussionNode {
  title: string
  url: string
  comments: {
    nodes: {
      id: string
      body: string
      createdAt: string
      url: string
      author: {
        login: string
        avatarUrl: string
      }
    }[]
  }
}

const comments = ref<Comment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const formatDate = (dateString: string) => {
  const instant = Temporal.Instant.from(dateString)
  const now = Temporal.Now.instant()
  const duration = now.since(instant)

  const minutes = Math.floor(duration.total({ unit: 'minute' }))
  const hours = Math.floor(duration.total({ unit: 'hour' }))
  const days = Math.floor(duration.total({ unit: 'day' }))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

const fetchComments = async () => {
  if (!TOKEN) {
    error.value = 'GitHub Token not configured'
    loading.value = false
    return
  }

  const octokit = new Octokit({
    auth: TOKEN,
  })

  const query = `
    query {
      repository(owner: "Shikochin", name: "ruin") {
        discussions(first: 5, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            title
            url
            comments(last: 1) {
              nodes {
                id
                body
                createdAt
                url
                author {
                  login
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const { repository } = await octokit.graphql<{
      repository: {
        discussions: {
          nodes: DiscussionNode[]
        }
      }
    }>(query)

    if (!repository?.discussions?.nodes) {
      throw new Error('Invalid data structure received from GitHub API')
    }

    const discussions = repository.discussions.nodes
    const fetchedComments: Comment[] = []

    discussions.forEach((discussion: DiscussionNode) => {
      if (discussion.comments.nodes.length > 0) {
        const comment = discussion.comments.nodes[0] as Comment
        fetchedComments.push({
          id: comment.id,
          body: comment.body,
          author: comment.author,
          createdAt: comment.createdAt,
          url: comment.url,
          discussion: {
            title: discussion.title.slice(0, -1),
            url: discussion.url,
          },
        })
      }
    })

    // Re-sort by comment creation time to handle cases where discussion was updated (e.g. title edit)
    // but no new comment was added.
    fetchedComments.sort((a, b) => {
      return Temporal.Instant.compare(
        Temporal.Instant.from(b.createdAt),
        Temporal.Instant.from(a.createdAt),
      )
    })

    comments.value = fetchedComments
  } catch (e: unknown) {
    console.error('Failed to fetch comments:', e)
    error.value = '无法获取评论'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="comments-list paper-panel">
    <SectionHeader eyebrow="动态" title="最近的讨论">
      <template #actions>
        <a
          href="https://github.com/Shikochin/ruin/discussions"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看全部 &rarr;
        </a>
      </template>
    </SectionHeader>

    <div v-if="loading">
      <ul>
        <li v-for="i in 4" :key="i">
          <div class="comment-content">
            <div class="comment-meta">
              <SkeletonPlaceholder
                width="20px"
                height="20px"
                border-radius="50%"
                style="display: block"
              />
              <SkeletonPlaceholder
                width="160px"
                height="0.75rem"
                style="display: block; margin-left: 4px"
              />
              <SkeletonPlaceholder
                width="80px"
                height="0.75rem"
                style="display: block; margin-left: 4px"
              />
            </div>
            <div style="margin-top: 4px; margin-bottom: 4px; width: 100%">
              <SkeletonPlaceholder width="100%" height="1rem" style="margin-bottom: 4px" />
              <SkeletonPlaceholder width="60%" height="1rem" />
            </div>
            <SkeletonPlaceholder width="120px" height="0.8rem" style="margin-top: 4px" />
          </div>
        </li>
      </ul>
    </div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <ul v-else>
      <li v-for="comment in comments" :key="comment.id">
        <div class="comment-content">
          <div class="comment-meta">
            <img :src="comment.author.avatarUrl" :alt="comment.author.login" class="avatar" />
            <span class="author">{{ comment.author.login }}</span>
            <span class="date">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <a :href="comment.url" target="_blank" rel="noopener noreferrer" class="comment-body">
            {{ comment.body.slice(0, 60) }}{{ comment.body.length > 60 ? '...' : '' }}
          </a>
          <a
            :href="comment.discussion.title"
            target="_blank"
            rel="noopener noreferrer"
            class="discussion-title"
          >
            在 "{{ comment.discussion.title }}" 中
          </a>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.comments-list {
  padding: 32px;
  background: transparent;
  border: 1px solid var(--ruins-border);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

li {
  display: flex;
  gap: 16px;
}

.comment-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: fit-content;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ruins-muted);
  width: fit-content;
}

.avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--ruins-border);
}

.comment-body {
  font-family: var(--font-serif);
  font-size: 1rem;
  color: var(--ruins-text);
  line-height: 1.5;
  text-decoration: none;
  display: block;
}

.discussion-title {
  font-size: 0.8rem;
  color: var(--ruins-muted);
  text-decoration: none;
  font-family: var(--font-sans);
}

.loading,
.error {
  text-align: center;
  padding: 20px;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}
</style>
