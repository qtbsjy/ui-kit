// UiSlider 单元测试
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiSlider from '../components/ui/UiSlider.vue'

describe('UiSlider 单值模式', () => {
  it('渲染原生 range 并绑定 min/max/step', () => {
    const wrapper = mount(UiSlider, { props: { min: 0, max: 50, step: 5 } })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('50')
    expect(input.attributes('step')).toBe('5')
  })

  it('input 事件触发 update:modelValue', async () => {
    const wrapper = mount(UiSlider, { props: { modelValue: 20 } })
    const input = wrapper.find('input[type="range"]')
    await input.setValue('40')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([40])
  })

  it('受控 model 反映 value', () => {
    const wrapper = mount(UiSlider, { props: { modelValue: 60 } })
    expect(wrapper.find('input[type="range"]').element.value).toBe('60')
  })

  it('showValue 显示当前值', () => {
    const wrapper = mount(UiSlider, { props: { modelValue: 33, showValue: true } })
    expect(wrapper.text()).toContain('33')
  })

  it('label 渲染', () => {
    const wrapper = mount(UiSlider, { props: { label: '音量' } })
    expect(wrapper.text()).toContain('音量')
  })

  it('disabled 时 input 带 disabled 属性', () => {
    const wrapper = mount(UiSlider, { props: { disabled: true } })
    expect(wrapper.find('input[type="range"]').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('is-disabled')
  })
})

describe('UiSlider 双端 range 模式', () => {
  function mountRange(model: [number, number] = [20, 80]) {
    return mount(UiSlider, {
      props: {
        range: true,
        min: 0,
        max: 100,
        modelValue: model,
      },
    })
  }

  it('渲染两个原生 range', () => {
    const wrapper = mountRange()
    expect(wrapper.findAll('input[type="range"]')).toHaveLength(2)
  })

  it('lower/upper 对应 model 双端值', () => {
    const wrapper = mountRange([10, 90])
    const inputs = wrapper.findAll('input[type="range"]')
    expect(inputs[0].element.value).toBe('10') // lower
    expect(inputs[1].element.value).toBe('90') // upper
  })

  it('lower 的 max 被钳制为 upper（防交叉）', () => {
    const wrapper = mountRange([20, 80])
    const inputs = wrapper.findAll('input[type="range"]')
    expect(inputs[0].attributes('max')).toBe('80')
  })

  it('upper 的 min 被钳制为 lower（防交叉）', () => {
    const wrapper = mountRange([20, 80])
    const inputs = wrapper.findAll('input[type="range"]')
    expect(inputs[1].attributes('min')).toBe('20')
  })

  it('拖动 lower 更新 model 数组低端', async () => {
    const wrapper = mountRange([20, 80])
    const inputs = wrapper.findAll('input[type="range"]')
    await inputs[0].setValue('30')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([30, 80])
  })

  it('拖动 upper 更新 model 数组高端', async () => {
    const wrapper = mountRange([20, 80])
    const inputs = wrapper.findAll('input[type="range"]')
    await inputs[1].setValue('70')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([20, 70])
  })

  it('lower 超过 upper 时被钳制到 upper - step', async () => {
    const wrapper = mountRange([20, 50])
    const inputs = wrapper.findAll('input[type="range"]')
    // lower 拖到 90，但 upper=50 → 钳制为 50-1=49
    await inputs[0].setValue('90')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([49, 50])
  })

  it('upper 低于 lower 时被钳制到 lower + step', async () => {
    const wrapper = mountRange([50, 80])
    const inputs = wrapper.findAll('input[type="range"]')
    // upper 拖到 5，但 lower=50 → 钳制为 50+1=51
    await inputs[1].setValue('5')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual([50, 51])
  })

  it('showValue 显示 low - high', async () => {
    const wrapper = mountRange([25, 75])
    await wrapper.setProps({ showValue: true })
    expect(wrapper.text()).toContain('25 - 75')
  })
})
