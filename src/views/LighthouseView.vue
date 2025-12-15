<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useHead } from '@unhead/vue'
import FriendLink from '@/components/FriendLink.vue'
import GiscusComment from '@/components/GiscusComment.vue'
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder.vue'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

// 定义接口
interface Friend {
  id: string
  name: string
  url: string
  avatar: string
  desc: string
}

useHead({
  title: '灯塔',
  meta: [{ name: 'description', content: '光束信号 - Friends and links' }],
})

const code = `{
      "name": "Your Name",
      "url": "https://your-site.com",
      "avatar": "https://your-site.com/avatar.png",
      "desc": "A short description of your site."
}`

// 状态管理
const authStore = useAuthStore()
const toast = useToastStore()
const friends = ref<Friend[]>([])
const isLoading = ref(true)
const showModal = ref(false)
const isEditing = ref(false)

// 响应式权限判断
const isAdmin = computed(() => authStore.isAdmin)

// 表单数据
const form = reactive({
  id: '',
  name: '',
  url: '',
  avatar: '',
  desc: '',
})

// 获取数据
const fetchFriends = async () => {
  try {
    const res = await fetch('/api/friends')
    if (res.ok) {
      friends.value = await res.json()
    }
  } catch (e) {
    console.error('Signal lost:', e)
  } finally {
    isLoading.value = false
  }
}

// 打开新增窗口
const openAddModal = () => {
  isEditing.value = false
  form.id = ''
  form.name = ''
  form.url = ''
  form.avatar = ''
  form.desc = ''
  showModal.value = true
}

// 打开编辑窗口
const openEditModal = (friend: Friend) => {
  isEditing.value = true
  Object.assign(form, friend)
  showModal.value = true
}

