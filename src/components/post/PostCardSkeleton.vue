<script setup lang="ts">
import SkeletonPlaceholder from '@/components/ui/SkeletonPlaceholder.vue'
</script>

<template>
  <article class="post-card paper-panel">
    <div class="post-card__header">
      <SkeletonPlaceholder width="100px" height="0.75rem" />
      <div class="post-card__divider"></div>
      <SkeletonPlaceholder width="60px" height="0.7rem" />
    </div>

    <div class="post-card__title">
      <SkeletonPlaceholder width="60%" height="2rem" style="margin: 4px 0" />
    </div>

    <div class="post-card__body">
      <SkeletonPlaceholder width="100%" height="1rem" style="margin-bottom: 8px" />
      <SkeletonPlaceholder width="90%" height="1rem" style="margin-bottom: 8px" />
      <SkeletonPlaceholder width="40%" height="1rem" />
    </div>

    <div class="post-card__footer">
      <SkeletonPlaceholder width="50px" height="0.7rem" />
      <SkeletonPlaceholder width="80px" height="0.7rem" />
    </div>
  </article>
</template>

<style scoped>
/* Reuse PostCard styles by copying them or relying on global/common if possible.
   Since PostCard styles are scoped, we need to duplicate relevant structure styles here
   or ensure they are globally available.
   For now, we'll duplicate the structural styles to ensure it matches perfectly without refactoring PostCard CSS to global.
*/

.post-card {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: transparent;
  border: 1px solid var(--ruins-border);
  position: relative;
}

.post-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ruins-border);
}

.post-card__divider {
  flex: 1;
  height: 1px;
  background: var(--ruins-border);
  opacity: 0.3;
}

.post-card__title {
  width: 100%;
}

.post-card__body {
  display: flex;
  flex-direction: column;
}

.post-card__footer {
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid var(--ruins-border);
  display: flex;
  justify-content: space-between;
}

@media (max-width: 640px) {
  .post-card {
    padding: 24px;
  }
}
</style>
