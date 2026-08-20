/**
 * UiVirtualList 单元测试
 * 验证：只渲染可视子集、滚动后窗口移动、占位高度正确、overscan、插槽数据、refresh。
 *
 * jsdom 里 clientHeight 恒为 0 且 ResizeObserver 不触发。这里：
 *  - 用可变变量 mock Element.prototype.clientHeight（让容器 ref 也能读到）
 *  - mock ResizeObserver：构造时立即回调一次（组件 onMounted 里 observe 即触发第一次 measure）
 *  - 断言前 nextTick() 等 Vue 响应式刷帧
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import UiVirtualList from '../components/ui/UiVirtualList.vue'

// 可变的"容器高度"开关
let mockHeight = 0
beforeEach(() => {
  mockHeight = 0
  // mock clientHeight：所有元素都返回 mockHeight
  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return mockHeight
    },
  })
  // mock ResizeObserver：构造即回调，让 onMounted 里的 observe() 立即触发 measure()
  ;(globalThis as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
})

const items = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }))

function mountWith(itemsArr: unknown[], props: Record<string, unknown> = {}) {
  return mount(UiVirtualList, {
    props: { items: itemsArr, rowHeight: 40, ...props },
    slots: { default: `<template #default="{ item, index }"><span class="row">{{ item.name }}:{{ index }}</span></template>` },
  })
}

describe('UiVirtualList', () => {
  it('滚动加载：容器 400px，渲染 ceil(400/40)+overscan 行', async () => {
    mockHeight = 400
    const w = mountWith(items, { overscan: 1 })
    await nextTick()
    // 400/40=10 + overscan 上下各 1 = 12
    expect(w.findAll('.ui-vlist__row').length).toBe(12)
    // 顶占位 = startIndex(0)*40 = 0
    expect(w.find('.ui-vlist__pad').element.style.height).toBe('0px')
    expect(w.findAll('.row')[0]!.text()).toContain('item-0:0')
  })

  it('滚动后：起始索引上移、渲染窗口移动、顶占位更新', async () => {
    mockHeight = 400
    const w = mountWith(items)
    await nextTick()
    Object.defineProperty(w.element, 'scrollTop', { value: 4000, configurable: true })
    ;(w.element as HTMLElement).dispatchEvent(new Event('scroll'))
    // rAF 节流，等一帧
    await new Promise((r) => requestAnimationFrame(r))
    await nextTick()
    const rows = w.findAll('.ui-vlist__row')
    // 400/40=10 + overscan(默认3)上下各3 = 16
    expect(rows.length).toBe(16)
    // 首行 = startIndex(100-overscan3=97) → item-97
    expect(w.findAll('.row')[0]!.text()).toContain('item-97')
    // 顶占位 = (100-3)*40 = 3880（startIndex 前移了 overscan=3）
    expect(w.find('.ui-vlist__pad').element.style.height).toBe('3880px')
  })

  it('底占位 = 未渲染行数 × rowHeight', async () => {
    mockHeight = 400
    const w = mountWith(items, { overscan: 0 })
    await nextTick()
    Object.defineProperty(w.element, 'scrollTop', { value: 0, configurable: true })
    ;(w.element as HTMLElement).dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(r))
    await nextTick()
    const pads = w.findAll('.ui-vlist__pad')
    // top = 0, bottom = (1000-10)*40 = 39600
    expect(pads[0]!.element.style.height).toBe('0px')
    expect(pads[1]!.element.style.height).toBe('39600px')
  })

  it('数据变更后重新渲染', async () => {
    mockHeight = 200
    const w = mountWith(items)
    await nextTick()
    const newItems = [{ id: 1, name: 'new-one' }, { id: 2, name: 'new-two' }]
    await w.setProps({ items: newItems })
    await nextTick()
    expect(w.findAll('.ui-vlist__row').length).toBe(2)
    expect(w.findAll('.row')[0]!.text()).toContain('new-one')
  })

  it('scrollable=false 时不渲染滚动条（无 is-scrollable 类）', () => {
    const w = mountWith(items, { scrollable: false })
    expect(w.find('.ui-vlist').classes()).not.toContain('is-scrollable')
  })

  it('暴露 refresh()：手动重新测量可更新渲染数', async () => {
    mockHeight = 0
    const w = mountWith(items, { overscan: 0 })
    await nextTick()
    expect(w.findAll('.ui-vlist__row').length).toBe(0)
    mockHeight = 200
    ;(w.vm as any).refresh()
    await nextTick()
    expect(w.findAll('.ui-vlist__row').length).toBe(5) // 200/40
  })

  it('overscan=0 时只精确渲染可视行', async () => {
    mockHeight = 200
    const w = mountWith(items, { overscan: 0 })
    await nextTick()
    expect(w.findAll('.ui-vlist__row').length).toBe(5) // 200/40
  })
})
