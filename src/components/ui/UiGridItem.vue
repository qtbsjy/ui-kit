<script setup lang="ts">
// UiGridItem —— 栅格单元（作品⑭）
// 学习重点:
//   1. span: 默认栅格里跨几列（配合 UiGrid 的 cols）
//   2. 响应式跨度: md(≥768)/lg(≥1024)/xl(≥1280) 断点覆盖默认 span
//   3. 用 CSS 变量 --ui-span(默认) + 断点变量，纯 CSS 媒体查询实现响应式（零 JS）
//   4. inject 读取父 UiGrid 的列数（供未来高级用法，当前 span 直接映射）
import { inject } from 'vue'

withDefaults(
  defineProps<{
    /** 默认跨列数（1..cols） */
    span?: number
    /** ≥768px 时跨列数 */
    md?: number
    /** ≥1024px 时跨列数 */
    lg?: number
    /** ≥1280px 时跨列数 */
    xl?: number
  }>(),
  {
    span: 1,
    md: undefined,
    lg: undefined,
    xl: undefined,
  },
)

// 读取父级列数（声明依赖，保证 Grid 存在时 item 正常）
inject<number>('ui-grid-cols', 12)
</script>

<template>
  <div
    class="ui-grid-item"
    :style="{
      '--ui-span': span,
      '--md-span': md ?? span,
      '--lg-span': lg ?? span,
      '--xl-span': xl ?? span,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.ui-grid-item {
  /* 默认：跨 --ui-span 列 */
  grid-column: span var(--ui-span, 1);
  min-width: 0; /* 避免内容撑破轨道 */
  min-height: 0;
}

/* 响应式断点覆盖 span（与 UiGrid 的断点体系一致，纯 CSS） */
@media (min-width: 768px) {
  .ui-grid-item { grid-column: span var(--md-span, var(--ui-span, 1)); }
}
@media (min-width: 1024px) {
  .ui-grid-item { grid-column: span var(--lg-span, var(--ui-span, 1)); }
}
@media (min-width: 1280px) {
  .ui-grid-item { grid-column: span var(--xl-span, var(--ui-span, 1)); }
}
</style>
