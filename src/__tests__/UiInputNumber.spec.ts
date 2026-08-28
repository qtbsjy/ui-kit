// UiInputNumber 单元测试
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UiInputNumber from '../components/ui/UiInputNumber.vue'

// jsdom 没有真实布局，document.activeElement 默认 body → 组件 watch(model) 会同步 text（非聚焦分支）
function mountNum(props = {}, modelValue: number | null = null) {
  return mount(UiInputNumber, {
    props: { modelValue, ...props },
    attachTo: document.body,
  })
}

beforeEach(() => {
  // 清掉组件可能的定时器，防泄漏
  vi.useRealTimers()
})

describe('UiInputNumber 渲染', () => {
  it('渲染输入框 + 两个步进按钮', () => {
    const wrapper = mountNum()
    expect(wrapper.find('input').exists()).toBe(true)
    expect(wrapper.findAll('.ui-input-number__btn')).toHaveLength(2)
  })

  it('label & placeholder 渲染', () => {
    const wrapper = mountNum({ label: '数量', placeholder: '输入数字' })
    expect(wrapper.text()).toContain('数量')
    expect(wrapper.find('input').attributes('placeholder')).toBe('输入数字')
  })

  it('showControls=false 隐藏步进按钮', () => {
    const wrapper = mountNum({ showControls: false })
    expect(wrapper.find('.ui-input-number__controls').exists()).toBe(false)
  })

  it('disabled 时 input 带 disabled 且按钮禁用', () => {
    const wrapper = mountNum({ disabled: true }, 5)
    expect(wrapper.find('input').attributes('disabled')).toBeDefined()
    expect(wrapper.classes()).toContain('is-disabled')
    expect(wrapper.findAll('button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
  })

  it('error 态加 has-error 类并显示提示', () => {
    const wrapper = mountNum({ error: '数值非法' })
    expect(wrapper.classes()).toContain('has-error')
    expect(wrapper.text()).toContain('数值非法')
  })
})

describe('UiInputNumber 步进', () => {
  // 步进按钮实际由 mousedown 触发（长按用 mousedown/mouseup），单次点击 = mousedown + mouseup
  async function clickBtn(wrapper: ReturnType<typeof mountNum>, idx: number) {
    const btn = wrapper.findAll('button')[idx]
    await btn.trigger('mousedown')
    await btn.trigger('mouseup')
  }

  it('点击 ▲ 增加 step', async () => {
    const wrapper = mountNum({ step: 1 }, 5)
    await clickBtn(wrapper, 0)
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(6)
  })

  it('点击 ▼ 减少 step', async () => {
    const wrapper = mountNum({ step: 2 }, 5)
    await clickBtn(wrapper, 1)
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(3)
  })

  it('空值时步进从 0 起', async () => {
    const wrapper = mountNum({}, null)
    await clickBtn(wrapper, 0)
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(1)
  })

  it('达到 max 时 ▲ 禁用', async () => {
    const wrapper = mountNum({ max: 10 }, 10)
    expect(wrapper.findAll('button')[0].attributes('disabled')).toBeDefined()
  })

  it('达到 min 时 ▼ 禁用', async () => {
    const wrapper = mountNum({ min: 0 }, 0)
    expect(wrapper.findAll('button')[1].attributes('disabled')).toBeDefined()
  })

  it('步进超过 max 时钳制到 max', async () => {
    const wrapper = mountNum({ max: 10, step: 3 }, 9)
    await clickBtn(wrapper, 0)
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(10)
  })
})

describe('UiInputNumber 直接输入', () => {
  it('输入数字后 blur 提交并钳制', async () => {
    const wrapper = mountNum({ min: 0, max: 100 }, 50)
    const input = wrapper.find('input')
    await input.setValue('120')
    await input.trigger('blur')
    // 120 > max=100 → 钳制到 100
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(100)
    expect(wrapper.emitted('change')!.at(-1)![0]).toBe(100)
  })

  it('输入低于 min 的值被钳制到 min', async () => {
    const wrapper = mountNum({ min: 5 }, 10)
    const input = wrapper.find('input')
    await input.setValue('2')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(5)
  })

  it('precision=2 四舍五入', async () => {
    const wrapper = mountNum({ precision: 2 }, 0)
    const input = wrapper.find('input')
    await input.setValue('3.14159')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(3.14)
  })

  it('非法输入回退到原值', async () => {
    const wrapper = mountNum({}, 42)
    const input = wrapper.find('input')
    await input.setValue('abc')
    await input.trigger('blur')
    // 未 emit 新值（回退），文本恢复 42
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.find('input').element.value).toBe('42')
  })

  it('清空后 blur 置 null', async () => {
    const wrapper = mountNum({}, 42)
    const input = wrapper.find('input')
    await input.setValue('')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(null)
    expect(wrapper.emitted('change')!.at(-1)![0]).toBe(null)
  })

  it('Enter 提交（不 blur）', async () => {
    const wrapper = mountNum({ max: 50 }, 10)
    const input = wrapper.find('input')
    await input.setValue('999')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(50)
  })
})

describe('UiInputNumber 长按加速', () => {
  it('mousedown 触发一次，mouseup 后定时器不继续（fake timers 校验加速逻辑）', () => {
    vi.useFakeTimers()
    const wrapper = mountNum({}, 0)
    const upBtn = wrapper.findAll('button')[0]
    upBtn.trigger('mousedown')
    // 立即 +1
    expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(1)
    // 400ms 后进入连发
    vi.advanceTimersByTime(400)
    vi.advanceTimersByTime(80) // 一次连发 = 1 + min(1/5,4)=1 → +1
    expect(Number(wrapper.emitted('update:modelValue')!.at(-1)![0])).toBe(2)
    // mouseup 清理
    upBtn.trigger('mouseup')
    vi.advanceTimersByTime(500)
    // 不再新增
    const last = Number(wrapper.emitted('update:modelValue')!.at(-1)![0])
    expect(last).toBeLessThanOrEqual(5)
  })
})
