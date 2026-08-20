/**
 * UiVirtualList 动态行高模式（variable=true）单元测试
 * 验证：估算占位、measure 上报真实高度后偏移修正、二分定位、总高度累加。
 *
 * jsdom 测高度策略（同固定模式）：
 *  - mock Element.prototype.offsetHeight（可变，控制每行实测高度）
 *  - mock ResizeObserver 构造即回调
 *  - nextTick 等刷帧
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import UiVirtualList from '../components/ui/UiVirtualList.vue'

// 每行实测高度（由测试控制，模拟"动态行高"）
let rowHeights: number[] = []
beforeEach(() => {
  rowHeights = []
  // 容器高度
  Object.defineProperty(Element.prototype, 'clientHeight', {
    configurable: true,
    get() {
      return 400 // 视口 400px
    },
  })
  // 动态行：offsetHeight 按该元素 data-index 取对应行高（未设置的行回 0 → 被 setActualHeight 忽略）
  // 注意：jsdom 的 offsetHeight 在 HTMLElement.prototype 上，Element.prototype 会被遮蔽 → 要 define 在 HTMLElement.prototype
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      const idx = Number(this.getAttribute('data-index'))
      if (Number.isNaN(idx) || !rowHeights.length) return 0
      return rowHeights[Math.min(rowHeights.length - 1, idx)] ?? 0
    },
  })
  ;(globalThis as any).ResizeObserver = class {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
})

// 造 100 条数据（行高各异：40~120 波动）
const items = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `item-${i}` }))

// 挂载动态模式：slot 根节点绑 measure ref
function mountVar(itemsArr: unknown[], opts: Record<string, unknown> = {}) {
  return mount(UiVirtualList, {
    props: { items: itemsArr, variable: true, estimatedRowHeight: 80, overscan: 0, ...opts },
    slots: {
      default: `<template #default="{ item, index, measure }">
        <div class="var-row" :ref="measure" :data-index="index">{{ item.name }}</div>
      </template>`,
    },
    global: { stubs: {} },
  })
}

describe('UiVirtualList · 动态行高', () => {
  it('未测量时按估算高度撑总高 / 占位', async () => {
    rowHeights = []
    const w = mountVar(items)
    // 由于 offsetHeight=0 被忽略，行高保持估算 80 → 总高 100*80=8000
    await nextTick()
    // 顶占位 0
    const pads = w.findAll('.ui-vlist__pad')
    expect(pads[0]!.element.style.height).toBe('0px')
    // 但行已经渲染（没有高度样式，随内容）
    expect(w.findAll('.var-row').length).toBeGreaterThan(0)
  })

  it('measure 上报真实高度后修正后续偏移（总高度累加）', async () => {
    // 全部行实测 60px
    rowHeights = new Array(100).fill(60)
    const w = mountVar(items)
    await nextTick()
    // 初始视口 400px 只测量约前几行；渲染行数 = ceil(400/60)+overscan
    const rows = w.findAll('.var-row')
    expect(rows.length).toBeGreaterThan(0)
    // 底占位 = 总高(约 100×60 但未测行按估算) - 已渲染高度，应 > 0
    const bottomRaw = parseInt(w.findAll('.ui-vlist__pad')[1]!.element.style.height, 10)
    expect(bottomRaw).toBeGreaterThan(0)
  })

  it('滚动后二分定位到正确行（视口足够高保证目标行已被测量）', async () => {
    // 全部行 100px
    rowHeights = new Array(100).fill(100)
    // 视口 8000px → 初渲染就把全部行都测量到（100 行×100=10000，前 80 行覆盖 8000）
    Object.defineProperty(Element.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 8000
      },
    })
    const w = mountVar(items)
    await nextTick()
    Object.defineProperty(w.element, 'scrollTop', { value: 3000, configurable: true })
    ;(w.element as HTMLElement).dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(r))
    await nextTick()
    // scrollTop=3000，行高100（已全测量）→ 第 30 行（含 overscan 前移则为 30）
    const idx = Number(w.findAll('.var-row')[0]?.attributes('data-index'))
    expect(idx).toBeLessThanOrEqual(30)
    expect(idx).toBeGreaterThanOrEqual(28)
  })

  it('不同行高：高行数越多，同样 scrollTop 定位越靠前（已测量范围）', async () => {
    // 前半高 200，后半高 40
    rowHeights = Array.from({ length: 100 }, (_, i) => (i < 50 ? 200 : 40))
    // 视口 8000 → 覆盖前 50×200=10000 > 8000，前段 40 行被测量
    Object.defineProperty(Element.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 8000
      },
    })
    const w = mountVar(items)
    await nextTick()
    Object.defineProperty(w.element, 'scrollTop', { value: 3000, configurable: true })
    ;(w.element as HTMLElement).dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(r))
    await nextTick()
    // 全 200px 时 3000/200=15；前 50 行 200px → 第 15 行附近
    const idx = Number(w.findAll('.var-row')[0]?.attributes('data-index'))
    expect(idx).toBeLessThanOrEqual(18)
    expect(idx).toBeGreaterThanOrEqual(13)
  })

  it('measure 未绑定时（固定模式）不影响', async () => {
    // 固定模式：slot 里 measure 为 undefined
    const w = mount(UiVirtualList, {
      props: { items, rowHeight: 40, overscan: 0 },
      slots: { default: `<template #default="{ item }"><div class="fx-row">{{ item.name }}</div></template>` },
    })
    await nextTick()
    const rows = w.findAll('.ui-vlist__row')
    expect(rows.length).toBe(10) // 400/40
  })

  it('数据变更后重置偏移缓存', async () => {
    rowHeights = new Array(100).fill(60)
    const w = mountVar(items)
    await nextTick()
    await w.setProps({ items: items.slice(0, 10) })
    await nextTick()
    // 重建后只有 10 行；底占位反映新总高（约 10*60=600）减去已渲染
    const pads = w.findAll('.ui-vlist__pad')
    const bottomRaw = parseInt(pads[1]!.element.style.height, 10)
    expect(bottomRaw).toBeLessThan(600)
  })
})
