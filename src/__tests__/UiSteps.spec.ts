// UiSteps 步骤条测试（作品㊴）
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSteps from '../components/ui/UiSteps.vue'

const items = [
  { title: '填写信息', description: '填写企业基础资料' },
  { title: '资质审核', description: '1-3 个工作日' },
  { title: '签署合同' },
  { title: '完成入驻' },
]

function mountSteps(props: Record<string, unknown> = {}) {
  return mount(UiSteps, {
    props: { items, ...props },
    attachTo: document.body,
  })
}

describe('UiSteps 基础渲染', () => {
  it('渲染所有步骤标题与描述', () => {
    const wrapper = mountSteps()
    expect(wrapper.findAll('.ui-steps__item').length).toBe(4)
    expect(wrapper.text()).toContain('填写信息')
    expect(wrapper.text()).toContain('填写企业基础资料')
    expect(wrapper.text()).toContain('签署合同')
    wrapper.unmount()
  })

  it('使用 ol/li 语义结构', () => {
    const wrapper = mountSteps()
    expect(wrapper.element.tagName).toBe('OL')
    expect(wrapper.findAll('li').length).toBe(4)
    wrapper.unmount()
  })

  it('最后一个步骤不渲染连接线', () => {
    const wrapper = mountSteps()
    // 4 个步骤 → 只有 3 条线
    expect(wrapper.findAll('.ui-steps__line').length).toBe(3)
    wrapper.unmount()
  })

  it('direction=vertical 时加对应类名', () => {
    const wrapper = mountSteps({ direction: 'vertical' })
    expect(wrapper.classes()).toContain('ui-steps--vertical')
    wrapper.unmount()
  })

  it('size=small 时加对应类名', () => {
    const wrapper = mountSteps({ size: 'small' })
    expect(wrapper.classes()).toContain('ui-steps--small')
    wrapper.unmount()
  })
})

describe('UiSteps 状态推算', () => {
  it('非受控：defaultActive=1 → 第 0 步完成、第 1 步进行中、其余等待', () => {
    const wrapper = mountSteps({ defaultActive: 1 })
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[0]!.classes()).toContain('is-finish')
    expect(lis[1]!.classes()).toContain('is-process')
    expect(lis[2]!.classes()).toContain('is-wait')
    expect(lis[3]!.classes()).toContain('is-wait')
    wrapper.unmount()
  })

  it('受控：active=2 → 前两步完成', () => {
    const wrapper = mountSteps({ active: 2 })
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[0]!.classes()).toContain('is-finish')
    expect(lis[1]!.classes()).toContain('is-finish')
    expect(lis[2]!.classes()).toContain('is-process')
    wrapper.unmount()
  })

  it('active 变化时状态跟着变', async () => {
    const wrapper = mountSteps({ active: 0 })
    expect(wrapper.findAll('.ui-steps__item')[0]!.classes()).toContain('is-process')
    await wrapper.setProps({ active: 2 })
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[0]!.classes()).toContain('is-finish')
    expect(lis[2]!.classes()).toContain('is-process')
    wrapper.unmount()
  })

  it('item.status=error 覆盖位置推算', () => {
    const withError = [
      { title: 'A' },
      { title: 'B', status: 'error' as const },
      { title: 'C' },
    ]
    const wrapper = mount(UiSteps, { props: { items: withError, active: 1 }, attachTo: document.body })
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[1]!.classes()).toContain('is-error')
    expect(lis[1]!.text()).toContain('✕')
    wrapper.unmount()
  })

  it('error 步骤的连接线也是错误色（加 is-finish 类）', () => {
    const withError = [
      { title: 'A' },
      { title: 'B', status: 'error' as const },
      { title: 'C' },
    ]
    const wrapper = mount(UiSteps, { props: { items: withError, active: 2 }, attachTo: document.body })
    const lines = wrapper.findAll('.ui-steps__line')
    // 第 0 条线（A→B）：A 是 finish → 点亮
    expect(lines[0]!.classes()).toContain('is-finish')
    // 第 1 条线（B→C）：B 是 error → 也点亮（用错误色）
    expect(lines[1]!.classes()).toContain('is-finish')
    wrapper.unmount()
  })

  it('每条线的点亮取决于「左侧步骤是否已完成/错误」', () => {
    const wrapper = mountSteps({ active: 1 })
    const lines = wrapper.findAll('.ui-steps__line')
    expect(lines[0]!.classes()).toContain('is-finish') // 第0步 finish
    expect(lines[1]!.classes()).not.toContain('is-finish') // 第1步 process
    expect(lines[2]!.classes()).not.toContain('is-finish')
    wrapper.unmount()
  })
})

