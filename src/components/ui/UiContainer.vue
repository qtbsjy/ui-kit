<script setup lang="ts">
// UiContainer —— 内容容器（作品⑭）
// 学习重点:
//   1. 限制最大宽度并水平居中（布局骨架的"壳"）
//   2. width: 预设档位(sm/md/lg/xl/full)或任意 CSS 值
//   3. padding 水平留白，移动端自动减小
//   4. 纯 CSS 实现，零 JS 逻辑
withDefaults(
  defineProps<{
    /** 宽度档位：sm(640)/md(768)/lg(1024)/xl(1280)/full 或任意 CSS 值 */
    width?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | string
    /** 水平内边距（数字=px） */
    padding?: number | string
    /** 是否铺满但限制最大宽度（可选） */
    fluid?: boolean
  }>(),
  {
    width: 'lg',
    padding: 24,
    fluid: false,
  },
)
</script>

<template>
  <div class="ui-container" :class="[`ui-container--${width}`, { 'ui-container--fluid': fluid }]" :style="{ '--ui-pad': typeof padding === 'number' ? `${padding}px` : padding }">
    <slot />
  </div>
</template>

<style scoped>
.ui-container {
  width: 100%;
  margin-inline: auto;
  padding-inline: var(--ui-pad, 24px);
  box-sizing: border-box;
}
/* 档位（fluid 时不设 max-width，占满可用空间） */
.ui-container:not(.ui-container--full):not(.ui-container--fluid).ui-container--sm { max-width: 640px; }
.ui-container:not(.ui-container--full):not(.ui-container--fluid).ui-container--md { max-width: 768px; }
.ui-container:not(.ui-container--full):not(.ui-container--fluid).ui-container--lg { max-width: 1024px; }
.ui-container:not(.ui-container--full):not(.ui-container--fluid).ui-container--xl { max-width: 1280px; }
.ui-container--fluid { max-width: none; }
.ui-container--full { max-width: 100%; }

/* 移动端减小水平留白 */
@media (max-width: 639px) {
  .ui-container { padding-inline: 16px; }
}
</style>
