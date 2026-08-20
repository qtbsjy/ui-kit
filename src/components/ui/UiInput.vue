<script setup lang="ts">
// UiInput —— 文本输入组件
// 学习重点:
//   1. defineModel 实现 v-model 双向绑定（Vue 3.4+）
//   2. 透传原生 input 属性（type/placeholder/disabled/maxlength 等）
//   3. label + 错误提示 + 前缀插槽
import { useAttrs } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    /** 错误信息（非空时显示红框+提示） */
    error?: string
    placeholder?: string
    type?: string
    disabled?: boolean
  }>(),
  {
    label: '',
    error: '',
    placeholder: '',
    type: 'text',
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })
const attrs = useAttrs()
</script>

<template>
  <label class="ui-input" :class="{ 'has-error': error }">
    <span v-if="label" class="ui-input__label">{{ label }}</span>
    <div class="ui-input__wrap">
      <!-- 前缀插槽（如图标/单位） -->
      <span v-if="$slots.prefix" class="ui-input__prefix"><slot name="prefix" /></span>
      <input
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        v-bind="attrs"
        class="ui-input__field"
      />
    </div>
    <span v-if="error" class="ui-input__error">⚠️ {{ error }}</span>
  </label>
</template>

<style scoped>
.ui-input { display: flex; flex-direction: column; gap: 6px; }
.ui-input__label { font-size: 13px; color: var(--ui-text-2); }
.ui-input__wrap { position: relative; display: flex; align-items: center; }
.ui-input__prefix { position: absolute; left: 12px; color: var(--ui-text-3); font-size: 14px; pointer-events: none; }
.ui-input__field {
  width: 100%; background: var(--ui-bg-soft); border: 1px solid var(--ui-border);
  border-radius: 8px; padding: 10px 12px; color: var(--ui-text-1); font-size: 14px;
  font-family: inherit; transition: border-color .2s;
}
.ui-input__prefix + .ui-input__field { padding-left: 34px; }
.ui-input__field:focus { outline: none; border-color: var(--ui-primary); }
.ui-input__field:disabled { opacity: .5; cursor: not-allowed; }
.ui-input.has-error .ui-input__field { border-color: var(--ui-danger); }
.ui-input__error { font-size: 12px; color: var(--ui-danger); }
</style>
