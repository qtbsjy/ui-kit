<script setup lang="ts">
// UiTextarea —— 多行文本域组件
// 学习重点: defineModel + 透传原生属性 + 行数 + 计数
withDefaults(
  defineProps<{
    label?: string
    rows?: number
    placeholder?: string
    /** 显示字符计数 */
    showCount?: boolean
    maxlength?: number
    disabled?: boolean
    error?: string
  }>(),
  {
    label: '',
    rows: 3,
    placeholder: '',
    showCount: false,
    maxlength: undefined,
    disabled: false,
    error: '',
  },
)

const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="ui-textarea" :class="{ 'has-error': error }">
    <span v-if="label" class="ui-textarea__label">{{ label }}</span>
    <textarea
      v-model="model"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength"
      class="ui-textarea__field"
    ></textarea>
    <div v-if="showCount || error" class="ui-textarea__foot">
      <span v-if="error" class="ui-textarea__error">⚠️ {{ error }}</span>
      <span v-if="showCount" class="ui-textarea__count">{{ model.length }}{{ maxlength ? `/${maxlength}` : '' }}</span>
    </div>
  </label>
</template>

<style scoped>
.ui-textarea { display: flex; flex-direction: column; gap: 6px; }
.ui-textarea__label { font-size: 13px; color: var(--ui-text-2); }
.ui-textarea__field {
  width: 100%; background: var(--ui-bg-soft); border: 1px solid var(--ui-border);
  border-radius: 8px; padding: 10px 12px; color: var(--ui-text-1); font-size: 14px;
  font-family: inherit; resize: vertical; transition: border-color .2s;
}
.ui-textarea__field:focus { outline: none; border-color: var(--ui-primary); }
.ui-textarea__field:disabled { opacity: .5; cursor: not-allowed; }
.ui-textarea.has-error .ui-textarea__field { border-color: var(--ui-danger); }
.ui-textarea__foot { display: flex; justify-content: space-between; }
.ui-textarea__error { font-size: 12px; color: var(--ui-danger); }
.ui-textarea__count { font-size: 12px; color: var(--ui-text-3); margin-left: auto; }
</style>
