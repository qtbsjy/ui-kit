// UiBadge / UiProgress 单元测试
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiBadge from '../components/ui/UiBadge.vue'
import UiProgress from '../components/ui/UiProgress.vue'

describe('UiBadge', () => {
  it('渲染插槽文字', () => {
    const wrapper = mount(UiBadge, { props: { color: 'green' }, slots: { default: '已完成' } })
    expect(wrapper.text()).toContain('已完成')
  })

  it('dot 模式不渲染文字, 只渲染圆点', () => {
    const wrapper = mount(UiBadge, { props: { color: 'red', dot: true }, slots: { default: 'x' } })
    expect(wrapper.find('.ui-badge__dot').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('x')
  })

  it('不同 color 应用不同内联色', () => {
    const blue = mount(UiBadge, { props: { color: 'blue' }, slots: { default: 'b' } })
    expect(blue.attributes('style')).toContain('rgb(79, 140, 255)')
  })
})

describe('UiProgress', () => {
  it('根据 value 设置条宽', () => {
    const wrapper = mount(UiProgress, { props: { value: 40 } })
    const bar = wrapper.find('.ui-progress__bar')
    expect(bar.attributes('style')).toContain('width: 40%')
  })

  it('钳制超过 100 的值', () => {
    const wrapper = mount(UiProgress, { props: { value: 150 } })
    expect(wrapper.find('.ui-progress__bar').attributes('style')).toContain('width: 100%')
  })

  it('钳制负数', () => {
    const wrapper = mount(UiProgress, { props: { value: -10 } })
    expect(wrapper.find('.ui-progress__bar').attributes('style')).toContain('width: 0%')
  })

  it('showText 显示百分比', () => {
    const wrapper = mount(UiProgress, { props: { value: 67, showText: true } })
    expect(wrapper.text()).toContain('67%')
  })
})
