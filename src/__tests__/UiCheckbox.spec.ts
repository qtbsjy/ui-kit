// UiCheckbox / UiCheckboxGroup 单元测试
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UiCheckbox from '../components/ui/UiCheckbox.vue'
import UiCheckboxGroup from '../components/ui/UiCheckboxGroup.vue'
import { CheckboxGroupKey } from '../components/ui/checkboxContext'

describe('UiCheckbox 独立单选', () => {
  it('点击切换 checked 并更新 model', async () => {
    const wrapper = mount(UiCheckbox, { props: { label: '跑步' } })
    const input = wrapper.find('input[type="checkbox"]')
    expect(input.element.checked).toBe(false)
    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([true])
    expect(wrapper.classes()).toContain('is-checked')
    await input.setValue(false)
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([false])
  })

  it('受控 model 反映 checked 状态', () => {
    const wrapper = mount(UiCheckbox, { props: { modelValue: true, label: 'A' } })
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
    expect(wrapper.classes()).toContain('is-checked')
  })

  it('disabled 时点击不触发', async () => {
    const wrapper = mount(UiCheckbox, { props: { disabled: true, label: '停用' } })
    const input = wrapper.find('input[type="checkbox"]')
    await input.setValue(true)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    // disabled 时带 is-disabled 类，且 input 有 disabled 属性
    expect(wrapper.classes()).toContain('is-disabled')
    expect(input.attributes('disabled')).toBeDefined()
  })

  it('渲染 label 文案', () => {
    const wrapper = mount(UiCheckbox, { props: { label: '爬山' } })
    expect(wrapper.text()).toContain('爬山')
  })
})

describe('UiCheckboxGroup 组内多选', () => {
  it('数据驱动 options 渲染子项 checkbox', () => {
    const wrapper = mount(UiCheckboxGroup, {
      props: {
        modelValue: [],
        options: [
          { label: '游泳', value: 'swim' },
          { label: '跑步', value: 'run' },
          { label: '骑行', value: 'bike' },
        ],
      },
    })
    const checks = wrapper.findAll('input[type="checkbox"]')
    expect(checks).toHaveLength(3)
    expect(wrapper.text()).toContain('游泳')
  })

  it('勾选子项加入 modelValue 数组', async () => {
    const wrapper = mount(UiCheckboxGroup, {
      props: {
        modelValue: [],
        options: [
          { label: '游泳', value: 'swim' },
          { label: '跑步', value: 'run' },
        ],
      },
    })
    const checks = wrapper.findAll('input[type="checkbox"]')
    await checks[0].setValue(true)
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1][0]).toEqual(['swim'])
  })

  it('已选值反映到 checkbox checked', () => {
    const wrapper = mount(UiCheckboxGroup, {
      props: {
        modelValue: ['run'],
        options: [
          { label: '游泳', value: 'swim' },
          { label: '跑步', value: 'run' },
        ],
      },
    })
    const checks = wrapper.findAll('input[type="checkbox"]')
    expect(checks[0].element.checked).toBe(false)
    expect(checks[1].element.checked).toBe(true)
  })

  it('showCheckAll 全选/取消', async () => {
    const wrapper = mount(UiCheckboxGroup, {
      props: {
        modelValue: [],
        showCheckAll: true,
        options: [
          { label: '游泳', value: 'swim' },
          { label: '跑步', value: 'run' },
          { label: '骑行', value: 'bike' },
        ],
      },
    })
    // 全选
    await wrapper.find('.ui-checkbox-group__all-input').setValue(true)
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toEqual(['swim', 'run', 'bike'])
  })
})

describe('UiCheckbox 组上下文 inject', () => {
  it('手动 provide 组上下文时 checkbox 走组逻辑', async () => {
    const groupCtx = {
      modelValue: { value: ['a'] },
      toggleValue: (v: string) => {},
      isChecked: (v: string) => v === 'a',
      disabled: false,
    }
    const wrapper = mount(UiCheckbox, {
      props: { label: 'X', value: 'a' },
      global: {
        provide: { [CheckboxGroupKey as symbol]: groupCtx },
      },
    })
    // 组内: 命中 isChecked → checked
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)
    expect(wrapper.classes()).toContain('is-checked')
  })
})
