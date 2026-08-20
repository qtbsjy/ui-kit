<script setup lang="ts">
// UiSwitch —— 开关组件
// 学习重点: defineModel<boolean> + 键盘无障碍(Space/Enter) + 过渡动画
const props = withDefaults(
  defineProps<{
    label?: string
    disabled?: boolean
    /** 开关打开时的描述 */
    activeText?: string
    inactiveText?: string
  }>(),
  {
    label: '',
    disabled: false,
    activeText: '',
    inactiveText: '',
  },
)

const model = defineModel<boolean>({ default: false })

// 键盘操作：Space/Enter 切换（配合原生 disabled 由 button 处理）
function toggle() {
  if (!props.disabled) model.value = !model.value
}
</script>

<template>
  <div class="ui-switch" :class="{ 'is-disabled': disabled }">
    <span v-if="label" class="ui-switch__label">{{ label }}</span>
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :disabled="disabled"
      class="ui-switch__track"
      :class="{ 'is-on': model }"
      @click="toggle"
    >
      <span class="ui-switch__thumb"></span>
    </button>
    <span class="ui-switch__text">{{ model ? activeText : inactiveText }}</span>
  </div>
</template>

<style scoped>
.ui-switch { display: flex; align-items: center; gap: 10px; }
.ui-switch__label { font-size: 14px; color: var(--ui-text-1); }
.ui-switch__track {
  position: relative; width: 44px; height: 24px; border-radius: 99px;
  background: var(--ui-border); border: none; cursor: pointer; transition: background .2s; flex-shrink: 0;
  padding: 0;
}
.ui-switch__track.is-on { background: var(--ui-primary); }
.ui-switch__thumb {
  position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
  background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.4);
}
.ui-switch__track.is-on .ui-switch__thumb { transform: translateX(20px); }
.ui-switch.is-disabled .ui-switch__track { opacity: .5; cursor: not-allowed; }
.ui-switch__text { font-size: 13px; color: var(--ui-text-2); min-width: 40px; }
</style>
