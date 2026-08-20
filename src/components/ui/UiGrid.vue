<script setup lang="ts">
// UiGrid —— 12 栏响应式栅格容器（作品⑭）
// 学习重点:
//   1. CSS Grid 12 列栅格骨架，配合 UiGridItem 用 span 控制跨列
//   2. 断点体系: 默认 → sm(≥640) → md(≥768) → lg(≥1024) → xl(≥1280)
//   3. gap 间距 / 对齐控制，全部走 CSS 变量方便覆盖
//   4. provide/inject 把断点信息下发给 UiGridItem，item 据此做响应式 span
import { provide } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 每行总列数（默认 12） */
    cols?: number
    /** 栅格间距（数字=px 或任意 CSS 值） */
    gap?: number | string
    /** 行间距（默认与 gap 相同；数字=px） */
    rowGap?: number | string
    /** 垂直对齐 */
    align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
    /** 主轴对齐 */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  }>(),
  {
    cols: 12,
    gap: 16,
    rowGap: undefined,
    align: 'stretch',
    justify: 'start',
  },
)

const gapCss = typeof props.gap === 'number' ? `${props.gap}px` : props.gap
const rowGapCss =
  props.rowGap === undefined
    ? gapCss
    : typeof props.rowGap === 'number'
      ? `${props.rowGap}px`
      : props.rowGap

// 把列数给 UiGridItem（inject 用），item 据此换算 span 百分比
provide('ui-grid-cols', props.cols)
</script>

<template>
  <div
    class="ui-grid"
    :class="[`ui-grid--align-${align}`, `ui-grid--justify-${justify}`]"
    :style="{
      '--ui-cols': cols,
      '--ui-gap': gapCss,
      '--ui-row-gap': rowGapCss,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
.ui-grid {
  display: grid;
  /* 12 列，列宽由 span 百分比折算（UiGridItem 会设置 grid-column: span N） */
  grid-template-columns: repeat(var(--ui-cols, 12), minmax(0, 1fr));
  gap: var(--ui-gap, 16px);
  row-gap: var(--ui-row-gap, var(--ui-gap, 16px));
}

/* 对齐 */
.ui-grid--align-start { align-items: start; }
.ui-grid--align-center { align-items: center; }
.ui-grid--align-end { align-items: end; }
.ui-grid--align-stretch { align-items: stretch; }
.ui-grid--align-baseline { align-items: baseline; }

/* 主轴 */
.ui-grid--justify-start { justify-content: start; }
.ui-grid--justify-center { justify-content: center; }
.ui-grid--justify-end { justify-content: end; }
.ui-grid--justify-between { justify-content: space-between; }
.ui-grid--justify-around { justify-content: space-around; }
.ui-grid--justify-evenly { justify-content: space-evenly; }
</style>
