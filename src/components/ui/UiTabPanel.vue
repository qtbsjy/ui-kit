<script setup lang="ts">
// UiTabPanel —— 标签面板（作品㉙ 配套子组件）
// ------------------------------------------------------------
// 不用 props 传激活态，而是 inject UiTabs 提供的上下文自动联动。
// 这样面板完全不知道 tabs 数组，只管用 name 声明自己是哪块，
// 激活与否由 UiTabs 统一判定 —— 标签和面板彻底解耦。
// lazy: 首次激活前不渲染内容（v-if 挂载），切走默认仍保留在 DOM。
import { inject, ref, watch } from 'vue'
import { tabsContextKey } from './useTabsContext'

const props = withDefaults(
  defineProps<{
    /** 面板标识，需与 UiTabs 里某个 tab 的 value 相同 */
    name: string | number
    /** 首次激活前不渲染内容（懒挂载） */
    lazy?: boolean
  }>(),
  { lazy: false },
)

const ctx = inject(tabsContextKey, null)

// 独立使用（未包在 UiTabs 里）时始终显示，不报错
const isActive = () => (ctx ? ctx.active.value === props.name : true)
const mounted = ref(!props.lazy)

watch(
  isActive,
  (v) => {
    if (v) mounted.value = true // 首次激活时挂载内容
  },
  { immediate: true },
)
</script>

<template>
  <Transition name="ui-tab-panel" mode="out-in">
    <section
      v-if="mounted && isActive()"
      class="ui-tab-panel"
      role="tabpanel"
      :aria-hidden="!isActive()"
      :aria-labelledby="`ui-tab-${String(name)}`"
    >
      <slot />
    </section>
  </Transition>
</template>

<style scoped>
.ui-tab-panel {
  padding: var(--ui-space, 16px) 0;
  color: var(--ui-text-1);
  animation: ui-tab-fade .18s ease;
}
@keyframes ui-tab-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
