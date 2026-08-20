// ============================================================
// vLongPress —— 长按自定义指令（作品㉓ · 指令集扩展）
// ------------------------------------------------------------
// 用法:
//   <button v-long-press="onLongPress">长按我</button>        ← 长按触发
//   <button v-long-press="{ handler: fn, duration: 600 }">…</button>
//   <!-- modifiers: .once 仅触发一次; .prevent 阻止默认(如长按选中的文本) -->
// ------------------------------------------------------------
// 学习重点:
//   1. 长按 = 按下(pointerdown) + 计时器(默认 500ms) + 位移超阈值取消
//   2. 同时监听 mouse 和 touch, 移动端/桌面通用
//   3. 位移检测: 手指/鼠标移动超过 10px 判为"拖拽"而非"长按", 取消触发
//   4. 纯函数指令: 不持有组件实例, 状态存 WeakMap 防泄漏
//   5. updated: 动态更新回调/时长; unmounted: 清理计时器与监听
// ============================================================
import type { Directive } from 'vue'

interface LongPressOptions {
  handler: (e: PointerEvent) => void
  duration?: number
}

type LongPressValue = ((e: PointerEvent) => void) | LongPressOptions

interface LPState {
  timer: number | null
  startX: number
  startY: number
  handler: (e: PointerEvent) => void
  duration: number
  fired: boolean
  once: boolean
}

const states = new WeakMap<HTMLElement, LPState>()

// 位移超过此值判为"拖拽/滚动手势", 不算长按
const MOVE_THRESHOLD = 10

// 归一化 value: 可能是函数(直接是 handler) 或 { handler, duration }
function normalize(value: LongPressValue | undefined): Pick<LPState, 'handler' | 'duration'> | null {
  if (!value) return null
  if (typeof value === 'function') return { handler: value, duration: 500 }
  if (typeof value.handler === 'function') {
    return { handler: value.handler, duration: value.duration ?? 500 }
  }
  return null
}

function clearTimer(state: LPState) {
  if (state.timer !== null) {
    clearTimeout(state.timer)
    state.timer = null
  }
}

export const vLongPress: Directive<HTMLElement, LongPressValue | undefined> = {
  mounted(el, binding) {
    const opt = normalize(binding.value)
    if (!opt) return
    const state: LPState = {
      timer: null,
      startX: 0,
      startY: 0,
      handler: opt.handler,
      duration: opt.duration,
      fired: false,
      once: !!(binding.modifiers && binding.modifiers.once),
    }
    states.set(el, state)

    const onDown = (e: PointerEvent) => {
      // 左键 / 触摸按下才处理
      if (e.pointerType === 'mouse' && e.button !== 0) return
      state.startX = e.clientX
      state.startY = e.clientY
      state.fired = false
      if (binding.modifiers && binding.modifiers.prevent) e.preventDefault()
      // 开始长按计时
      clearTimer(state)
      state.timer = window.setTimeout(() => {
        state.fired = true
        state.handler(e)
        if (state.once) {
          // 触发一次后卸载监听
          el.removeEventListener('pointerdown', onDown)
        }
      }, state.duration)
    }

    const onMove = (e: PointerEvent) => {
      // 位移超过阈值 → 取消长按
      if (state.timer === null) return
      if (Math.abs(e.clientX - state.startX) > MOVE_THRESHOLD || Math.abs(e.clientY - state.startY) > MOVE_THRESHOLD) {
        clearTimer(state)
      }
    }

    const onUp = () => clearTimer(state)

    // 提升阶段默认; 用绑定函数方便移除
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    // 存起来供清理
    ;(el as any).__lpCleanup = () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      clearTimer(state)
    }
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    const opt = normalize(binding.value)
    if (!opt) return
    state.handler = opt.handler
    state.duration = opt.duration
    state.once = !!(binding.modifiers && binding.modifiers.once)
  },
  unmounted(el) {
    const state = states.get(el)
    if (!state) return
    if ((el as any).__lpCleanup) {
      ;(el as any).__lpCleanup()
      delete (el as any).__lpCleanup
    }
    states.delete(el)
  },
}

export default vLongPress
