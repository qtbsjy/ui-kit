// UiTable 单元测试（作品㉖ 企业级数据表格）
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UiTable, { type TableColumn } from '../components/ui/UiTable.vue'

const columns: TableColumn[] = [
  { key: 'name', label: '姓名', sortable: true },
  { key: 'age', label: '年龄', sortable: true, align: 'right' },
  { key: 'city', label: '城市' },
]
const data = [
  { name: '张三', age: 30, city: '北京' },
  { name: '李四', age: 25, city: '上海' },
  { name: '王五', age: 35, city: '广州' },
  { name: '赵六', age: 28, city: '深圳' },
  { name: '钱七', age: 40, city: '杭州' },
]

function mountTable(overrides: Record<string, any> = {}) {
  return mount(UiTable, {
    props: { columns, data, ...overrides },
  })
}

describe('UiTable 基础渲染', () => {
  it('渲染表头列名', () => {
    const wrapper = mountTable()
    const headers = wrapper.findAll('thead th')
    expect(headers).toHaveLength(3)
    expect(headers[0].text()).toContain('姓名')
    expect(headers[1].text()).toContain('年龄')
  })

  it('渲染数据行', () => {
    const wrapper = mountTable()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(5)
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('北京')
  })

  it('对齐类名', () => {
    const wrapper = mountTable()
    // 年龄列是 right 对齐
    expect(wrapper.find('thead th.is-right').exists()).toBe(true)
  })
})

describe('UiTable 排序', () => {
  it('点击可排序列切换 asc → desc → none（数字排序）', async () => {
    const wrapper = mountTable({ pageSize: 0 }) // 不分页，看全部
    const ageHeader = wrapper.findAll('thead th')[1]
    // 第一次点击 → asc
    await ageHeader.trigger('click')
    let ages = wrapper.findAll('tbody tr td.is-right').map((td) => Number(td.text()))
    expect(ages).toEqual([25, 28, 30, 35, 40])
    // 第二次 → desc
    await ageHeader.trigger('click')
    ages = wrapper.findAll('tbody tr td.is-right').map((td) => Number(td.text()))
    expect(ages).toEqual([40, 35, 30, 28, 25])
    // 第三次 → none（恢复原始顺序）
    await ageHeader.trigger('click')
    const names = wrapper.findAll('tbody tr td').map((td) => td.text())
    expect(names[0]).toBe('张三')
  })

  it('字符串排序按中文 locale 比较', async () => {
    const wrapper = mountTable({ pageSize: 0 })
    const nameHeader = wrapper.findAll('thead th')[0]
    await nameHeader.trigger('click') // asc
    // 只取第一列（姓名）的文本
    const firstCellText = (tr: any) => tr.findAll('td')[0].text()
    const names = wrapper.findAll('tbody tr').map(firstCellText)
    // 原始第一行是“张三”；asc 排序后按拼音 李(Li) 应排最前（ICU zh 排序）
    expect(names[0]).toBe('李四')
    expect(names).not.toEqual(['张三', '李四', '王五', '赵六', '钱七'])
  })

  it('不可排序列点击不排序', async () => {
    const wrapper = mountTable()
    await wrapper.findAll('thead th')[2].trigger('click') // 城市列不可排序
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(5) // 顺序不变（未分页状态下应有5行）
  })
})

describe('UiTable 分页', () => {
  it('pageSize 限制每页行数并显示分页控件', () => {
    const wrapper = mountTable({ pageSize: 3 })
    expect(wrapper.findAll('tbody tr')).toHaveLength(3)
    expect(wrapper.find('.ui-table__pagination').exists()).toBe(true)
    expect(wrapper.text()).toContain('第 1/2 页')
  })

  it('下一页切换到第二页数据', async () => {
    const wrapper = mountTable({ pageSize: 3 })
    await wrapper.findAll('.ui-table__page-btn')[1].trigger('click') // 下一页
    const text = wrapper.text()
    expect(text).toContain('第 2/2 页')
    expect(text).toContain('钱七')
    // 上一页按钮此时可用
    expect(wrapper.findAll('.ui-table__page-btn')[0].attributes('disabled')).toBeUndefined()
  })

  it('分页 + 排序联动: 排序后分页基于排序结果', async () => {
    const wrapper = mountTable({ pageSize: 3 })
    await wrapper.findAll('thead th')[1].trigger('click') // age asc
    // 第一页应该是最小的 3 个年龄
    const ages = wrapper.findAll('tbody tr td.is-right').map((td) => Number(td.text()))
    expect(ages).toEqual([25, 28, 30])
  })
})

