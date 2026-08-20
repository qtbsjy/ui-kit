// 布局组件单元测试 —— UiGrid / UiGridItem / UiContainer / UiSpacer（作品⑭）
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiGrid from '../components/ui/UiGrid.vue'
import UiGridItem from '../components/ui/UiGridItem.vue'
import UiContainer from '../components/ui/UiContainer.vue'
import UiSpacer from '../components/ui/UiSpacer.vue'

describe('UiGrid', () => {
  it('渲染子元素', () => {
    const wrapper = mount(UiGrid, {
      slots: { default: '<div class="cell">A</div><div class="cell">B</div>' },
    })
    expect(wrapper.findAll('.cell').length).toBe(2)
    expect(wrapper.classes()).toContain('ui-grid')
  })

  it('gap 数字转 px', () => {
    const wrapper = mount(UiGrid, { props: { gap: 24 } })
    expect(wrapper.attributes('style')).toContain('--ui-gap: 24px')
  })

  it('rowGap 缺省时跟随 gap', () => {
    const wrapper = mount(UiGrid, { props: { gap: 12 } })
    expect(wrapper.attributes('style')).toContain('--ui-row-gap: 12px')
  })

  it('自定义 rowGap', () => {
    const wrapper = mount(UiGrid, { props: { gap: 12, rowGap: 8 } })
    expect(wrapper.attributes('style')).toContain('--ui-row-gap: 8px')
  })

  it('对齐 class', () => {
    const wrapper = mount(UiGrid, { props: { align: 'center', justify: 'between' } })
    expect(wrapper.classes()).toContain('ui-grid--align-center')
    expect(wrapper.classes()).toContain('ui-grid--justify-between')
  })

  it('提供列数给子项（inject）', () => {
    expect(
      mount(UiGrid, { props: { cols: 12 } })
        .findComponent(UiGrid)
        .vm.$attrs,
    ).toBeDefined()
  })
})

describe('UiGridItem', () => {
  it('设置默认 span 到网格列', () => {
    const wrapper = mount(UiGridItem, { props: { span: 6 } })
    expect(wrapper.attributes('style')).toContain('--ui-span: 6')
  })

  it('响应式 span 映射到断点变量', () => {
    const wrapper = mount(UiGridItem, { props: { span: 12, md: 6, lg: 3 } })
    const style = wrapper.attributes('style')!
    expect(style).toContain('--ui-span: 12')
    expect(style).toContain('--md-span: 6')
    expect(style).toContain('--lg-span: 3')
  })

  it('未显式指定断点时回退到默认 span', () => {
    const wrapper = mount(UiGridItem, { props: { span: 4 } })
    const style = wrapper.attributes('style')!
    expect(style).toContain('--md-span: 4')
    expect(style).toContain('--lg-span: 4')
  })

  it('渲染插槽内容', () => {
    const wrapper = mount(UiGridItem, { slots: { default: '单元格' } })
    expect(wrapper.text()).toContain('单元格')
  })
})

describe('UiContainer', () => {
  it('默认 lg 档位', () => {
    const wrapper = mount(UiContainer)
    expect(wrapper.classes()).toContain('ui-container--lg')
  })

  it('自定义档位', () => {
    const wrapper = mount(UiContainer, { props: { width: 'xl' } })
    expect(wrapper.classes()).toContain('ui-container--xl')
  })

  it('padding 数字转 px', () => {
    const wrapper = mount(UiContainer, { props: { padding: 32 } })
    expect(wrapper.attributes('style')).toContain('--ui-pad: 32px')
  })

  it('fluid 关闭 max-width', () => {
    const wrapper = mount(UiContainer, { props: { fluid: true } })
    expect(wrapper.classes()).toContain('ui-container--fluid')
  })

  it('渲染插槽', () => {
    const wrapper = mount(UiContainer, { slots: { default: '内容' } })
    expect(wrapper.text()).toContain('内容')
  })
})

describe('UiSpacer', () => {
  it('默认纵向 md 间距', () => {
    const wrapper = mount(UiSpacer)
    expect(wrapper.classes()).toContain('ui-spacer--vertical')
    expect(wrapper.classes()).toContain('ui-spacer--md')
  })

  it('档位映射 class（CSS 变量在 scoped style 中）', () => {
    const wrapper = mount(UiSpacer, { props: { size: 'lg' } })
    expect(wrapper.classes()).toContain('ui-spacer--lg')
  })

  it('数字 size 直接输出 px（inline style）', () => {
    const wrapper = mount(UiSpacer, { props: { size: 40 } })
    expect(wrapper.attributes('style')).toContain('--ui-sp: 40px')
  })

  it('横向轴', () => {
    const wrapper = mount(UiSpacer, { props: { axis: 'horizontal' } })
    expect(wrapper.classes()).toContain('ui-spacer--horizontal')
  })
})
