<script setup lang="ts">
// UiCheckbox —— 复选框
// 学习重点:
//   1. defineModel<boolean> 单选; 配合 value 可加入 UiCheckboxGroup 批量多选
//   2. inject 组上下文（UiCheckboxGroup 提供）实现"组内多选"自动联动
//   3. 键盘无障碍: 原生 input + label 包裹, 天然支持空格切换
import { computed, inject } from 'vue'
import { CheckboxGroupKey } from './checkboxContext'

const props = withDefaults(
  defineProps<{
    /** 展示文案 */
    label?: string
    /** 禁用 */
    disabled?: boolean
    /** 作为组内成员时的值（配合 UiCheckboxGroup） */
    value?: string | number | boolean
  }>(),
  {
    label: '',
    disabled: false,
    value: true,
  },
)

// 组内模式: 复用组的 modelValue/disabled; 独立模式: 自身 boolean model
const group = inject(CheckboxGroupKey, null)
const independent = defineModel<boolean>({ default: false })

const checked = computed(() =>
  group ? group.isChecked(props.value) : independent.value,
)
const isDisabled = computed(() => props.disabled || group?.disabled || false)

function onToggle() {
  if (isDisabled.value) return
  if (group) {
    group.toggleValue(props.value)
  } else {
    independent.value = !independent.value
  }
}
</script>

<template>
  <label
    class="ui-checkbox"
    :class="{ 'is-disabled': isDisabled, 'is-checked': checked }"
  >
    <input
      type="checkbox"
      class="ui-checkbox__input"
      :checked="checked"
      :disabled="isDisabled"
      @change="onToggle"
    />
    <span class="ui-checkbox__box" aria-hidden="true">
      <svg v-if="checked" class="ui-checkbox__check" viewBox="0 0 12 10">
        <polyline points="1.5 5 4.5 8 10.5 1.5" />
      </svg>
    </span>
    <span v-if="label || $slots.default" class="ui-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
.ui-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--ui-text-1);
  user-select: none;
}
.ui-checkbox__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.ui-checkbox__box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid var(--ui-border-strong, #cbd5e1);
  background: var(--ui-bg, #fff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  flex-shrink: 0;
}
.ui-checkbox.is-checked .ui-checkbox__box {
  background: var(--ui-primary, #4f46e5);
  border-color: var(--ui-primary, #4f46e5);
}
.ui-checkbox__check polyline {
  fill: none;
  stroke: #fff;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-checkbox:hover .ui-checkbox__box { border-color: var(--ui-primary, #4f46e5); }
.ui-checkbox.is-disabled { cursor: not-allowed; opacity: .55; }
.ui-checkbox__label { line-height: 1.4; }
/* 键盘焦点: 用 :focus-visible 触发 input 时高亮 box */
.ui-checkbox__input:focus-visible + .ui-checkbox__box {
  outline: 2px solid var(--ui-primary, #4f46e5);
  outline-offset: 2px;
}
</style>
