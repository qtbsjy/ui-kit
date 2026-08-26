<script setup lang="ts">
// UiRadioGroup —— 单选组
// 学习重点:
//   1. defineModel<string|number|boolean> 整体受控单选值
//   2. provide RadioGroupKey 给子 UiRadio, 组内同值互斥
//   3. 自动生成 name 供原生 radio 分组(同组互斥 + 方向键导航)
import { provide, ref } from 'vue'
import { RadioGroupKey } from './radioContext'
import UiRadio from './UiRadio.vue'

const props = withDefaults(
  defineProps<{
    /** 组标题（可选） */
    label?: string
    /** 整体禁用 */
    disabled?: boolean
    /** 可选项（数据驱动渲染子项，或直接用插槽） */
    options?: { label: string; value: string | number | boolean }[]
  }>(),
  {
    label: '',
    disabled: false,
    options: () => [],
  },
)

const model = defineModel<string | number | boolean>({ default: '' })

function selectValue(v: string | number | boolean) {
  model.value = v
}

// 为原生 radio 生成唯一组名（同组导航/互斥）
const groupName = ref(`ui-radio-${Math.random().toString(36).slice(2, 9)}`)

provide<import('./radioContext').RadioGroupContext>(RadioGroupKey, {
  modelValue: model,
  selectValue,
  disabled: props.disabled,
  name: groupName.value,
})
</script>

<template>
  <div class="ui-radio-group">
    <span v-if="label" class="ui-radio-group__label">{{ label }}</span>
    <div class="ui-radio-group__body">
      <UiRadio
        v-for="opt in options"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="disabled"
      />
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-radio-group { display: inline-flex; flex-direction: column; gap: 8px; }
.ui-radio-group__label { font-size: 13px; color: var(--ui-text-2); font-weight: 600; }
.ui-radio-group__body { display: flex; flex-wrap: wrap; gap: 8px 20px; }
</style>
