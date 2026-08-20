<script setup lang="ts">
// UiBadge —— 徽标组件
// 学习重点: props 自定义 validator 限制颜色取值
type Color = 'blue' | 'green' | 'orange' | 'red' | 'gray'

const props = withDefaults(
  defineProps<{
    color?: Color
    /** 是否显示为圆点（不带动文字） */
    dot?: boolean
    /** 圆点模式下是否带 pulse 呼吸动画 */
    pulse?: boolean
  }>(),
  {
    color: 'blue',
    dot: false,
    pulse: false,
  },
)

// 颜色映射：唯一的权威来源，_class 计算用
const colorMap: Record<Color, string> = {
  blue: '#4f8cff',
  green: '#22c55e',
  orange: '#f59e0b',
  red: '#ef4444',
  gray: '#64748b',
}

const activeColor = colorMap[props.color]
</script>

<template>
  <span class="ui-badge" :class="{ 'is-dot': dot, 'is-pulse': pulse }" :style="dot ? '' : { background: activeColor + '22', color: activeColor }">
    <span v-if="dot" class="ui-badge__dot" :style="{ background: activeColor }"></span>
    <slot v-else />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; line-height: 1.4;
}
.ui-badge__dot { width: 8px; height: 8px; border-radius: 50%; }
.is-dot { padding: 0; background: transparent; }
.is-pulse .ui-badge__dot { animation: pulse 1.5s infinite; }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
  70% { box-shadow: 0 0 0 6px transparent; opacity: .6; }
  100% { box-shadow: 0 0 0 0 transparent; opacity: 1; }
}
</style>
