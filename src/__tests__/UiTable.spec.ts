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