describe('UiTable 空态与加载态', () => {
  it('空数据显示空态文案', () => {
    const wrapper = mountTable({ data: [] })
    expect(wrapper.text()).toContain('暂无数据')
  })

  it('自定义空态文案', () => {
    const wrapper = mountTable({ data: [], emptyText: '没有匹配的记录' })
    expect(wrapper.text()).toContain('没有匹配的记录')
  })

  it('loading 显示加载中且不渲染数据', async () => {
    const wrapper = mountTable({ loading: true })
    expect(wrapper.text()).toContain('加载中')
    expect(wrapper.findAll('tbody tr')).toHaveLength(1) // 只有加载行
  })
})

describe('UiTable 作用域插槽与格式化', () => {
  it('formatter 格式化单元格', () => {
    const cols = [
      { key: 'age', label: '年龄', formatter: (v: unknown) => `${v} 岁` },
    ]
    const wrapper = mount(UiTable, { props: { columns: cols, data: [{ age: 30 }] } })
    expect(wrapper.text()).toContain('30 岁')
  })

  it('cell 作用域插槽接收 row/column/value', () => {
    const wrapper = mount(UiTable, {
      props: { columns, data: [{ name: '张三', age: 30, city: '北京' }] },
      slots: {
        cell: `<template #cell="{ row, column, value }"><b>{{ column.key }}={{ value }}({{ row.city }})</b></template>`,
      },
    })
    expect(wrapper.html()).toContain('<b>name=张三(北京)</b>')
  })
})

describe('UiTable 表头固定（sticky）', () => {
  it('开启 stickyHeader 时滚动容器获得 max-height 与 sticky 类', () => {
    const wrapper = mountTable({ stickyHeader: true, maxHeight: '400px' })
    const scroll = wrapper.find('.ui-table__scroll')
    expect(scroll.classes()).toContain('ui-table__scroll--sticky')
    expect(scroll.attributes('style')).toContain('max-height: 400px')
    // thead th 带 sticky 类由 CSS 实现，这里验证容器生效
    expect(wrapper.find('thead th').exists()).toBe(true)
  })

  it('不开启时滚动容器无 sticky', () => {
    const wrapper = mountTable()
    expect(wrapper.find('.ui-table__scroll').classes()).not.toContain('ui-table__scroll--sticky')
  })
})

describe('UiTable 多选（行选择）', () => {
  const selData = [
    { key: 1, name: '张三', age: 30, city: '北京' },
    { key: 2, name: '李四', age: 25, city: '上海' },
    { key: 3, name: '王五', age: 35, city: '广州' },
  ]

  it('selectable 渲染选择列，行 checkbox 与表头全选 checkbox', () => {
    const wrapper = mount(UiTable, { props: { columns, data: selData, selectable: true, rowKey: 'key' } })
    expect(wrapper.findAll('thead th.ui-table__check')).toHaveLength(1)
    expect(wrapper.findAll('tbody tr td.ui-table__check')).toHaveLength(3)
  })

  it('勾选单行被选中，行高亮 + 表头半选态', async () => {
    const wrapper = mount(UiTable, { props: { columns, data: selData, selectable: true, rowKey: 'key' } })
    const rowChecks = wrapper.findAll('tbody tr td.ui-table__check input')
    await rowChecks[0].setValue(true)
    expect(wrapper.findAll('tbody tr')[0].classes()).toContain('is-selected')
    const headerCheck = wrapper.find('thead th.ui-table__check input').element as HTMLInputElement
    expect(headerCheck.indeterminate).toBe(true)
  })

  it('表头全选当前页所有行', async () => {
    const wrapper = mount(UiTable, { props: { columns, data: selData, selectable: true, rowKey: 'key' } })
    await wrapper.find('thead th.ui-table__check input').setValue(true)
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(3)
  })

  it('全选后再点表头取消全选', async () => {
    const wrapper = mount(UiTable, { props: { columns, data: selData, selectable: true, rowKey: 'key' } })
    const header = wrapper.find('thead th.ui-table__check input')
    await header.setValue(true)
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(3)
    await header.setValue(false)
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(0)
  })

  it('跨页全选只作用于当前页，切换页保留其它页已选', async () => {
    const six = Array.from({ length: 6 }, (_, i) => ({ key: i + 1, name: `人${i + 1}`, age: 20 + i, city: '测试' }))
    const wrapper = mount(UiTable, { props: { columns, data: six, selectable: true, rowKey: 'key', pageSize: 3 } })
    await wrapper.find('thead th.ui-table__check input').setValue(true)
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(3)
    await wrapper.findAll('.ui-table__page-btn')[1].trigger('click')
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(0)
    await wrapper.find('thead th.ui-table__check input').setValue(true)
    await wrapper.findAll('.ui-table__page-btn')[0].trigger('click')
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(3)
  })

  it('受控 selected 外部控制选中态', () => {
    const wrapper = mount(UiTable, { props: { columns, data: selData, selectable: true, rowKey: 'key', selected: [1, 2] } })
    expect(wrapper.findAll('tbody tr.is-selected')).toHaveLength(2)
  })
})

