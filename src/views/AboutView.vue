<script setup lang="ts">
import GiscusComment from '@/components/GiscusComment.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { Temporal } from 'temporal-polyfill'
import { useHead } from '@unhead/vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

useHead({
  title: t('about.title'),
  meta: [
    {
      name: 'description',
      content: t('about.description'),
    },
  ],
})

const age = Temporal.Now.plainDateISO().year - 2008
</script>

<template>
  <div class="about-view">
    <PageHeader :eyebrow="$t('about.eyebrow')">
      <div class="bio">
        <img src="https://avatars.githubusercontent.com/u/60309542" alt="Avatar" class="avatar" />
        <div class="bio-text">
          <p v-html="$t('about.bio', { age })"></p>
        </div>
      </div>
      <article class="about-article">
        <h3>{{ $t('about.whyRuins') }}</h3>
        <p>
          {{ $t('about.ruinsDesc') }}
        </p>
      </article>
    </PageHeader>

    <PageHeader :eyebrow="$t('about.contact')">
      <div class="links">
        <a href="https://github.com/Shikochin" target="_blank" class="btn">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
            ></path>
          </svg>
          GitHub
        </a>
        <a href="https://x.com/shikoch1n" target="_blank" class="btn">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
            <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
          </svg>
          X (Twitter)
        </a>
        <a href="mailto:i@shikoch.in" class="btn">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            ></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Email
        </a>
      </div>
    </PageHeader>
    <GiscusComment />
  </div>
</template>

<style scoped>
.about-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.bio {
  display: flex;
  gap: 32px;
  align-items: center;
  margin-top: 8px;
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

.about-article {
  line-height: 1.8;
  color: var(--ruins-text);
}

.about-article h3 {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.4rem;
}

.links {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 640px) {
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
