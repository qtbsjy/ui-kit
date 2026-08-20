<script setup lang="ts">
// UiProgress —— 进度条组件
// 学习重点: computed 样式绑定 + 数值钳制 + Transition 进度动画
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0~100 */
    value: number
    /** 是否显示百分比文字 */
    showText?: boolean
    color?: string
    /** 条的高度 px */
    height?: number
  }>(),
  {
    showText: false,
    color: '#4f8cff',
    height: 8,
  },
)

// 钳制到 0~100，避免外部传入越界值
const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
  <div class="ui-progress">
    <div class="ui-progress__track" :style="{ height: height + 'px' }">
      <div class="ui-progress__bar" :style="{ width: clamped + '%', background: color }"></div>
    </div>
    <span v-if="showText" class="ui-progress__text">{{ clamped }}%</span>
  </div>
</template>

<style scoped>
.ui-progress { display: flex; align-items: center; gap: 12px; width: 100%; }
.ui-progress__track { flex: 1; background: var(--ui-bg-soft); border-radius: 99px; overflow: hidden; }
.ui-progress__bar {
  height: 100%; border-radius: 99px;
  transition: width .4s ease;
}
.ui-progress__text { font-size: 13px; color: var(--ui-text-2); min-width: 40px; text-align: right; font-variant-numeric: tabular-nums; }
</style>
