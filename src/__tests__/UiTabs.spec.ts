// ============================================================
// UiTabs + UiTabPanel 单元测试（作品㉙ 标签页）
// ------------------------------------------------------------
// 覆盖:
//   1. 渲染 — 标签条 + 默认激活面板展示
//   2. v-model（受控）— 点击切换 → update:modelValue + 面板联动
//   3. 非受控 defaultActive — 初始激活项 + 内部切换
//   4. disabled — 禁用 tab 不可选中
//   5. 键盘导航 — 方向键/Home/End + 跳过禁用 + 焦点跟随
//   6. line/card 两种风格类名
//   7. lazy 懒挂载 — 首次激活才渲染面板内容
//   8. provide/inject 解耦 — 面板不依赖 tabs 数组
// ============================================================
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UiTabs from '../components/ui/UiTabs.vue'
import UiTabPanel from '../components/ui/UiTabPanel.vue'

const baseTabs = [
  { label: '简介', value: 'about' },
  { label: '成员', value: 'team' },
  { label: '设置', value: 'settings' },
]

function mountTabs(props: Record<string, unknown> = {}, slots = {}) {
  return mount(UiTabs, {
    props: { tabs: baseTabs, ...props },
    slots: {
      default: `
        <UiTabPanel name="about"><p class="p-about">简介内容</p></UiTabPanel>
        <UiTabPanel name="team"><p class="p-team">成员内容</p></UiTabPanel>
        <UiTabPanel name="settings"><p class="p-settings">设置内容</p></UiTabPanel>
      `,
      ...slots,
    },
    global: {
      components: { UiTabPanel },
    },
  })
}

describe('UiTabs', () => {
  it('渲染标签条，默认激活第一个 tab 并显示对应面板', () => {
    const w = mountTabs()
    const tabs = w.findAll('.ui-tabs__tab')
    expect(tabs).toHaveLength(3)
    expect(tabs[0].classes()).toContain('is-active')
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(tabs[1].attributes('aria-selected')).toBe('false')
    // 面板联动
    expect(w.find('.p-about').exists()).toBe(true)
    expect(w.find('.p-team').exists()).toBe(false)
  })

  it('点击标签 → 切换激活项并联动面板（非受控）', async () => {
    const w = mountTabs()
    await w.findAll('.ui-tabs__tab')[1].trigger('click')
    expect(w.findAll('.ui-tabs__tab')[1].classes()).toContain('is-active')
    expect(w.find('.p-about').exists()).toBe(false)
    expect(w.find('.p-team').exists()).toBe(true)
    // change 事件
    expect(w.emitted('change')![0]).toEqual(['team'])
  })

  it('v-model（受控）→ 点击触发 update:modelValue，面板跟随 prop', async () => {
    const w = mountTabs({ modelValue: 'about' })
    // 点击"成员"
    await w.findAll('.ui-tabs__tab')[1].trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual(['team'])
    // 受控：我没改 prop 的话内部不变，面板由 prop 决定
    expect(w.find('.p-about').exists()).toBe(true)
    // 重新挂载传 modelValue=team → 面板切到 team
    const w2 = mountTabs({ modelValue: 'team' })
    expect(w2.find('.p-team').exists()).toBe(true)
  })

  it('defaultActive 指定初始激活项（非受控）', () => {
    const w = mountTabs({ defaultActive: 'settings' })
    expect(w.findAll('.ui-tabs__tab')[2].classes()).toContain('is-active')
    expect(w.find('.p-settings').exists()).toBe(true)
  })

  it('disabled 的 tab 不可点击选中', async () => {
    const tabs = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
      { label: 'C', value: 'c' },
    ]
    const w = mount(UiTabs, {
      props: { tabs, defaultActive: 'a' },
      global: { components: { UiTabPanel } },
    })
    const bTab = w.findAll('.ui-tabs__tab')[1]
    expect(bTab.classes()).toContain('is-disabled')
    expect(bTab.attributes('disabled')).toBeDefined()
    await bTab.trigger('click')
    // 仍停留在 a，未 emit change
    expect(w.emitted('change')).toBeUndefined()
    expect(w.findAll('.ui-tabs__tab')[0].classes()).toContain('is-active')
  })

  it('键盘导航：方向键切换 + 跳过禁用 + Home/End + 焦点跟随', async () => {
    const tabs = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
      { label: 'C', value: 'c' },
      { label: 'D', value: 'd' },
    ]
    const w = mount(UiTabs, {
      props: { tabs, defaultActive: 'a' },
      global: { components: { UiTabPanel } },
    })
    const tabEls = w.findAll('.ui-tabs__tab')

    // A 上按 ArrowRight → 跳过禁用的 B → 激活 C
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
    await tabEls[0].trigger('keydown', { key: 'ArrowRight' })
    expect(tabEls[2].classes()).toContain('is-active')
    // 焦点跟随：激活项拿到 tabindex=0（roving tabindex，其余 -1）
    expect(tabEls[2].attributes('tabindex')).toBe('0')
    expect(tabEls[0].attributes('tabindex')).toBe('-1')
    // 组件确实对新激活项调用了 focus()
    expect(focusSpy).toHaveBeenCalled()
    expect(focusSpy.mock.instances[0]?.id).toBe('ui-tab-c')
    focusSpy.mockRestore()
    expect(w.emitted('change')![0]).toEqual(['c'])

    // C 上按 End → 激活 D
    await tabEls[2].trigger('keydown', { key: 'End' })
    expect(tabEls[3].classes()).toContain('is-active')

    // D 上按 Home → 激活 A
    await tabEls[3].trigger('keydown', { key: 'Home' })
    expect(tabEls[0].classes()).toContain('is-active')

    // A 上按 ArrowLeft → 回绕到 D
    await tabEls[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(tabEls[3].classes()).toContain('is-active')
  })

  it('card 风格 & line 风格类名', () => {
    const line = mountTabs({ type: 'line' })
    expect(line.find('.ui-tabs').classes()).not.toContain('is-card')
    // line 有下划线指示器元素
    expect(line.find('.ui-tabs__indicator').exists()).toBe(true)

    const card = mountTabs({ type: 'card' })
    expect(card.find('.ui-tabs').classes()).toContain('is-card')
    expect(card.find('.ui-tabs__indicator').exists()).toBe(false)
  })

  it('lazy 面板：首次激活前不渲染内容，激活后才挂载', async () => {
    const w = mount(UiTabs, {
      props: { tabs: baseTabs },
      slots: {
        default: `
          <UiTabPanel name="about"><p class="p-about">简介</p></UiTabPanel>
          <UiTabPanel name="team" lazy><p class="p-team">成员</p></UiTabPanel>
        `,
      },
      global: { components: { UiTabPanel } },
    })
    // 初始：about 显示，team(lazy) 未挂载
    expect(w.find('.p-team').exists()).toBe(false)
    // 切到 team → lazy 面板首次挂载
    await w.findAll('.ui-tabs__tab')[1].trigger('click')
    expect(w.find('.p-team').exists()).toBe(true)
  })
})
