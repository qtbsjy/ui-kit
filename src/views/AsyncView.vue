<script setup lang="ts">
// ============================================================
// AsyncView —— Suspense + 异步组件 + 骨架屏 Demo（作品㉒）
// ------------------------------------------------------------
// 学习重点:
//   1. defineAsyncComponent + <Suspense> —— 异步组件的三种态:
//      #default 就绪 / #fallback 加载中(放骨架屏) / 错误(捕获重试)
//   2. async setup() —— 组件顶层 await, Suspense 会自动等待
//   3. UiSkeleton 骨架屏 —— 加载中的低保真占位
//   4. 真实场景: 路由懒加载 + Suspense 包裹页面主体, 首屏体验优化
// ============================================================
import { ref, defineAsyncComponent } from 'vue'

// 异步加载数据子组件(演示: 模拟请求, 可成功/失败)
const AsyncProfile = defineAsyncComponent({
  loader: () => import('../components/async/AsyncProfile.vue'),
  // 加载失败也能从 Suspense 冒出来? 不 —— 加载错误在 Suspense 外处理
  // 我们用 useAsyncData 在子组件内部做错误重试, Suspense 只负责"首屏等待"
})

// 让 Suspense 可重新触发: 用一个 key 强制重挂载
const suspenseKey = ref(0)
const reload = () => {
  suspenseKey.value++
}

// 路由懒加载的 Suspense 演示计数器(单纯展示)
const info = `每次点"重新加载" → key 变化 → AsyncProfile 重挂载 → Suspense 重新进入 pending 显示骨架屏`
</script>

<template>
  <header class="page-head">
    <h1>⏳ Suspense + 异步组件 Demo</h1>
    <p class="sub">
      defineAsyncComponent + Suspense + UiSkeleton 骨架屏 · 作品㉒
    </p>
  </header>

  <!-- ===== 1. 核心: Suspense 包裹异步组件 ===== -->
  <section class="demo-block">
    <h2>🔁 Suspense + 异步组件</h2>
    <div class="controls">
      <UiButton icon="🔄" @click="reload">重新加载</UiButton>
      <span class="hint">{{ info }}</span>
    </div>

    <div class="suspense-wrap">
      <!-- Suspense: #fallback=骨架屏占位, #default=异步组件就绪后 -->
      <Suspense>
        <template #default>
          <AsyncProfile :key="suspenseKey" />
        </template>
        <template #fallback>
          <UiSkeleton :rows="4" :avatar="true" :title="true" />
        </template>
      </Suspense>
    </div>
  </section>

  <!-- ===== 2. 骨架屏各形态 ===== -->
  <section class="demo-block">
    <h2>🧩 UiSkeleton 骨架屏形态</h2>
    <div class="sk-grid">
      <div class="sk-item">
        <p class="sk-label">文本行</p>
        <UiSkeleton :rows="3" />
      </div>
      <div class="sk-item">
        <p class="sk-label">头像 + 标题</p>
        <UiSkeleton :rows="2" :avatar="true" :title="true" />
      </div>
      <div class="sk-item">
        <p class="sk-label">圆形</p>
        <UiSkeleton variant="circle" />
      </div>
    </div>
  </section>

  <!-- ===== 3. 错误态处理(useAsyncData) ===== -->
  <section class="demo-block">
    <h2>⚠️ 错误与重试</h2>
    <p class="note">
      AsyncProfile 内部用 <code>useAsyncData</code> 管理数据态：加载中显示骨架屏，
      成功渲染内容，失败显示错误 + 重试按钮。（Suspense 只负责"组件级"的挂载等待；
      组件内部数据加载的错误/重试由 useAsyncData 处理。）
    </p>
  </section>
</template>

<style scoped>
.page-head { margin-bottom: 24px; }
h1 { font-size: 26px; color: var(--ui-text-1); }
.sub { color: var(--ui-text-2); margin-top: 6px; }
.demo-block {
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 14px; padding: 22px 24px; margin-bottom: 18px;
}
.demo-block h2 { font-size: 15px; margin-bottom: 14px; color: var(--ui-text-1); }
.controls { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.hint { color: var(--ui-text-3); font-size: 12px; }
.suspense-wrap {
  border: 1px dashed var(--ui-border-hover); border-radius: 10px;
  padding: 20px; min-height: 120px;
}
.sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.sk-item { background: var(--ui-bg-soft); border-radius: 10px; padding: 16px; }
.sk-label { color: var(--ui-text-2); font-size: 13px; margin-bottom: 12px; }
.note { color: var(--ui-text-2); font-size: 13px; line-height: 1.7; }
.note code { background: var(--ui-bg-soft); padding: 1px 6px; border-radius: 4px; color: var(--ui-primary); }
</style>
