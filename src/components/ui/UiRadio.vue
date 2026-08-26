<script setup lang="ts">
// UiRadio —— 单选项
// 学习重点:
//   1. 受控: 通过 value + modelValue 匹配判断选中（单选本质是"值相等"）
//   2. inject 组上下文（UiRadioGroup 提供）实现组内单选
//   3. 原生 input 天然支持方向键分组导航(同 name)
import { computed, inject } from 'vue'
import { RadioGroupKey } from './radioContext'

const props = withDefaults(
  defineProps<{
    /** 展示文案 */
    label?: string
    /** 该项的值（与 modelValue 相等即选中） */
    value: string | number | boolean
    /** 禁用 */
    disabled?: boolean
  }>(),
  {
    label: '',
    disabled: false,
  },
)

const group = inject(RadioGroupKey, null)
const independentModel = defineModel<string | number | boolean>({ default: '' })

const checked = computed(() =>
  group ? group.modelValue.value === props.value : independentModel.value === props.value,
)
const isDisabled = computed(() => props.disabled || group?.disabled || false)
const inputName = computed(() => group?.name || undefined)

function onSelect() {
  if (isDisabled.value) return
  if (group) group.selectValue(props.value)
  else independentModel.value = props.value
}
</script>

<template>
  <label class="ui-radio" :class="{ 'is-disabled': isDisabled, 'is-checked': checked }">
    <input
      type="radio"
      class="ui-radio__input"
      :name="inputName"
      :checked="checked"
      :disabled="isDisabled"
      @change="onSelect"
    />
    <span class="ui-radio__circle" aria-hidden="true">
      <span class="ui-radio__dot"></span>
    </span>
    <span v-if="label || $slots.default" class="ui-radio__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
.ui-radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--ui-text-1);
  user-select: none;
}
.ui-radio__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.ui-radio__circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid var(--ui-border-strong, #cbd5e1);
  background: var(--ui-bg, #fff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
  flex-shrink: 0;
}
.ui-radio__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #fff;
  transform: scale(0);
  transition: transform .15s;
}
.ui-radio.is-checked .ui-radio__circle {
  border-color: var(--ui-primary, #4f46e5);
  background: var(--ui-primary, #4f46e5);
}
.ui-radio.is-checked .ui-radio__dot { transform: scale(1); }
.ui-radio:hover .ui-radio__circle { border-color: var(--ui-primary, #4f46e5); }
.ui-radio.is-disabled { cursor: not-allowed; opacity: .55; }
.ui-radio__label { line-height: 1.4; }
.ui-radio__input:focus-visible + .ui-radio__circle {
  outline: 2px solid var(--ui-primary, #4f46e5);
  outline-offset: 2px;
}
</style>
