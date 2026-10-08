<script setup lang="ts">
import { useDevStore } from '@/stores/devStore'
import { Octokit } from '@octokit/core'
import { ref } from 'vue'
const devStore = useDevStore()

const commitHash = ref('')

if (devStore.isDev) {
  const TOKEN: string = import.meta.env.VITE_COMMIT_HASH_PAT
  const octokit = new Octokit({
    auth: TOKEN,
  })

  try {
    octokit
      .request('GET /repos/{owner}/{repo}/git/refs/heads/{ref}', {
        owner: 'Shikochin',
        repo: 'ruinabla',
        ref: 'main',
      })
      .then((res) => {
        console.log(res.data)
        commitHash.value = res.data.object.sha.slice(0, 7)
      })
  } catch (error) {
    console.error(`Failed to fetch commit hash: ${error}`)
    commitHash.value = 'unknown'
  }
}
</script>

<template>
  <footer class="ruins-footer paper-panel">
    <i18n-t keypath="footer.credit" tag="p">
      <template #author><a href="https://github.com/Shikochin">Shikochin</a></template>
    </i18n-t>
    <i18n-t keypath="footer.builtWith" tag="p">
      <template #framework><a href="https://vuejs.org">Vue 3</a></template>
    </i18n-t>
    <div v-if="devStore.isDev">
      <p v-if="commitHash">
        {{ $t('footer.commit') }}
        <a :href="`https://github.com/Shikochin/ruinabla/commit/${commitHash}`" target="_blank">{{
          commitHash === 'unknown' ? $t('footer.unknown') : commitHash
        }}</a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.ruins-footer {
  border-top: 1px solid var(--ruins-border);
  padding-top: 20px;
  padding-bottom: 20px;
  margin-top: 40px;
  background: transparent;
  box-shadow: none;
  text-align: center;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ruins-muted);
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0.6;

  p {
    margin: 0;
  }
}
</style>
