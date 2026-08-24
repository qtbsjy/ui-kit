// ============================================================
// UiDatePicker 单元测试（作品㉘ 日期选择器）
// ------------------------------------------------------------
// 覆盖:
//   1. 渲染 —�?输入框 + 打开弹层显示日历面板
//   2. v-model —�?点击日期 → 更新 model, 关闭弹层
//   3. 年月切换 —�?prevMonth/nextMonth 更新标题
//   4. 禁用日期 —�?min/max 边界不可选
//   5. 今天高亮 —�?is-today 样式
//   6. 输入框手动输入 —�?合法日期同步 model
//   7. 外部点击关闭 —�?v-click-outside
//   8. 快捷"今天" —�?选择当前日期
// ============================================================
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UiDatePicker from '../components/ui/UiDatePicker.vue'
import { vClickOutside } from '../directives/vClickOutside'

// mount 辅助：注册 v-click-outside 指令
function mountPicker(props: Record<string, unknown> = {}, modelValue = '') {
  return mount(UiDatePicker, {
    props: { modelValue, ...props },
    global: {
      directives: { 'click-outside': vClickOutside },
    },
  })
}

describe('UiDatePicker', () => {
  it('渲染输入框；点击图标打开日历面板', async () => {
    const w = mountPicker()
    // 初始无弹层
    expect(w.find('.ui-datepicker__panel').exists()).toBe(false)
    // 点击日历图标 → 打开
    await w.find('.ui-datepicker__icon').trigger('click')
    expect(w.find('.ui-datepicker__panel').exists()).toBe(true)
    // 面板有 42 格 + 星期表头
    expect(w.findAll('.dp-cell')).toHaveLength(42)
    expect(w.findAll('.dp-week__cell')).toHaveLength(7)
  })

  it('点击日期 → 更新 v-model 并关闭弹层', async () => {
    const w = mountPicker({}, '2026-01-01') // 初始 1 月，点 15 号会变化
    await w.find('.ui-datepicker__icon').trigger('click')
    // 视图定位到 modelValue(1月)，找到当月 15 号格点击 → 2026-01-15
    const cell = w.findAll('.dp-cell').find(
      (c) => !c.classes().includes('is-out') && c.text().trim() === '15',
    )!
    await cell.trigger('click')
    // v-model 更新
    expect(w.emitted('update:modelValue')![0]).toEqual(['2026-01-15'])
    // 弹层关闭
    expect(w.find('.ui-datepicker__panel').exists()).toBe(false)
  })

  it('选择非当前月日期也正确 emit（补位格）', async () => {
    const w = mountPicker({}, '2026-08-15')
    await w.find('.ui-datepicker__icon').trigger('click')
    // 2026-08-01 是周六；第一行可能有 7 月补位。直接找 is-out 的格子
    const outCell = w.findAll('.dp-cell').find((c) => c.classes().includes('is-out'))!
    const text = outCell.text().trim()
    await outCell.trigger('click')
    // 补位格应 emit 对应日期
    const emitted = w.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as string).endsWith(`-${text.padStart(2, '0')}`)).toBe(true)
  })

  it('年月切换：标题变化', async () => {
    const w = mountPicker({}, '2026-08-15')
    await w.find('.ui-datepicker__icon').trigger('click')
    expect(w.find('.dp-title').text()).toBe('2026年8月')
    await w.findAll('.dp-nav')[0].trigger('click') // 上个月 → 7 月
    expect(w.find('.dp-title').text()).toBe('2026年7月')
    await w.findAll('.dp-nav')[1].trigger('click') // 下个月 → 8 月
    await w.findAll('.dp-nav')[1].trigger('click') // 再下个月 → 9 月
    expect(w.find('.dp-title').text()).toBe('2026年9月')
    await w.findAll('.dp-nav')[1].trigger('click') // 10 月
    await w.findAll('.dp-nav')[1].trigger('click') // 11 月
    await w.findAll('.dp-nav')[1].trigger('click') // 12 月
    expect(w.find('.dp-title').text()).toBe('2026年12月')
    await w.findAll('.dp-nav')[1].trigger('click') // 跨年 → 2027 年 1 月
    expect(w.find('.dp-title').text()).toBe('2027年1月')
  })

  it('min/max 禁用边界日期', async () => {
    const w = mountPicker({ min: '2026-08-10', max: '2026-08-20' }, '2026-08-15')
    await w.find('.ui-datepicker__icon').trigger('click')
    const cells = w.findAll('.dp-cell')
    // 8 月 5 号应禁用
    const d5 = cells.find((c) => !c.classes().includes('is-out') && c.text().trim() === '5')!
    expect(d5.classes()).toContain('is-disabled')
    expect(d5.attributes('disabled')).toBeDefined()
    // 8 月 15 号应可用
    const d15 = cells.find((c) => !c.classes().includes('is-out') && c.text().trim() === '15')!
    expect(d15.classes()).not.toContain('is-disabled')
  })

  it('今天高亮 is-today', async () => {
    const w = mountPicker()
    await w.find('.ui-datepicker__icon').trigger('click')
    const today = new Date()
    const todayCell = w.findAll('.dp-cell').find((c) => c.text().trim() === String(today.getDate()))!
    expect(todayCell.classes()).toContain('is-today')
  })

  it('输入框手动输入合法日期 → 同步 v-model', async () => {
    const w = mountPicker()
    const input = w.find('.ui-datepicker__input')
    await input.setValue('2027-01-01')
    expect(w.emitted('update:modelValue')![0]).toEqual(['2027-01-01'])
  })

  it('外部点击关闭弹层（v-click-outside）', async () => {
    const w = mountPicker()
    await w.find('.ui-datepicker__icon').trigger('click')
    expect(w.find('.ui-datepicker__panel').exists()).toBe(true)
    // 模拟点击组件外部
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await nextTick()
    expect(w.find('.ui-datepicker__panel').exists()).toBe(false)
  })

  it('快捷"今天"：选择今天日期', async () => {
    const w = mountPicker({ showShortcuts: true })
    await w.find('.ui-datepicker__icon').trigger('click')
    const todayStr = (() => {
      const d = new Date()
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })()
    await w.find('.dp-today').trigger('click')
    expect(w.emitted('update:modelValue')![0]).toEqual([todayStr])
  })
})