describe('UiSteps 图标与序号', () => {
  it('未完成的步骤显示序号（从 1 开始）', () => {
    const wrapper = mountSteps({ active: 1 })
    const markers = wrapper.findAll('.ui-steps__marker-inner')
    expect(markers[0]!.text()).toBe('✓') // finish
    expect(markers[1]!.text()).toBe('2') // process 显示序号
    expect(markers[2]!.text()).toBe('3')
    expect(markers[3]!.text()).toBe('4')
    wrapper.unmount()
  })

  it('showCheck=false 时完成步骤也显示序号', () => {
    const wrapper = mountSteps({ active: 1, showCheck: false })
    const markers = wrapper.findAll('.ui-steps__marker-inner')
    expect(markers[0]!.text()).toBe('1')
    wrapper.unmount()
  })

  it('自定义 icon 优先于序号/对勾', () => {
    const withIcon = [
      { title: 'A', icon: '🏠' },
      { title: 'B', icon: '📄' },
      { title: 'C' },
    ]
    const wrapper = mount(UiSteps, { props: { items: withIcon, active: 1 }, attachTo: document.body })
    const markers = wrapper.findAll('.ui-steps__marker-inner')
    expect(markers[0]!.text()).toBe('🏠')
    expect(markers[1]!.text()).toBe('📄')
    expect(markers[2]!.text()).toBe('3')
    wrapper.unmount()
  })

  it('extra 文字渲染在标题旁', () => {
    const withExtra = [{ title: 'A', extra: '2 分钟' }, { title: 'B' }]
    const wrapper = mount(UiSteps, { props: { items: withExtra, active: 0 }, attachTo: document.body })
    expect(wrapper.find('.ui-steps__extra').text()).toBe('2 分钟')
    wrapper.unmount()
  })
})

describe('UiSteps 点击切换', () => {
  it('clickable=false 时点击无反应', async () => {
    const wrapper = mountSteps({ active: 0 })
    await wrapper.findAll('.ui-steps__item')[2]!.trigger('click')
    expect(wrapper.emitted('change')).toBeFalsy()
    wrapper.unmount()
  })

  it('clickable=true 点击 emit change + update:active', async () => {
    const wrapper = mountSteps({ active: 0, clickable: true })
    await wrapper.findAll('.ui-steps__item')[2]!.trigger('click')
    const ev = wrapper.emitted('change')![0]!
    expect(ev[0]).toBe(2)
    expect((ev[1] as { title: string }).title).toBe('签署合同')
    expect(wrapper.emitted('update:active')![0]![0]).toBe(2)
    wrapper.unmount()
  })

  it('点击当前步骤不 emit', async () => {
    const wrapper = mountSteps({ active: 1, clickable: true })
    await wrapper.findAll('.ui-steps__item')[1]!.trigger('click')
    expect(wrapper.emitted('change')).toBeFalsy()
    wrapper.unmount()
  })

  it('disabled 步骤不可点击', async () => {
    const withDisabled = [{ title: 'A' }, { title: 'B', disabled: true }, { title: 'C' }]
    const wrapper = mount(UiSteps, {
      props: { items: withDisabled, active: 0, clickable: true },
      attachTo: document.body,
    })
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[1]!.classes()).toContain('is-disabled')
    await lis[1]!.trigger('click')
    expect(wrapper.emitted('change')).toBeFalsy()
    wrapper.unmount()
  })

  it('非受控模式点击后内部 active 生效（状态变化）', async () => {
    const wrapper = mount(UiSteps, {
      props: { items, defaultActive: 0, clickable: true },
      attachTo: document.body,
    })
    await wrapper.findAll('.ui-steps__item')[2]!.trigger('click')
    await wrapper.vm.$nextTick()
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[2]!.classes()).toContain('is-process')
    wrapper.unmount()
  })

  it('受控模式点击后不自作主张改状态（等父级）', async () => {
    const wrapper = mountSteps({ active: 0, clickable: true })
    await wrapper.findAll('.ui-steps__item')[2]!.trigger('click')
    await wrapper.vm.$nextTick()
    const lis = wrapper.findAll('.ui-steps__item')
    // active 仍是 0 → 第 2 步不该变 process
    expect(lis[2]!.classes()).toContain('is-wait')
    wrapper.unmount()
  })
})

describe('UiSteps 无障碍与样式变量', () => {
  it('进行中的步骤带 aria-current="step"', () => {
    const wrapper = mountSteps({ active: 2 })
    const lis = wrapper.findAll('.ui-steps__item')
    expect(lis[2]!.attributes('aria-current')).toBe('step')
    expect(lis[0]!.attributes('aria-current')).toBeUndefined()
    wrapper.unmount()
  })

  it('自定义 finishColor / errorColor 落到 CSS 变量', () => {
    const wrapper = mountSteps({ active: 1, finishColor: '#10b981', errorColor: '#f43f5e' })
    const el = wrapper.element as HTMLElement
    expect(el.style.getPropertyValue('--ui-steps-finish')).toBe('#10b981')
    expect(el.style.getPropertyValue('--ui-steps-error')).toBe('#f43f5e')
    wrapper.unmount()
  })

  it('空步骤数组不报错', () => {
    const wrapper = mount(UiSteps, { props: { items: [] } })
    expect(wrapper.findAll('.ui-steps__item').length).toBe(0)
    wrapper.unmount()
  })

  it('simple 模式加对应类名', () => {
    const wrapper = mountSteps({ simple: true })
    expect(wrapper.classes()).toContain('ui-steps--simple')
    wrapper.unmount()
  })
})
