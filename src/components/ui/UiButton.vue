<script setup lang="ts">
// UiButton —— 通用按钮组件
// 学习重点:
//   1. props 定义 + 自定义 validator 校验
//   2. inheritAttrs:false + useAttrs() 把原生属性(disabled/type/title等)透传给 <button>
//   3. 具名插槽 / 默认插槽
//   4. 事件: $emit 里的 click（原生点击事件穿透）
import { useAttrs } from 'vue'

// 类型定义
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    disabled?: boolean
    loading?: boolean
    /** 图标 emoji 前置 */
    icon?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    icon: '',
  },
)

// 继承的 attrs（如原生 disabled、type、title、@click 等）
const attrs = useAttrs()

// 通过 $attrs 里的 onClick 拿原生点击（不手动 emit，让继承透传）
</script>

<template>
  <button
    class="ui-btn"
    :class="[`ui-btn--${variant}`, `ui-btn--${size}`, { 'is-loading': loading }]"
    :disabled="disabled || loading"
    v-bind="attrs"
  >
    <span v-if="icon" class="ui-btn__icon">{{ icon }}</span>
    <span v-if="loading" class="ui-btn__spinner" aria-hidden="true"></span>
    <!-- 默认插槽：按钮文字 -->
    <slot />
  </button>
</template>

<style scoped>
.ui-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  line-height: 1;
  transition: transform .15s, filter .15s, background .15s;
  color: #fff;
}
.ui-btn:disabled { opacity: .5; cursor: not-allowed; }
.ui-btn:not(:disabled):active { transform: translateY(1px); }

/* sizes */
.ui-btn--sm { padding: 7px 12px; font-size: 13px; }
.ui-btn--md { padding: 10px 18px; font-size: 14px; }
.ui-btn--lg { padding: 13px 24px; font-size: 16px; }

/* variants —— 全部引用设计 token，随主题自动换肤 */
.ui-btn--primary { background: var(--ui-primary); }
.ui-btn--primary:not(:disabled):hover { background: var(--ui-primary-hover); }
.ui-btn--secondary { background: var(--ui-bg-soft); color: var(--ui-text-1); }
.ui-btn--secondary:not(:disabled):hover { background: var(--ui-hover); }
.ui-btn--danger { background: var(--ui-danger); }
.ui-btn--danger:not(:disabled):hover { background: var(--ui-danger-hover); }
.ui-btn--ghost { background: transparent; color: var(--ui-primary); box-shadow: inset 0 0 0 1px var(--ui-primary-border); }
.ui-btn--ghost:not(:disabled):hover { background: var(--ui-primary-soft); }

.ui-btn__icon { font-size: 1.1em; }
.ui-btn__spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
