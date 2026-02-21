<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    /** h1 is default because most pages use it as main heading */
    as?: 'h1' | 'h2' | 'h3'
    /** left is default */
    align?: 'left' | 'center'
    /** Simple meta text; for complex content use #meta slot */
    meta?: string
  }>(),
  {
    as: 'h1',
    align: 'left',
    eyebrow: '',
    title: '',
    meta: '',
  },
)

const headingTag = computed(() => props.as || 'h1')
</script>

<template>
  <section class="page-header paper-panel" :class="`page-header--${align}`">
    <p v-if="eyebrow" class="eyebrow">
      {{ eyebrow }}
    </p>

    <div v-if="title || $slots.title || $slots.actions" class="page-header__title-row">
      <component :is="headingTag" v-if="title || $slots.title" class="page-header__title">
        <slot name="title">
          {{ title }}
        </slot>
      </component>
      <div v-if="$slots.actions" class="page-header__actions">
        <slot name="actions" />
      </div>
    </div>

    <p v-if="meta || $slots.meta" class="page-header__meta">
      <slot name="meta">
        {{ meta }}
      </slot>
    </p>

    <div v-if="$slots.default" class="page-header__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.page-header {
  padding: 48px;
  background: var(--ruins-panel);
  border: 1px solid var(--ruins-border);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header--center {
  text-align: center;
  align-items: center;
}

.eyebrow {
  font-family: var(--font-mono);
}

.page-header__title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.page-header__title {
  margin: 0;
  font-size: 3rem;
  font-family: var(--font-serif);
  color: var(--ruins-accent-strong);
}

.page-header__meta {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--ruins-muted);
}

.page-header__body {
  margin-top: 8px;
}

.page-header__actions {
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .page-header {
    padding: 32px;
  }

  .page-header__title {
    font-size: 2rem;
  }
}
</style>
