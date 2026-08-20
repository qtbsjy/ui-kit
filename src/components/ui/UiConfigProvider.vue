<script setup lang="ts">
// ============================================================
// UiConfigProvider —— 组件库配置提供者（provide/inject 进阶）
// ------------------------------------------------------------
// 用法:
//   <UiConfigProvider :tooltip-placement="'bottom'" :tooltip-delay="800">
//     <UiButton v-tooltip="'提示'">按钮</UiButton>
//   </UiConfigProvider>
// ------------------------------------------------------------
// 学习重点:
//   1. provide(key, value) —— 向子树提供配置, 任何后代 inject 都能拿到
//   2. reactive + 合并默认配置 —— 只传想改的项, 其余用默认
//   3. readonly —— 传给子树的应是只读视图, 防止子组件篡改全局配置
//   4. 就近覆盖 —— 内层 Provider 会覆盖外层同 key 的配置
// ============================================================
import { provide, readonly, reactive, watch } from 'vue'
import {
  UiConfigKey,
  type UiConfig,
} from '../../composables/useUiConfig'

const props = withDefaults(
  defineProps<{
    /** tooltip 显示延迟(ms), 默认 300 */
    tooltipDelay?: number
    /** tooltip 默认方向, 默认 top */
    tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
    /** 是否启用动画, 默认 true */
    animated?: boolean
  }>(),
  { tooltipDelay: 300, tooltipPlacement: 'top', animated: true },
)

// 合并成一份响应式配置: 显式传了用传入值, 没传用默认
const state = reactive<UiConfig>({
  tooltipDelay: props.tooltipDelay,
  tooltipPlacement: props.tooltipPlacement,
  animated: props.animated,
})

// props 变化时同步（支持响应式更新）
watch(
  () => [props.tooltipDelay, props.tooltipPlacement, props.animated] as const,
  ([tooltipDelay, tooltipPlacement, animated]) => {
    state.tooltipDelay = tooltipDelay
    state.tooltipPlacement = tooltipPlacement
    state.animated = animated
  },
)

// 提供给子树 —— 只读视图(DeepReadonly), 防止后代组件顺手改掉全局配置
provide(UiConfigKey, readonly(state))
</script>

<template>
  <!-- 透传插槽: Provider 本身不渲染任何 DOM -->
  <slot />
</template>
