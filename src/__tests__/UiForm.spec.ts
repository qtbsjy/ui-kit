// 表单组件单元测试 —— 重点验证 v-model 双向绑定
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiInput from '../components/ui/UiInput.vue'
import UiSwitch from '../components/ui/UiSwitch.vue'
import UiSelect from '../components/ui/UiSelect.vue'

describe('UiInput', () => {
  it('渲染 label + 输入值', () => {
    const wrapper = mount(UiInput, {
      props: { label: '标题', modelValue: '你好' },
    })
    expect(wrapper.text()).toContain('标题')
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('你好')
  })

  it('输入时 emit update:modelValue（v-model 双向）', async () => {
    const wrapper = mount(UiInput, { props: { modelValue: '' } })
    await wrapper.find('input').setValue('新值')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['新值'])
  })

  it('显示错误信息 + 错误类', () => {
    const wrapper = mount(UiInput, { props: { error: '必填' } })
    expect(wrapper.text()).toContain('必填')
    expect(wrapper.classes()).toContain('has-error')
  })

  it('透传原生属性 placeholder/type', () => {
    const wrapper = mount(UiInput, {
      props: { placeholder: '请输入', type: 'password' },
    })
    expect(wrapper.find('input').attributes('placeholder')).toBe('请输入')
    expect(wrapper.find('input').attributes('type')).toBe('password')
  })

  it('disabled 生效', () => {
    const wrapper = mount(UiInput, { props: { disabled: true } })
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
  })
})

describe('UiSwitch', () => {
  it('默认关闭（aria-checked false）', () => {
    const wrapper = mount(UiSwitch, { props: { modelValue: false } })
    expect(wrapper.find('button').attributes('aria-checked')).toBe('false')
  })

  it('点击切换并 emit', async () => {
    const wrapper = mount(UiSwitch, { props: { modelValue: false } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
  })

  it('disabled 时点击不切换', async () => {
    const wrapper = mount(UiSwitch, { props: { modelValue: false, disabled: true } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('显示 active/inactive 文本', () => {
    const on = mount(UiSwitch, { props: { modelValue: true, activeText: '开', inactiveText: '关' } })
    expect(on.text()).toContain('开')
    const off = mount(UiSwitch, { props: { modelValue: false, activeText: '开', inactiveText: '关' } })
    expect(off.text()).toContain('关')
  })
})

describe('UiSelect', () => {
  const options = [
    { label: '低', value: 'low' },
    { label: '高', value: 'high' },
  ]

  it('渲染 options', () => {
    const wrapper = mount(UiSelect, { props: { options } })
    const selects = wrapper.findAll('option')
    // 占位 + 2 个选项
    expect(selects.length).toBe(3)
    expect(wrapper.text()).toContain('低')
  })

  it('选择时 emit 对应值', async () => {
    const wrapper = mount(UiSelect, { props: { options, modelValue: '' } })
    await wrapper.find('select').setValue('high')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['high'])
  })

  it('显示 label 和错误', () => {
    const wrapper = mount(UiSelect, { props: { options, label: '优先级', error: '必选' } })
    expect(wrapper.text()).toContain('优先级')
    expect(wrapper.text()).toContain('必选')
  })
})
