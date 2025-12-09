<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '1em',
  },
  borderRadius: {
    type: String,
    default: '4px',
  },
})

const style = computed(() => ({
  width: props.width,
  height: props.height,
  borderRadius: props.borderRadius,
}))
</script>

<template>
  <div class="skeleton" :style="style"></div>
</template>

<style scoped>
.skeleton {
  background-color: var(--ruins-text);
  opacity: 0.1;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.1;
  }

  50% {
    opacity: 0.2;
  }

  100% {
    opacity: 0.1;
  }
}
</style>
