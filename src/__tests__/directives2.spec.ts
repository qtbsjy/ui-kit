// ============================================================
// 指令集扩展单测：vLongPress / vDebounce / vClickOutside（作品㉓）
// ------------------------------------------------------------
// 覆盖:
//   1. vLongPress —— 长按触发 / 短按不触发 / 位移取消 / once
//   2. vDebounce —— 防抖合并 / 延迟触发 / immediate 首击
//   3. vClickOutside —— 内部点击不触发 / 外部触发 / exclude 排除
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { vLongPress } from '../directives/vLongPress'
import { vDebounce } from '../directives/vDebounce'
import { vClickOutside } from '../directives/vClickOutside'

// ---------- vLongPress ----------
describe('vLongPress', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('长按超过 duration 触发一次', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('button', { 'data-test': 'b' }), [[vLongPress, fn]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const btn = wrapper.get('[data-test="b"]').element

    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
    // 默认 500ms, 还没到
    vi.advanceTimersByTime(499)
    expect(fn).not.toHaveBeenCalled()
    // 到达 500ms → 触发
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)

    // 抬起
    btn.dispatchEvent(new PointerEvent('pointerup'))
    wrapper.unmount()
  })

  it('短按(提前松开)不触发', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('button', { 'data-test': 'b' }), [[vLongPress, fn]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const btn = wrapper.get('[data-test="b"]').element
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
    // 按下 100ms 就抬起
    vi.advanceTimersByTime(100)
    btn.dispatchEvent(new PointerEvent('pointerup'))
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('位移超过阈值取消长按(视为拖拽)', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('button', { 'data-test': 'b' }), [[vLongPress, fn]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const btn = wrapper.get('[data-test="b"]').element
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
    // 移动 50px → 超过阈值 10px, 取消
    btn.dispatchEvent(new PointerEvent('pointermove', { clientX: 50, clientY: 0 }))
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('对象形式支持自定义 duration', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(h('button', { 'data-test': 'b' }), [[vLongPress, { handler: fn, duration: 200 }]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const btn = wrapper.get('[data-test="b"]').element
    btn.dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, clientY: 0 }))
    vi.advanceTimersByTime(199)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})

// ---------- vDebounce ----------
describe('vDebounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
  })

  it('连续触发在 wait 后只执行最后一次', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('input', { 'data-test': 'i' }), [[vDebounce, fn]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const input = wrapper.get('[data-test="i"]').element
    // 连续 3 次 input(每次都在 wait 内)
    input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(100)
    input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(100)
    input.dispatchEvent(new Event('input'))
    expect(fn).not.toHaveBeenCalled() // 300ms 未到
    // 完成最后一次的 wait → 只触发 1 次
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('默认 wait 300ms 后触发', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('input', { 'data-test': 'i' }), [[vDebounce, fn]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const input = wrapper.get('[data-test="i"]').element
    input.dispatchEvent(new Event('input'))
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('immediate 修饰符首次立即触发', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(h('input', { 'data-test': 'i' }), [[vDebounce, fn, undefined, { immediate: true }]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const input = wrapper.get('[data-test="i"]').element
    input.dispatchEvent(new Event('input'))
    expect(fn).toHaveBeenCalledTimes(1) // 立即触发
    wrapper.unmount()
  })
})

// ---------- vClickOutside ----------
describe('vClickOutside', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('点击目标内部不触发, 点击外部触发', () => {
    const fn = vi.fn()
    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(h('div', { 'data-test': 'el', style: 'width:100px;height:100px' }), [
            [vClickOutside, fn],
          ])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const el = wrapper.get('[data-test="el"]').element

    // 点击内部
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(fn).not.toHaveBeenCalled()

    // 点击外部(document/body 区域)
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(fn).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('exclude 指定的元素被点击不触发', () => {
    const fn = vi.fn()
    const trigger = document.createElement('button')
    trigger.setAttribute('data-test', 'trigger')
    document.body.appendChild(trigger)

    const Comp = defineComponent({
      setup() {
        return () =>
          withDirectives(h('div', { 'data-test': 'el' }), [
            [vClickOutside, { handler: fn, exclude: [trigger] }],
          ])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const el = wrapper.get('[data-test="el"]').element

    // 点击 exclude 的 trigger 元素 → 不触发
    trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(fn).not.toHaveBeenCalled()

    // 点击 body 其他区域 → 触发
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(fn).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
})
