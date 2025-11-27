<template>
  <section class="about paper-panel">
    <p class="eyebrow">关于</p>
    <h1>让废墟审美成为可用体系</h1>
    <p class="lead">
      我是 Ruinabla，一名喜欢用“残缺感”构建体验的设计师。这里不是实地探险日志，而是把
      混凝土裂纹、霓虹残影、潮湿噪点这些视觉语言翻译成组件、版式和声音的笔记。
    </p>
  </section>

  <section class="grid">
    <article class="card paper-panel">
      <h3>写作方向</h3>
      <p>记录废墟主题的 UI 设计法则、情绪板拆解以及可复用的动效脚本。</p>
    </article>
    <article class="card paper-panel">
      <h3>工具箱</h3>
      <p>Figma、ShaderToy、定制噪声脚本、Vue + Pinia + Vite 组成的演示栈。</p>
    </article>
    <article class="card paper-panel">
      <h3>联系</h3>
      <p>欢迎把你的废墟灵感或截图发送到 imaginary@ruinabla.io，一起做成工具。</p>
    </article>
  </section>

  <section class="pledge paper-panel">
    <h3>写下废墟的誓言</h3>
    <ul>
      <li>每次上新组件前，都先拆一张“破败纹理”参考图</li>
      <li>保持对旧建筑的敬意，对新界面的耐心</li>
      <li>分享可复现的实验，让同行者少走弯路</li>
    </ul>
  </section>
</template>

<style scoped>
.about {
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.about h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 2.8rem);
}

.lead {
  margin: 0;
  max-width: 720px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 180px;
}

.pledge {
  padding: 32px;
}

.pledge ul {
  margin: 16px 0 0;
  padding-left: 18px;
  line-height: 1.8;
  color: var(--ruins-muted);
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: var(--ruins-muted);
}

@media (max-width: 640px) {
  .about {
    padding: 24px;
  }

  .pledge {
    padding: 24px;
  }
}
</style>
