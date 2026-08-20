<script setup lang="ts">
// 按钮组件详细文档页
import { ref } from 'vue'

const loading = ref(false)
function simulate() {
  loading.value = true
  setTimeout(() => (loading.value = false), 1800)
}
</script>

<template>
  <h1>🔘 UiButton 按钮</h1>
  <p class="lead">触发操作的通用按钮。支持变体、尺寸、加载、图标、禁用，并透传原生属性。</p>

  <section class="block">
    <h2>变体 variant</h2>
    <div class="row">
      <UiButton variant="primary">primary</UiButton>
      <UiButton variant="secondary">secondary</UiButton>
      <UiButton variant="danger">danger</UiButton>
      <UiButton variant="ghost">ghost</UiButton>
    </div>
  </section>

  <section class="block">
    <h2>尺寸 size</h2>
    <div class="row">
      <UiButton size="sm">sm 小号</UiButton>
      <UiButton size="md">md 中号</UiButton>
      <UiButton size="lg">lg 大号</UiButton>
    </div>
  </section>

  <section class="block">
    <h2>图标 + 加载 + 禁用</h2>
    <div class="row">
      <UiButton icon="🚀">带图标</UiButton>
      <UiButton :loading="loading" @click="simulate">点我加载 1.8s</UiButton>
      <UiButton disabled>禁用</UiButton>
      <UiButton disabled variant="secondary">禁用次要</UiButton>
    </div>
    <p class="note">loading 时自动禁用并显示 spinner</p>
  </section>

  <section class="block">
    <h2>原生属性透传（inheritAttrs/$attrs）</h2>
    <div class="row">
      <UiButton type="submit" title="提示气泡" data-id="abc">带 title+data 属性</UiButton>
    </div>
    <p class="note">type/title/data-* 等原生属性自动落到 &lt;button&gt; 上</p>
  </section>
</template>

<style scoped>
h1 { font-size: 28px; }
.lead { color: var(--muted); margin: 10px 0 24px; }
.block { background: var(--panel); border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; }
.block h2 { font-size: 15px; margin-bottom: 14px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.note { color: var(--muted); font-size: 12px; margin-top: 12px; font-family: ui-monospace, monospace; }
</style>
