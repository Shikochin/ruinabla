<script setup lang="ts">
import FriendLink from '@/components/FriendLink.vue'
import friendsData from '@/assets/friends.json'
import GiscusComment from '@/components/GiscusComment.vue'
import { codeToHtml } from 'shiki'

const code = `{
  "name": "Your Name",
  "url": "https://your-site.com",
  "avatar": "https://your-site.com/avatar.png",
  "desc": "A short description of your site."
}`
const codeBlock = await codeToHtml(code, {
  lang: 'json',
  theme: 'gruvbox-dark-hard',
})
</script>

<template>
  <div>
    <section class="lighthouse paper-panel">
      <p class="eyebrow">灯塔</p>
      <h1>光束信号</h1>
      <p class="lead">
        在这片废墟中，偶尔能接收到来自远方的信号。它们是其他幸存者建立的灯塔，指引着不同的方向。
      </p>

      <div class="signal-grid">
        <FriendLink v-for="friend in friendsData" :key="friend.url" v-bind="friend" />
      </div>
    </section>

    <section class="join paper-panel">
      <h3>加入光束网络</h3>
      <p>如果你也建立了自己的灯塔，欢迎交换光束。</p>
      <div v-html="codeBlock"></div>
      <p>
        请通过 <a href="mailto:i@shikoch.in">Email</a>，评论区或
        <a href="https://github.com/Shikochin/ruinabla/issues" target="_blank">GitHub Issues</a>
        发送你的信号数据。
      </p>
    </section>
    <GiscusComment />
  </div>
</template>

<style scoped>
.lighthouse,
.join {
  padding: 40px;
  margin-bottom: 24px;
}

.lighthouse h1 {
  margin: 0 0 16px;
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

.signal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.signal-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--ruins-border);
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  text-decoration: none;
}

.signal-card:hover {
  border-color: var(--ruins-accent);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px var(--ruins-light-color);
}

.signal-avatar {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--ruins-border);
  transition: border-color 0.3s ease;
}

.signal-card:hover .signal-avatar {
  border-color: var(--ruins-accent);
}

.signal-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.3s ease;
}

.signal-info {
  flex: 1;
  min-width: 0;
}

.signal-name {
  margin: 0 0 4px;
  font-family: var(--font-mono);
  font-size: 1.1rem;
  color: var(--ruins-accent-strong);
}

.signal-desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ruins-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.join h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.code-block {
  margin: 16px 0;
  padding: 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--ruins-border);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  overflow-x: auto;
}

:root.light .code-block {
  background: rgba(0, 0, 0, 0.03);
}

.eyebrow {
  margin: 0 0 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

@media (max-width: 640px) {
  .lighthouse,
  .join {
    padding: 24px;
  }

  /* .signal-grid {
    grid-template-columns: 1fr;
  } */
}
</style>
