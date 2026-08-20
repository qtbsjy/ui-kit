// ============================================================
// vClickOutside —— 点击外部指令（作品㉓ · 指令集扩展）
// ------------------------------------------------------------
// 用法:
//   <div v-click-outside="close">下拉内容</div>      ← 点击此元素外部时调用 close
//   <div v-click-outside="{ handler, exclude: [ref] }">…</div> ← 可排除特定元素
// ------------------------------------------------------------
// 学习重点:
//   1. 监听 document 的 pointerdown(捕获阶段) —— 捕获阶段才能先于组件内部事件
//      拿到"这次点击落在哪里", 用于判断是否在目标元素外部
//   2. border box 判断: 用 getBoundingClientRect 判断点击坐标是否落在元素内
//   3. 排除元素: 点击 options 里 exclude 指定的元素(如另一个触发按钮)不关闭
//   4. 挂载即监听, 卸载即移除 —— 一个指令管理全局事件
//   5. 典型场景: 下拉菜单/弹出层/搜索建议的"点击外部关闭"
// ============================================================
import type { Directive } from 'vue'

interface ClickOutsideOptions {
  handler: () => void
  /** 点击这些元素的外部(如触发按钮)不触发 */
  exclude?: HTMLElement[]
}

type ClickOutsideValue = (() => void) | ClickOutsideOptions

interface COState {
  handler: () => void
  exclude: HTMLElement[]
}

const states = new WeakMap<HTMLElement, COState>()

function normalize(value: ClickOutsideValue | undefined): COState | null {
  if (!value) return null
  if (typeof value === 'function') return { handler: value, exclude: [] }
  if (typeof value.handler === 'function') {
    return { handler: value.handler, exclude: value.exclude ?? [] }
  }
  return null
}

export const vClickOutside: Directive<HTMLElement, ClickOutsideValue | undefined> = {
  mounted(el, binding) {
    const opt = normalize(binding.value)
    if (!opt) return
    const state: COState = { handler: opt.handler, exclude: opt.exclude }
    states.set(el, state)

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (!target || !(target instanceof Node)) return

      // 点击落在目标元素内部 → 不算"外部", 不触发
      if (el.contains(target)) return
      // 点击落在排除元素(或其后代) → 不触发
      if (state.exclude.some((ex) => ex && (ex === target || ex.contains(target)))) return
      // 否则: 点到了元素外部, 触发回调
      state.handler()
    }

    // 捕获阶段(true)监听 —— 确保在目标元素自己的事件处理前判断
    document.addEventListener('pointerdown', onPointerDown, true)
    ;(el as any).__coCleanup = () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    const opt = normalize(binding.value)
    if (!opt) return
    state.handler = opt.handler
    state.exclude = opt.exclude
  },
  unmounted(el) {
    const state = states.get(el)
    if (!state) return
    if ((el as any).__coCleanup) {
      ;(el as any).__coCleanup()
      delete (el as any).__coCleanup
    }
    states.delete(el)
  },
}

export default vClickOutside
