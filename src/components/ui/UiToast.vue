<script setup lang="ts">
// UiToast —— 全局消息提示（命令式调用）
// 学习重点:
//   1. 组合式函数 useToast()：提供 toast.success/error/info 命令式 API
//   2. 用 reactive 数组管理多条消息，自动过期移除
//   3. 通过 app.config.globalProperties 挂到全局 this.$toast
//   4. defineExpose 暴露 show() 供父组件控制
import { reactive, ref } from 'vue'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

// 消息列表（响应式），每条带自动消失定时器
const toasts = reactive<ToastItem[]>([])
let seed = 0

const ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: '💡',
}

function push(type: ToastType, message: string, duration = 2600) {
  const id = ++seed
  toasts.push({ id, type, message })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i !== -1) toasts.splice(i, 1)
  }, duration)
}

// 暴露给父组件的命令式方法
defineExpose({ push, toasts })
</script>

<template>
  <!-- 固定右下角堆叠 -->
  <div class="ui-toast-wrap">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="ui-toast" :class="`is-${t.type}`">
        <span class="ui-toast__icon">{{ ICONS[t.type] }}</span>
        <span class="ui-toast__msg">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ui-toast-wrap {
  position: fixed; right: 20px; bottom: 20px; z-index: 2000;
  display: flex; flex-direction: column; gap: 10px; pointer-events: none;
}
.ui-toast {
  display: flex; align-items: center; gap: 10px;
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  padding: 12px 18px; border-radius: 10px; min-width: 240px; max-width: 360px;
  box-shadow: var(--ui-shadow-lg); color: var(--ui-text-1); font-size: 14px;
}
.ui-toast.is-success { border-left: 3px solid var(--ui-success); }
.ui-toast.is-error { border-left: 3px solid var(--ui-danger); }
.ui-toast.is-info { border-left: 3px solid var(--ui-primary); }
.ui-toast__icon { font-size: 16px; }

/* TransitionGroup 进出场 */
.toast-enter-active, .toast-leave-active { transition: all .3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(30px); }
</style>
