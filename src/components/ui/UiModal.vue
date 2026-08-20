<script setup lang="ts">
// UiModal —— 模态框组件
// 学习重点（本次核心）:
//   1. <Teleport to="body"> 把弹层传送到 body 顶层，脱离父级样式/定位上下文
//   2. v-model 双向绑定控制开合（props.modelValue + emit('update:modelValue')）
//   3. Transition 过渡动画（overlay 淡入 + panel 缩放）
//   4. 关闭: 点遮罩、点 X、Esc 键、关闭按钮
//   5. defineExpose 暴露 open()/close() 方法供父组件命令式调用
//   6. watch 监听打开时锁定 body 滚动
import { watch, onUnmounted } from 'vue'

// modelValue 设为可选：既能 v-model 双向控制，也能纯命令式 ref.open() 打开
const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    title?: string
    /** 宽度（如 480px / 60%） */
    width?: string
    /** 是否可点遮罩关闭 */
    maskClosable?: boolean
  }>(),
  {
    modelValue: false,
    title: '',
    width: '480px',
    maskClosable: true,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

// 关闭逻辑：更新 v-model + 触发 close 事件
function close() {
  emit('update:modelValue', false)
  emit('close')
}

// Esc 关闭
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) close()
}
window.addEventListener('keydown', onKeydown)
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// 打开时锁定 body 滚动
watch(
  () => props.modelValue,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
  },
)

// 暴露命令式方法供父组件调用（如 ref 调用 modal.open()）
defineExpose({ open: () => emit('update:modelValue', true), close })
</script>

<template>
  <!-- Teleport: 传送到 body，避免被父级 overflow/定位影响 -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-mask" @click.self="maskClosable && close()">
        <div class="modal-panel" :style="{ width }" role="dialog" aria-modal="true">
          <header class="modal-head">
            <h3>{{ title }}</h3>
            <button class="modal-close" @click="close" aria-label="关闭">✕</button>
          </header>
          <!-- 默认插槽：内容 -->
          <div class="modal-body"><slot /></div>
          <!-- footer 插槽：按钮区 -->
          <footer v-if="$slots.footer" class="modal-foot"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-mask {
  position: fixed; inset: 0; z-index: 1000;
  background: var(--ui-overlay); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-panel {
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 16px; max-width: 100%; max-height: 85vh; overflow: auto;
  box-shadow: var(--ui-shadow-lg);
}
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 18px 24px; border-bottom: 1px solid var(--ui-divider); }
.modal-head h3 { margin: 0; font-size: 17px; color: var(--ui-text-1); }
.modal-close { background: transparent; border: none; color: var(--ui-text-2); font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
.modal-close:hover { background: var(--ui-hover); color: var(--ui-text-1); }
.modal-body { padding: 22px 24px; color: var(--ui-text-2); line-height: 1.7; }
.modal-foot { padding: 14px 24px; border-top: 1px solid var(--ui-divider); display: flex; justify-content: flex-end; gap: 10px; }

/* 过渡动画 */
.modal-enter-active, .modal-leave-active { transition: opacity .25s ease; }
.modal-enter-active .modal-panel, .modal-leave-active .modal-panel { transition: transform .25s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-from .modal-panel, .modal-leave-to .modal-panel { transform: scale(.92) translateY(10px); }
</style>