// 提交表单
const submitForm = async () => {
  if (!authStore.sessionId) return

  const isEdit = isEditing.value
  const endpoint = isEdit ? `/api/friends/${form.id}` : '/api/friends'
  const method = isEdit ? 'PUT' : 'POST'

  // Snapshot for rollback
  const previousFriends = [...friends.value]

  // Optimistic Update
  const tempId = isEdit ? form.id : `temp-${Date.now()}`
  const optimisticFriend: Friend = { ...form, id: tempId }

  if (isEdit) {
    const index = friends.value.findIndex((f) => f.id === form.id)
    if (index !== -1) friends.value[index] = optimisticFriend
  } else {
    friends.value.push(optimisticFriend)
  }

  // Close modal immediately
  showModal.value = false
  toast.success(isEdit ? '信号参数已调整' : '光束发射中...') // Optimistic feedback

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.sessionId}`,
      },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const data = await res.json()
      // Replace optimistic data with real server data (important for new items to get real ID)
      const index = friends.value.findIndex((f) => f.id === tempId)
      if (index !== -1) {
        friends.value[index] = data
      }
      if (!isEdit) toast.success('新坐标建立成功') // Confirmation for add
    } else {
      throw new Error('Failed to save')
    }
  } catch (e) {
    console.error(e)
    friends.value = previousFriends // Rollback
    toast.error('连接断开，撤回操作')
    showModal.value = true // Re-open modal so user doesn't lose data
  }
}

// 删除功能
const deleteFriend = async (id: string) => {
  if (!confirm('确定要熄灭这座灯塔吗？')) return
  if (!authStore.sessionId) return

  // Snapshot
  const previousFriends = [...friends.value]

  // Optimistic Update
  friends.value = friends.value.filter((f) => f.id !== id)
  toast.info('灯塔已熄灭') // Immediate feedback

  try {
    const res = await fetch(`/api/friends/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authStore.sessionId}`,
      },
    })

    if (!res.ok) {
      throw new Error('Delete failed')
    }
    // Success - nothing more to do
  } catch (e) {
    console.error(e)
    friends.value = previousFriends // Rollback
    toast.error('删除失败，信号已恢复')
  }
}

onMounted(() => {
  fetchFriends()
  // 尝试获取当前用户信息以确认权限，如果 Store 里没有且 Session 存在
  if (!authStore.user && authStore.sessionId) {
    authStore.fetchMe()
  }
})
</script>

<template>
  <div>
    <section class="lighthouse paper-panel">
      <div class="header-row">
        <div>
          <p class="eyebrow">灯塔</p>
          <h1>光束信号</h1>
        </div>
        <button v-if="isAdmin" @click="openAddModal" class="admin-btn add-btn">
          <span>+</span> 建立新坐标
        </button>
      </div>

      <p class="lead">
        在这片废墟中，偶尔能接收到来自远方的信号。它们是其他幸存者建立的灯塔，指引着不同的方向。
      </p>

      <div class="signal-grid">
        <template v-if="isLoading">
          <div v-for="i in 3" :key="i" class="skeleton-card">
            <SkeletonPlaceholder
              width="60px"
              height="60px"
              border-radius="50%"
              class="skeleton-avatar"
            />
            <div class="skeleton-info">
              <SkeletonPlaceholder width="50%" height="1.1rem" style="margin-bottom: 8px" />
              <SkeletonPlaceholder width="90%" height="0.9rem" />
            </div>
          </div>
        </template>

        <div v-else v-for="friend in friends" :key="friend.id" class="friend-wrapper">
          <FriendLink v-bind="friend" />

          <div v-if="isAdmin" class="admin-overlay">
            <button @click.prevent="openEditModal(friend)" class="icon-btn edit" title="调整">
              ✎
            </button>
            <button @click.prevent="deleteFriend(friend.id)" class="icon-btn delete" title="熄灭">
              ×
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="join paper-panel">
      <h3>加入光束网络</h3>
      <p>如果你也建立了自己的灯塔，欢迎交换光束。</p>
      <pre class="code-block"><code>{{ code }}</code></pre>
      <p>
        请通过 <a href="mailto:i@shikoch.in">Email</a>，评论区或
        <a href="https://github.com/Shikochin/ruinabla/issues" target="_blank">GitHub Issues</a>
        发送你的信号数据。
      </p>
    </section>

    <GiscusComment />

    <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
      <div class="modal-panel paper-panel">
        <h3>{{ isEditing ? '调整信号参数' : '建立新坐标' }}</h3>
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label>名称</label>
            <input v-model="form.name" required placeholder="Site Name" />
          </div>
          <div class="form-group">
            <label>地址 (URL)</label>
            <input v-model="form.url" required type="url" placeholder="https://..." />
          </div>
          <div class="form-group">
            <label>头像 (URL)</label>
            <input v-model="form.avatar" placeholder="Avatar Image URL" />
          </div>
          <div class="form-group">
            <label>描述</label>
            <input v-model="form.desc" placeholder="Short description" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showModal = false" class="btn-cancel">取消</button>
            <button type="submit" class="btn-confirm">发射信号</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lighthouse,
.join {
  padding: 40px;
  margin-bottom: 24px;
}

/* Header layout */
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.lighthouse h1 {
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  line-height: 1.3;
}

.lead {
  margin: 0 0 32px;
  max-width: 720px;
  color: var(--ruins-text);
  opacity: 0.9;
  line-height: 1.8;
}

/* Grid & Card Wrapper */
.signal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  position: relative;
  min-height: 100px;
}

.loading-state {
  color: var(--ruins-muted);
  font-family: var(--font-mono);
  padding: 20px;
  border: 1px dashed var(--ruins-border);
  text-align: center;
}

.friend-wrapper {
  position: relative;
}

/* Admin Controls */
.admin-btn {
  background: transparent;
  border: 1px dashed var(--ruins-border);
  color: var(--ruins-muted);
  padding: 8px 16px;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.admin-btn:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent);
  background: rgba(255, 255, 255, 0.05);
}

.admin-overlay {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.friend-wrapper:hover .admin-overlay {
  opacity: 1;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ruins-border);
  background: var(--ruins-bg);
  color: var(--ruins-text);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--ruins-accent);
  color: #fff;
  border-color: var(--ruins-accent);
}

.icon-btn.delete:hover {
  background: #ff4757;
  border-color: #ff4757;
}

/* Modal Styling - Keeping the Ruins Vibe */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-panel {
  width: 90%;
  max-width: 450px;
  padding: 32px;
  background: var(--ruins-bg, #111);
  border: 1px solid var(--ruins-accent);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
}

.modal-panel h3 {
  margin-top: 0;
  color: var(--ruins-accent);
  font-family: var(--font-mono);
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 6px;
  color: var(--ruins-muted);
  font-family: var(--font-mono);
}

.form-group input {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--ruins-border);
  color: var(--ruins-text);
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--ruins-accent);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  padding: 8px 24px;
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.btn-cancel {
  background: transparent;
  border: 1px solid transparent;
  color: var(--ruins-muted);
}

.btn-cancel:hover {
  color: var(--ruins-text);
}

.btn-confirm {
  background: var(--ruins-bg);
  border: 1px solid var(--ruins-accent);
  color: var(--ruins-text);
}

.btn-confirm:hover {
  opacity: 0.9;
}

/* Original Styles */
.join h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.code-block {
  margin: 16px 0;
  padding: 16px;
  border: 1px solid var(--ruins-border);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  overflow-x: auto;

  code {
    background: light-dark(#fdfefe, #080807);
  }
}

:root.light .code-block {
  background: transparent;
}

@media (max-width: 640px) {
  .lighthouse,
  .join {
    padding: 24px;
  }
}

.skeleton-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--ruins-border);
  background: rgba(255, 255, 255, 0.02);
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.skeleton-avatar {
  flex-shrink: 0;
}
</style>
