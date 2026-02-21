<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    /** h2 or h3 */
    as?: 'h2' | 'h3'
  }>(),
  { as: 'h3' },
)
</script>

<template>
  <header class="section-header">
    <div class="section-header__left">
      <p v-if="eyebrow" class="section-header__eyebrow">{{ eyebrow }}</p>
      <component :is="as" v-if="title || $slots.title" class="section-header__title">
        <slot name="title">{{ title }}</slot>
      </component>
    </div>
    <div v-if="$slots.actions" class="section-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid var(--ruins-border);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.section-header__left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-header__eyebrow {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--ruins-muted);
}

.section-header__title {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--ruins-text);
}

.section-header__actions {
  flex-shrink: 0;
}

.section-header__actions :deep(a) {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ruins-muted);
  text-decoration: none;
}

.section-header__actions :deep(a:hover) {
  color: var(--ruins-accent-strong);
}
</style>
