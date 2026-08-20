// ============================================================
// vDebounce —— 防抖指令（作品㉓ · 指令集扩展）
// ------------------------------------------------------------
// 用法:
//   <input v-debounce="onChange" />              ← 输入停顿 300ms 后触发(默认)
//   <input v-debounce="{ handler, wait: 800 }" />← 自定义延迟
//   <!-- modifiers: .immediate 首次立即触发(leading); .blur 失焦时强制触发 -->
// ------------------------------------------------------------
// 学习重点:
//   1. 防抖(debounce): 事件密集触发时只执行最后一次(等待期重置)
//      场景: 搜索输入/窗口缩放/自动保存, 避免每次 keystroke 都打请求
//   2. 与节流(throttle)区别: 防抖"等停了才执行", 节流"固定间隔执行一次"
//   3. leading 模式(.immediate): 首次立即触发, 后续防抖 —— 用于"点一下立即, 狂点防抖"
//   4. 事件对象透传: 回调收到原生 input 事件
//   5. updated 支持动态改 handler/wait; unmounted 清理挂起的防抖调用
// ============================================================
import type { Directive } from 'vue'

interface DebounceOptions {
  handler: (e: Event) => void
  wait?: number
}

type DebounceValue = ((e: Event) => void) | DebounceOptions

interface DBState {
  handler: (e: Event) => void
  wait: number
  immediate: boolean
  timer: number | null
  lastInvoke: number
}

const states = new WeakMap<HTMLElement, DBState>()

function normalize(
  value: DebounceValue | undefined,
): { handler: (e: Event) => void; wait: number } | null {
  if (!value) return null
  if (typeof value === 'function') return { handler: value, wait: 300 }
  if (typeof value.handler === 'function') {
    return { handler: value.handler, wait: value.wait ?? 300 }
  }
  return null
}

export const vDebounce: Directive<HTMLElement, DebounceValue | undefined> = {
  mounted(el, binding) {
    const opt = normalize(binding.value)
    if (!opt) return
    const state: DBState = {
      handler: opt.handler,
      wait: opt.wait,
      immediate: !!(binding.modifiers && binding.modifiers.immediate),
      timer: null,
      lastInvoke: 0,
    }
    states.set(el, state)

    const onEvent = (e: Event) => {
      const now = Date.now()
      // leading 模式: 距上次执行超过 wait, 立即触发
      if (state.immediate && now - state.lastInvoke > state.wait) {
        state.lastInvoke = now
        state.handler(e)
        return
      }
      // 常规防抖: 清掉上一个未触发的调用, 重新计时
      if (state.timer !== null) clearTimeout(state.timer)
      state.timer = window.setTimeout(() => {
        state.timer = null
        state.lastInvoke = Date.now()
        state.handler(e)
      }, state.wait)
    }
    // blur 时若有挂起的防抖调用, 强制触发(避免用户切走丢失内容)
    const onBlur = () => {
      if (state.timer !== null) {
        clearTimeout(state.timer)
        state.timer = null
        state.handler(new Event('change'))
      }
    }

    el.addEventListener('input', onEvent)
    el.addEventListener('keyup', onEvent) // 兼容非 input 元素(如搜索框 keyup)
    if (binding.modifiers && binding.modifiers.blur) {
      el.addEventListener('blur', onBlur)
    }
    ;(el as any).__dbCleanup = () => {
      el.removeEventListener('input', onEvent)
      el.removeEventListener('keyup', onEvent)
      el.removeEventListener('blur', onBlur)
      if (state.timer !== null) clearTimeout(state.timer)
    }
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    const opt = normalize(binding.value)
    if (!opt) return
    state.handler = opt.handler
    state.wait = opt.wait
  },
  unmounted(el) {
    const state = states.get(el)
    if (!state) return
    if ((el as any).__dbCleanup) {
      ;(el as any).__dbCleanup()
      delete (el as any).__dbCleanup
    }
    states.delete(el)
  },
}

export default vDebounce
