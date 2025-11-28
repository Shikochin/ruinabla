<script setup lang="ts">
import GiscusComment from '@/components/GiscusComment.vue'
</script>

<template>
  <div>
    <section class="about paper-panel">
      <p class="eyebrow">余烬</p>

      <div class="bio">
        <img src="https://avatars.githubusercontent.com/u/60309542" alt="Avatar" class="avatar" />
        <div class="bio-text">
          <p>
            <strong>にしみや 缄</strong>，也可以叫 Shikochin，Nishimiya Chin。17
            岁，居住在中国，是一个高中生。创造遗迹来留下一些自己的想法和生活琐碎。 2021
            年开始折腾个人博客，每次都不尽如人意，虽然折腾不算在写博客的快乐之内，但依旧从中学习到了不少东西。
          </p>
        </div>
      </div>
      <article>
        <h3>为什么叫遗迹？</h3>
        <p>
          所言皆源于所思，所思亦化作所言，却未曾尽述全貌；仍希望这些言语能占据一席之地，成为遗迹。现实多有不尽人意，美丽的文字不应被束缚，它们在遗迹中得以生存，与遗迹自身共荣。
        </p>
      </article>
    </section>

    <section class="intro paper-panel">
      <p class="eyebrow">联系我</p>
      <div class="links">
        <a href="https://github.com/Shikochin" target="_blank" class="social-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path
              d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22">
            </path>
          </svg>
          GitHub
        </a>
        <a href="https://x.com/shikoch1n" target="_blank" class="social-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
            <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
          </svg>
          X (Twitter)
        </a>
        <a href="mailto:i@shikoch.in" class="social-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Email
        </a>
      </div>
    </section>
    <GiscusComment />
  </div>
</template>

<style scoped>
.about,
.qa,
.intro {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 24px;
}

.intro>p {
  margin: 0 !important;
}

.about h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  line-height: 1.3;
}

.bio {
  display: flex;
  gap: 32px;
  align-items: center;
  margin-top: 16px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 1px solid var(--ruins-border);
  filter: grayscale(0.2);
}

.bio-text {
  display: flex;
  flex-direction: column;
  gap: 16px;
  line-height: 1.8;
  color: var(--ruins-text);
}

.qa article,
.intro {
  line-height: 1.8;
  color: var(--ruins-text);
}

.qa h3,
.intro h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.4rem;
}

.intro p {
  margin: 0 0 16px;
}

.intro .links {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.social-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: 1px solid var(--ruins-border);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ruins-muted);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  background: transparent;
  position: relative;
  overflow: hidden;
}

.social-btn svg {
  transition: transform 0.3s ease;
}

.social-btn:hover {
  border-color: var(--ruins-accent);
  color: var(--ruins-accent-strong);
  background: rgba(255, 255, 255, 0.03);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.social-btn:hover svg {
  transform: scale(1.1);
  stroke: var(--ruins-accent);
}

.social-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.social-btn:hover::before {
  left: 100%;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

@media (max-width: 640px) {

  .about,
  .qa,
  .intro {
    padding: 24px;
  }

  .bio {
    flex-direction: column;
    gap: 24px;
  }

  .avatar {
    width: 80px;
    height: 80px;
  }
}
</style>
