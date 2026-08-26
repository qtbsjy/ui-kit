<script setup lang="ts">
// UiCheckboxGroup —— 复选框组
// 学习重点:
//   1. defineModel<(string|number|boolean)[]> 整体受控
//   2. provide CheckboxGroupKey 给子 UiCheckbox, 组内自动 toggle
//   3. 全选/取消 + 已选数量展示(可选)
import { computed, provide, ref } from 'vue'
import { CheckboxGroupKey } from './checkboxContext'
import UiCheckbox from './UiCheckbox.vue'

const props = withDefaults(
  defineProps<{
    /** 组标题（可选） */
    label?: string
    /** 整体禁用 */
    disabled?: boolean
    /** 可选项（数据驱动渲染子项，或直接用插槽） */
    options?: { label: string; value: string | number | boolean }[]
    /** 是否显示全选 */
    showCheckAll?: boolean
  }>(),
  {
    label: '',
    disabled: false,
    options: () => [],
    showCheckAll: false,
  },
)

const model = defineModel<(string | number | boolean)[]>({ default: () => [] })

function toggleValue(v: string | number | boolean) {
  const cur = model.value
  model.value = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
}
function isChecked(v: string | number | boolean) {
  return model.value.includes(v)
}

provide<import('./checkboxContext').CheckboxGroupContext>(CheckboxGroupKey, {
  modelValue: model,
  toggleValue,
  isChecked,
  disabled: props.disabled,
})

// 全选/取消: 作用于 options 提供的所有值
const allValues = computed(() => props.options.map((o) => o.value))
const allChecked = computed(
  () => allValues.value.length > 0 && allValues.value.every((v) => model.value.includes(v)),
)
const someChecked = computed(
  () => allValues.value.some((v) => model.value.includes(v)) && !allChecked.value,
)
function toggleAll() {
  if (allChecked.value) {
    model.value = model.value.filter((v) => !allValues.value.includes(v))
  } else {
    model.value = Array.from(new Set([...model.value, ...allValues.value]))
  }
}
</script>

<template>
  <div class="ui-checkbox-group">
    <div v-if="label || showCheckAll" class="ui-checkbox-group__head">
      <span v-if="label" class="ui-checkbox-group__title">{{ label }}</span>
      <span v-if="showCheckAll && options.length" class="ui-checkbox-group__checkall">
        <label class="ui-checkbox-group__all">
          <input
            type="checkbox"
            class="ui-checkbox-group__all-input"
            :checked="allChecked"
            :indeterminate="someChecked"
            :disabled="disabled"
            @change="toggleAll"
          />
          <span>全选</span>
        </label>
      </span>
    </div>
    <div class="ui-checkbox-group__body">
      <!-- 数据驱动 options -->
      <UiCheckbox
        v-for="opt in options"
        :key="String(opt.value)"
        :label="opt.label"
        :value="opt.value"
        :disabled="disabled"
      />
      <!-- 或插槽自定义子项 -->
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-checkbox-group { display: inline-flex; flex-direction: column; gap: 8px; }
.ui-checkbox-group__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ui-checkbox-group__title { font-size: 13px; color: var(--ui-text-2); font-weight: 600; }
.ui-checkbox-group__all { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: var(--ui-text-2); }
.ui-checkbox-group__all-input { accent-color: var(--ui-primary, #4f46e5); width: 15px; height: 15px; cursor: pointer; }
.ui-checkbox-group__body { display: flex; flex-wrap: wrap; gap: 8px 20px; }
</style>
