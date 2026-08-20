// UiButton 单元测试
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiButton from '../components/ui/UiButton.vue'

describe('UiButton', () => {
  it('渲染默认内容', () => {
    const wrapper = mount(UiButton, { slots: { default: '保存' } })
    expect(wrapper.text()).toContain('保存')
    expect(wrapper.classes()).toContain('ui-btn--primary')
  })

  it('应用 variant 类', () => {
    const wrapper = mount(UiButton, { props: { variant: 'danger' }, slots: { default: '删除' } })
    expect(wrapper.classes()).toContain('ui-btn--danger')
  })

  it('应用 size 类', () => {
    const wrapper = mount(UiButton, { props: { size: 'lg', variant: 'ghost' }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('ui-btn--lg')
  })

  it('禁用状态生效', () => {
    const wrapper = mount(UiButton, { props: { disabled: true }, slots: { default: 'x' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('loading 时自动禁用并显示 spinner', () => {
    const wrapper = mount(UiButton, { props: { loading: true }, slots: { default: '加载' } })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.ui-btn__spinner').exists()).toBe(true)
  })

  it('透传原生属性（title/data-*）', () => {
    const wrapper = mount(UiButton, {
      props: { variant: 'ghost' },
      attrs: { title: '提示', 'data-id': 'abc' },
      slots: { default: 'x' },
    })
    expect(wrapper.attributes('title')).toBe('提示')
    expect(wrapper.attributes('data-id')).toBe('abc')
  })

  it('点击触发原生 click', async () => {
    const wrapper = mount(UiButton, { props: { variant: 'ghost' }, slots: { default: '点' } })
    await wrapper.trigger('click')
    // 应有 click 事件冒出（$attrs 里的 onClick 或原生）
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
