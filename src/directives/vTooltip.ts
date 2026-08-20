// ============================================================
// vTooltip —— 悬浮提示自定义指令（作品㉑ 进阶特性：自定义指令）
// ------------------------------------------------------------
// 用法:
//   <button v-tooltip="'保存'">保存</button>              ← 默认方向(top)
//   <button v-tooltip.bottom="'删除'">删</button>          ← 修饰符指定方向
//   <button v-tooltip="{ text:'提示', placement:'left' }">…</button>
// ------------------------------------------------------------
// 学习重点:
//   1. 自定义指令生命周期: mounted / updated / unmounted（对应组件挂载/更新/卸载）
//   2. binding.value —— 指令绑定的值(可以是字符串或对象)
//   3. binding.arg / binding.modifiers —— 指令参数与修饰符
//   4. 在指令里调用 composable(useUiConfig) 读取全局配置 —— 指令也活在响应式上下文
//   5. 资源清理: unmounted 里移除 DOM 与事件监听, 防内存泄漏
//   6. 一个空的 tooltip 内容时不显示(防呆)
// ============================================================
import { type Directive } from 'vue'

/** v-tooltip 可接受的值: 字符串文本 或 { text, placement } 对象 */
type TooltipValue = string | { text: string; placement?: 'top' | 'bottom' | 'left' | 'right' }

/** 默认配置 —— 自定义指令脱离组件上下文，无法 inject，这里内置默认（可用 value 覆盖） */
const DEFAULT_TOOLTIP = {
  delay: 300, // 显示延迟 ms
  placement: 'top' as 'top' | 'bottom' | 'left' | 'right',
}

interface TooltipState {
  el: HTMLElement
  tip: HTMLElement | null
  showTimer: number | null
  hideTimer: number | null
  text: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

// 每个绑定元素一份状态
const states = new WeakMap<HTMLElement, TooltipState>()

function normalize(value: TooltipValue | undefined): TooltipState['text'] | null {
  if (typeof value === 'string') return value || null
  if (value && typeof value === 'object' && 'text' in value) return value.text || null
  return null
}

function placementOf(
  value: TooltipValue | undefined,
  mods: Partial<Record<string, boolean>>,
  arg?: string,
): TooltipState['placement'] {
  // 优先级: 对象里的 placement > 修饰符 > 指令参数(arg) > 全局配置
  if (value && typeof value === 'object' && 'placement' in value && value.placement) {
    return value.placement
  }
  if (mods.top) return 'top'
  if (mods.bottom) return 'bottom'
  if (mods.left) return 'left'
  if (mods.right) return 'right'
  if (arg === 'top' || arg === 'bottom' || arg === 'left' || arg === 'right') return arg
  return DEFAULT_TOOLTIP.placement
}

/** 构建 tooltip 元素（用指令内联一个最小 tooltip 组件） */
function createTip(state: TooltipState) {
  const host = document.createElement('div')
  host.className = 'ui-tooltip'
  host.textContent = state.text
  host.setAttribute('role', 'tooltip')
  document.body.appendChild(host)
  host.style.position = 'fixed'
  host.style.zIndex = '9999'
  host.style.pointerEvents = 'none' // 不遮挡鼠标
  return host
}

function position(state: TooltipState) {
  const { el, tip, placement } = state
  if (!tip) return
  const r = el.getBoundingClientRect()
  const tw = tip.offsetWidth
  const th = tip.offsetHeight
  // 按方向取坐标（额外留 8px 间距）
  switch (placement) {
    case 'top':
      tip.style.left = `${r.left + r.width / 2 - tw / 2}px`
      tip.style.top = `${r.top - th - 8}px`
      break
    case 'bottom':
      tip.style.left = `${r.left + r.width / 2 - tw / 2}px`
      tip.style.top = `${r.bottom + 8}px`
      break
    case 'left':
      tip.style.left = `${r.left - tw - 8}px`
      tip.style.top = `${r.top + r.height / 2 - th / 2}px`
      break
    case 'right':
      tip.style.left = `${r.right + 8}px`
      tip.style.top = `${r.top + r.height / 2 - th / 2}px`
      break
  }
}

export const vTooltip: Directive<HTMLElement, TooltipValue | undefined> = {
  mounted(el, binding) {
    const text = normalize(binding.value)
    if (!text) return
    const state: TooltipState = {
      el,
      tip: null,
      showTimer: null,
      hideTimer: null,
      text,
      placement: placementOf(binding.value, binding.modifiers, binding.arg),
    }
    states.set(el, state)

    // 用指令卡在元素上的事件监听 —— 不在 DOM 上挂额外事件, 靠元素自身事件
    el.addEventListener('mouseenter', () => {
      // 防抖: 延迟 cfg.tooltipDelay ms 再显示
      if (state.hideTimer) clearTimeout(state.hideTimer)
      state.showTimer = window.setTimeout(() => {
        if (!state.tip) state.tip = createTip(state)
        else state.tip.style.display = 'block'
        position(state)
      }, DEFAULT_TOOLTIP.delay)
    })
    el.addEventListener('mouseleave', () => {
      if (state.showTimer) clearTimeout(state.showTimer)
      state.hideTimer = window.setTimeout(() => {
        if (state.tip) state.tip.style.display = 'none'
      }, 100)
    })
  },
  updated(el, binding) {
    const state = states.get(el)
    if (!state) return
    const text = normalize(binding.value)
    if (!text) {
      // 内容变空 → 清掉 tip
      state.tip?.remove()
      state.tip = null
      return
    }
    state.text = text
    state.placement = placementOf(binding.value, binding.modifiers, binding.arg)
    if (state.tip) {
      state.tip.textContent = text
      position(state)
    }
  },
  unmounted(el) {
    const state = states.get(el)
    if (!state) return
    if (state.showTimer) clearTimeout(state.showTimer)
    if (state.hideTimer) clearTimeout(state.hideTimer)
    state.tip?.remove()
    states.delete(el)
  },
}

export default vTooltip
