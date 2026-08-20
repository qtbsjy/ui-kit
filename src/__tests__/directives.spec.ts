// ============================================================
// 自定义指令 + useUiConfig 单元测试（作品㉑ 进阶特性）
// ------------------------------------------------------------
// 覆盖:
//   1. vAutoFocus —— 挂载后自动聚焦 / false 不聚焦 / select 修饰符
//   2. vTooltip —— hover 显示 / 空值不显示 / unmounted 清理
//   3. useUiConfig —— 默认配置 / createUiConfig 合并
//   4. UiConfigProvider —— provide/inject 全局配置 + 就近覆盖
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref, withDirectives } from 'vue'
import { vAutoFocus } from '../directives/vAutoFocus'
import { vTooltip } from '../directives/vTooltip'
import { useUiConfig, createUiConfig, defaultUiConfig, type UiConfig } from '../composables/useUiConfig'
import UiConfigProvider from '../components/ui/UiConfigProvider.vue'

// 模拟 body 上的 DOM 计算
function mockDomMeasure() {
  const orig = HTMLElement.prototype.getBoundingClientRect
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const w = this.offsetWidth || 50
    const h = this.offsetHeight || 20
    return { left: 0, top: 0, right: w, bottom: h, width: w, height: h, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
  }
  return orig
}

describe('vAutoFocus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  it('挂载后自动聚焦目标元素', async () => {
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('input', { 'data-test': 'inp' }), [[vAutoFocus, true]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(document.activeElement?.getAttribute('data-test')).toBe('inp')
    wrapper.unmount()
  })

  it('绑定 false 时不聚焦', async () => {
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('input', { 'data-test': 'inp' }), [[vAutoFocus, false]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(document.activeElement?.getAttribute('data-test')).not.toBe('inp')
    wrapper.unmount()
  })

  it('auto-focus.select 修饰符触发 select()', async () => {
    const selectSpy = vi.fn()
    const proto = HTMLInputElement.prototype
    const origSelect = proto.select
    proto.select = selectSpy
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('input', { 'data-test': 'inp' }), [[vAutoFocus, true, undefined, { select: true }]])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    await nextTick()
    expect(selectSpy).toHaveBeenCalled()
    wrapper.unmount()
    proto.select = origSelect
  })
})

describe('vTooltip', () => {
  const origRect = mockDomMeasure()

  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('hover 后创建 tooltip 元素（内容来自 value）', async () => {
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('button', { 'data-test': 'btn' }), [[vTooltip, '保存']])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const btn = wrapper.get('[data-test="btn"]').element
    // 触发展示
    btn.dispatchEvent(new MouseEvent('mouseenter'))
    // 默认延迟 300ms，需要等
    await new Promise((r) => setTimeout(r, 350))
    const tip = document.querySelector('.ui-tooltip')
    expect(tip).toBeTruthy()
    expect(tip?.textContent).toBe('保存')
    wrapper.unmount()
  })

  it('value 为空字符串时不创建 tooltip', async () => {
    const Comp = defineComponent({
      setup() {
        return () => withDirectives(h('button', { 'data-test': 'btn' }), [[vTooltip, '']])
      },
    })
    const wrapper = mount(Comp, { attachTo: document.body })
    const btn = wrapper.get('[data-test="btn"]').element
    btn.dispatchEvent(new MouseEvent('mouseenter'))
    await new Promise((r) => setTimeout(r, 350))
    expect(document.querySelector('.ui-tooltip')).toBeNull()
    wrapper.unmount()
  })

  it('unmount 后清理 tooltip DOM 与定时器', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return () => withDirectives(h('button', { 'data-test': 'btn' }), [[vTooltip, 'x']])
        },
      }),
      { attachTo: document.body },
    )
    wrapper.get('[data-test="btn"]').element.dispatchEvent(new MouseEvent('mouseenter'))
    await new Promise((r) => setTimeout(r, 350))
    expect(document.querySelector('.ui-tooltip')).toBeTruthy()
    wrapper.unmount()
    await nextTick()
    expect(document.querySelector('.ui-tooltip')).toBeNull()
  })

  // 还原 getBoundingClientRect
  afterAll(() => {
    HTMLElement.prototype.getBoundingClientRect = origRect
  })
})

describe('useUiConfig / createUiConfig', () => {
  it('默认配置与 defaultUiConfig 一致', () => {
    const cfg = createUiConfig()
    expect(cfg.tooltipDelay).toBe(defaultUiConfig.tooltipDelay)
    expect(cfg.tooltipPlacement).toBe(defaultUiConfig.tooltipPlacement)
    expect(cfg.animated).toBe(true)
  })

  it('createUiConfig 浅合并覆盖', () => {
    const cfg = createUiConfig({ tooltipDelay: 800, tooltipPlacement: 'bottom' })
    expect(cfg.tooltipDelay).toBe(800)
    expect(cfg.tooltipPlacement).toBe('bottom')
    expect(cfg.animated).toBe(true) // 未覆盖的用默认
  })

  it('未包 Provider 时 useUiConfig 返回默认配置', () => {
    const Child = defineComponent({
      setup() {
        const cfg = useUiConfig()
        return () => h('span', { 'data-test': 'val' }, String(cfg.tooltipDelay))
      },
    })
    const wrapper = mount(Child)
    expect(wrapper.get('[data-test="val"]').text()).toBe(String(defaultUiConfig.tooltipDelay))
  })
})

describe('UiConfigProvider', () => {
  it('通过 provide/inject 向子树提供配置', () => {
    const Child = defineComponent({
      setup() {
        const cfg = useUiConfig()
        return () => h('span', { 'data-test': 'val' }, String(cfg.tooltipDelay))
      },
    })
    const App = defineComponent({
      components: { UiConfigProvider, Child },
      setup() {
        return () =>
          h(UiConfigProvider, { tooltipDelay: 1200 }, () => h(Child))
      },
    })
    const wrapper = mount(App)
    expect(wrapper.get('[data-test="val"]').text()).toBe('1200')
  })

  it('内层 Provider 就近覆盖外层', () => {
    const Child = defineComponent({
      setup() {
        const cfg = useUiConfig()
        return () => h('span', { 'data-test': 'val' }, String(cfg.tooltipDelay))
      },
    })
    const App = defineComponent({
      components: { UiConfigProvider, Child },
      setup() {
        return () =>
          h(
            UiConfigProvider,
            { tooltipDelay: 500 },
            () =>
              h(UiConfigProvider, { tooltipDelay: 900 }, () => h(Child)),
          )
      },
    })
    const wrapper = mount(App)
    expect(wrapper.get('[data-test="val"]').text()).toBe('900')
  })
})
