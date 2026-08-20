<script setup lang="ts">
// UiSelect —— 下拉选择组件
// 学习重点: defineModel + options 数据驱动渲染
export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

withDefaults(
  defineProps<{
    label?: string
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    error?: string
  }>(),
  {
    label: '',
    placeholder: '请选择',
    disabled: false,
    error: '',
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="ui-select" :class="{ 'has-error': error }">
    <span v-if="label" class="ui-select__label">{{ label }}</span>
    <div class="ui-select__wrap">
      <select v-model="model" :disabled="disabled" class="ui-select__field">
        <option value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
          {{ opt.label }}
        </option>
      </select>
      <span class="ui-select__arrow">▾</span>
    </div>
    <span v-if="error" class="ui-select__error">⚠️ {{ error }}</span>
  </label>
</template>

<style scoped>
.ui-select { display: flex; flex-direction: column; gap: 6px; }
.ui-select__label { font-size: 13px; color: var(--ui-text-2); }
.ui-select__wrap { position: relative; }
.ui-select__field {
  width: 100%; appearance: none; background: var(--ui-bg-soft); border: 1px solid var(--ui-border);
  border-radius: 8px; padding: 10px 34px 10px 12px; color: var(--ui-text-1); font-size: 14px;
  font-family: inherit; cursor: pointer; transition: border-color .2s;
}
.ui-select__field:focus { outline: none; border-color: var(--ui-primary); }
.ui-select__field:disabled { opacity: .5; cursor: not-allowed; }
.ui-select__arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--ui-text-3); pointer-events: none; }
.ui-select.has-error .ui-select__field { border-color: var(--ui-danger); }
.ui-select__error { font-size: 12px; color: var(--ui-danger); }
</style>
