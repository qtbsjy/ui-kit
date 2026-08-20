// 组件文档站数据完整性测试（作品⑱）
// 验证 docsData 数据：每个组件都有完整字段、API 分组正确、组件 id 可解析。
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { docs, getDoc, groupApi, categories } from '../docs/docsData'
import ApiTable from '../components/doc/ApiTable.vue'

describe('docsData 数据完整性', () => {
  it('包含所有组件的文档条目', () => {
    // 期望至少覆盖 UiButton/UiModal/UiVirtualList 等核心组件
    const ids = docs.map((d) => d.id)
    expect(ids).toContain('button')
    expect(ids).toContain('modal')
    expect(ids).toContain('virtual')
    expect(ids).toContain('input')
    expect(ids).toContain('grid')
  })

  it('每条记录都有必需字段', () => {
    for (const d of docs) {
      expect(typeof d.name).toBe('string')
      expect(d.name.startsWith('Ui')).toBe(true)
      expect(typeof d.tagline).toBe('string')
      expect(d.tagline.length).toBeGreaterThan(0)
      expect(Array.isArray(d.desc)).toBe(true)
      expect(d.desc.length).toBeGreaterThan(0)
      expect(Array.isArray(d.api)).toBe(true)
      expect(d.api.length).toBeGreaterThan(0)
      expect(Array.isArray(d.examples)).toBe(true)
      // 分类必须是合法值
      expect(categories).toContain(d.category)
    }
  })

  it('每个组件至少有 props 和 slots 里的某一种 API', () => {
    const g = (d: (typeof docs)[number]) => groupApi(d.api)
    for (const d of docs) {
      const { props } = g(d)
      // 所有组件都应有 props（基础）
      expect(props.length).toBeGreaterThan(0)
    }
  })

  it('API 行类型正确（name/type/default/desc 齐全）', () => {
    for (const d of docs) {
      for (const row of d.api) {
        expect(['prop', 'slot', 'event']).toContain(row.kind)
        expect(typeof row.name).toBe('string')
        expect(typeof row.type).toBe('string')
        expect(typeof row.desc).toBe('string')
      }
    }
  })

  it('getDoc 能按 id 取到条目', () => {
    expect(getDoc('button')?.name).toBe('UiButton')
    expect(getDoc('nonexistent')).toBeUndefined()
  })

  it('示例代码都是非空字符串', () => {
    for (const d of docs) {
      for (const ex of d.examples) {
        expect(ex.title.length).toBeGreaterThan(0)
        expect(ex.code.length).toBeGreaterThan(10)
      }
    }
  })
})

describe('ApiTable 组件渲染', () => {
  const doc = getDoc('button')!

  it('渲染 Props 表格', () => {
    const wrapper = mount(ApiTable, { props: { doc }, global: { stubs: { transition: false } } })
    const text = wrapper.text()
    expect(text).toContain('Props')
    expect(text).toContain('variant')
    expect(text).toContain('primary')
  })

  it('渲染 Slots / Events 分组标题', () => {
    const wrapper = mount(ApiTable, { props: { doc }, global: { stubs: { transition: false } } })
    const text = wrapper.text()
    expect(text).toContain('Slots')
    expect(text).toContain('Events')
  })

  it('表格行数与 API 条目一致', () => {
    const wrapper = mount(ApiTable, { props: { doc }, global: { stubs: { transition: false } } })
    // 每个 api 行渲染一条 tbody tr
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(doc.api.length)
  })
})
