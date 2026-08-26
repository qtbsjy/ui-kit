// UiRadio / UiRadioGroup 单元测试
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiRadio from '../components/ui/UiRadio.vue'
import UiRadioGroup from '../components/ui/UiRadioGroup.vue'
import { RadioGroupKey } from '../components/ui/radioContext'

describe('UiRadio 独立单选', () => {
  it('选中时 checked 匹配 value', () => {
    const wrapper = mount(UiRadio, { props: { label: '男', value: 'male', modelValue: 'male' } })
    expect(wrapper.find('input[type="radio"]').element.checked).toBe(true)
    expect(wrapper.classes()).toContain('is-checked')
  })

  it('点击选中更新 model', async () => {
    const wrapper = mount(UiRadio, { props: { label: '女', value: 'female', modelValue: '' } })
    const input = wrapper.find('input[type="radio"]')
    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['female'])
  })

  it('disabled 点击不触发', async () => {
    const wrapper = mount(UiRadio, { props: { label: 'X', value: 1, disabled: true, modelValue: '' } })
    const input = wrapper.find('input[type="radio"]')
    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('渲染 label', () => {
    const wrapper = mount(UiRadio, { props: { label: '其它', value: 'other', modelValue: '' } })
    expect(wrapper.text()).toContain('其它')
  })
})

describe('UiRadioGroup 组内单选互斥', () => {
  const opts = [
    { label: '苹果', value: 'apple' },
    { label: '香蕉', value: 'banana' },
    { label: '橙子', value: 'orange' },
  ]

  function mountGroup(modelValue: string | number | boolean = '') {
    return mount(UiRadioGroup, {
      props: {
        modelValue,
        options: opts,
        'onUpdate:modelValue': (v: string) => {
          mountGroup.last = v
        },
      },
    })
  }

  it('options 渲染 3 个 radio', () => {
    const wrapper = mountGroup('apple')
    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3)
  })

  it('选中项 checked 匹配 modelValue', () => {
    const wrapper = mountGroup('banana')
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios[0].element.checked).toBe(false)
    expect(radios[1].element.checked).toBe(true)
  })

  it('点击一项更新为该项值（组内互斥）', async () => {
    const wrapper = mountGroup('apple')
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[2].setValue(true) // 橙子
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1][0]).toBe('orange')
    // 原生 radio 同 name 互斥由浏览器保证，组件层只需更新 model
    expect(radios[2].element.checked).toBe(true)
  })

  it('同 name 分组保证方向键互斥', () => {
    const wrapper = mountGroup('apple')
    const names = wrapper.findAll('input[type="radio"]').map((r) => r.attributes('name'))
    expect(new Set(names).size).toBe(1) // 组内同 name
  })
})

describe('UiRadioGroup 选项类型', () => {
  it('支持数字 value', () => {
    const wrapper = mount(UiRadioGroup, {
      props: {
        modelValue: 2,
        options: [
          { label: '一', value: 1 },
          { label: '二', value: 2 },
        ],
      },
    })
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios[1].element.checked).toBe(true)
  })
})