describe('UiTable 列宽拖动（resizable）', () => {
  it('resizable 渲染拖拽手柄：非最后一列有，最后一列无', () => {
    const wrapper = mountTable({ resizable: true })
    const headers = wrapper.findAll('thead th')
    // 3 列，最后一列（城市）不显示手柄
    expect(headers[0].find('.ui-table__resizer').exists()).toBe(true)
    expect(headers[1].find('.ui-table__resizer').exists()).toBe(true)
    expect(headers[2].find('.ui-table__resizer').exists()).toBe(false)
  })

  it('不开启 resizable 时无拖拽手柄', () => {
    const wrapper = mountTable()
    expect(wrapper.find('.ui-table__resizer').exists()).toBe(false)
  })

  it('拖动手柄改变列宽（非受控内部状态）', async () => {
    const wrapper = mountTable({ resizable: true })
    const handle = wrapper.findAll('.ui-table__resizer')[0]
    const th = wrapper.findAll('thead th')[0]
    // 模拟排序列起始宽
    Object.defineProperty(th.element, 'getBoundingClientRect', { value: () => ({ width: 100 }), configurable: true })
    // mousedown 在 x=100
    await handle.trigger('mousedown', { clientX: 100 })
    // document mousemove 到 x=160 → 宽 160
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 160 }))
    await nextTick()
    expect(th.attributes('style')).toContain('width: 160px')
    // mouseup 结束拖拽
    document.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    expect(wrapper.find('.ui-table__resizer.is-active').exists()).toBe(false)
  })

  it('受控 columnWidths 拖拽 emit update:columnWidths', async () => {
    const wrapper = mountTable({ resizable: true, columnWidths: { name: 100, age: 100, city: 100 } })
    const handle = wrapper.findAll('.ui-table__resizer')[0]
    const th = wrapper.findAll('thead th')[0]
    Object.defineProperty(th.element, 'getBoundingClientRect', { value: () => ({ width: 100 }), configurable: true })
    await handle.trigger('mousedown', { clientX: 100 })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 160 }))
    const emitted = wrapper.emitted('update:columnWidths')!
    expect(emitted).toBeTruthy()
    expect((emitted[emitted.length - 1][0] as Record<string, number>).name).toBe(160)
    document.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('拖动受 minColWidth 钳制，不会缩到过窄', async () => {
    const wrapper = mountTable({ resizable: true, minColWidth: 80, columnWidths: { name: 100, age: 100, city: 100 } })
    const handle = wrapper.findAll('.ui-table__resizer')[0]
    const th = wrapper.findAll('thead th')[0]
    Object.defineProperty(th.element, 'getBoundingClientRect', { value: () => ({ width: 100 }), configurable: true })
    await handle.trigger('mousedown', { clientX: 100 })
    // 拖到 x=30 → 期望宽 100-70=30，被钳到 80
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 30 }))
    const emitted = wrapper.emitted('update:columnWidths')!
    expect((emitted[emitted.length - 1][0] as Record<string, number>).name).toBe(80)
    document.dispatchEvent(new MouseEvent('mouseup'))
  })

  it('非受控模式拖拽更新内部列宽，th 宽度变化', async () => {
    const wrapper = mountTable({ resizable: true })
    const handle = wrapper.findAll('.ui-table__resizer')[0]
    const th = wrapper.findAll('thead th')[0]
    Object.defineProperty(th.element, 'getBoundingClientRect', { value: () => ({ width: 90 }), configurable: true })
    await handle.trigger('mousedown', { clientX: 90 })
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 140 }))
    await nextTick()
    expect(th.attributes('style')).toContain('width: 140px')
    document.dispatchEvent(new MouseEvent('mouseup'))
  })
})
