<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useTheme } from './composables/useTheme'

const { isDark, toggle, withTransition } = useTheme()
function onToggle() {
  withTransition(() => toggle())
}
</script>

<template>
  <div class="app">
    <nav class="topnav">
      <RouterLink to="/" class="brand">🎨 UI Kit</RouterLink>
      <div class="links">
        <RouterLink to="/">组件总览</RouterLink>
        <RouterLink to="/doc/button" class="docs-link">📚 文档站</RouterLink>
        <RouterLink to="/button">按钮</RouterLink>
        <RouterLink to="/modal">模态框</RouterLink>
        <RouterLink to="/toast">消息提示</RouterLink>
        <RouterLink to="/form">表单校验</RouterLink>
        <RouterLink to="/layout">布局</RouterLink>
        <RouterLink to="/theme" class="theme-link">🎨 主题</RouterLink>
        <RouterLink to="/virtual">⚡ 虚拟列表</RouterLink>
        <RouterLink to="/async">⏳ 异步加载</RouterLink>
        <RouterLink to="/directives">🛠️ 指令集</RouterLink>
        <RouterLink to="/table">📊 数据表格</RouterLink>
      </div>
      <button class="theme-toggle" :title="isDark ? '切到浅色' : '切到深色'" @click="onToggle">
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </nav>

    <main class="wrap">
      <RouterView />
    </main>

    <footer>布鲁的 Vue TS 组件库 🐾 · 作品⑱ 数据驱动组件文档站</footer>

    <!-- 全局 PWA 提示: 安装/离线/更新（作品㉔） -->
    <UiInstallPwa />
  </div>
</template>

<style scoped>
.app { min-height: 100vh; display: flex; flex-direction: column; }
.topnav {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 24px; background: var(--ui-panel); backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--ui-border);
}
.brand { font-size: 17px; font-weight: 700; color: var(--ui-text-1); text-decoration: none; }
.links { display: flex; gap: 6px; flex-wrap: wrap; }
.links a { color: var(--ui-text-2); text-decoration: none; font-size: 14px; padding: 6px 12px; border-radius: 8px; transition: color .2s, background .2s; }
.links a:hover { color: var(--ui-text-1); }
.links a.router-link-active { color: var(--ui-primary); background: var(--ui-primary-soft); }
.links a.theme-link { font-weight: 600; }
.links a.docs-link { font-weight: 700; color: var(--ui-primary); }
.theme-toggle {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--ui-border);
  background: var(--ui-bg-soft); color: var(--ui-text-1); font-size: 16px; cursor: pointer;
  transition: background .2s, transform .15s; flex-shrink: 0;
}
.theme-toggle:hover { background: var(--ui-hover); transform: scale(1.05); }
.wrap { flex: 1; max-width: 980px; margin: 0 auto; padding: 36px 24px; width: 100%; }
footer { text-align: center; color: var(--ui-text-3); font-size: 13px; padding: 24px 0; }
</style>
