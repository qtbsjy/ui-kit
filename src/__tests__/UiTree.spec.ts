// UiTree 树形组件单元测试
import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UiTree from '../components/ui/UiTree.vue'
import type { TreeNode } from '../components/ui/treeContext'

const treeData: TreeNode[] = [
  {
    label: '总部',
    value: 'hq',
    children: [
      { label: '研发部', value: 'dev', children: [{ label: '前端组', value: 'fe' }, { label: '后端组', value: 'be' }] },
      { label: '市场部', value: 'mkt' },
    ],
  },
  { label: '分公司', value: 'branch' },
]

describe('UiTree 渲染', () => {
  it('渲染根节点', () => {
    const wrapper = mount(UiTree, { props: { data: treeData } })
    const labels = wrapper.findAll('.ui-tree__label').map((n) => n.text())
    expect(labels).toContain('总部')
    expect(labels).toContain('分公司')
  })

  it('默认只渲染根节点（子节点折叠）', () => {
    const wrapper = mount(UiTree, { props: { data: treeData } })
    const labels = wrapper.findAll('.ui-tree__label').map((n) => n.text())
    expect(labels).toEqual(['总部', '分公司'])
  })

  it('defaultExpandAll 展开全部', () => {
    const wrapper = mount(UiTree, { props: { data: treeData, defaultExpandAll: true } })
    const labels = wrapper.findAll('.ui-tree__label').map((n) => n.text())
    expect(labels).toContain('研发部')
    expect(labels).toContain('前端组')
    expect(labels).toContain('市场部')
  })

  it('空数据显示暂无数据', () => {
    const wrapper = mount(UiTree, { props: { data: [] } })
    expect(wrapper.text()).toContain('暂无数据')
  })

  it('初始展开节点根据 expanded 字段', () => {
    const d: TreeNode[] = [{ label: 'A', value: 'a', expanded: true, children: [{ label: 'A1', value: 'a1' }] }]
    const wrapper = mount(UiTree, { props: { data: d } })
    expect(wrapper.text()).toContain('A1')
  })
})

describe('UiTree 展开/折叠', () => {
  it('点击箭头展开子节点', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData } })
    expect(wrapper.text()).not.toContain('研发部')
    await wrapper.findAll('.ui-tree__arrow')[0].trigger('click')
    expect(wrapper.text()).toContain('研发部')
    expect(wrapper.emitted('node-expand')).toBeTruthy()
  })

  it('再次点击折叠', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData } })
    await wrapper.findAll('.ui-tree__arrow')[0].trigger('click')
    expect(wrapper.text()).toContain('研发部')
    await wrapper.findAll('.ui-tree__arrow')[0].trigger('click')
    expect(wrapper.text()).not.toContain('研发部')
    expect(wrapper.emitted('node-collapse')).toBeTruthy()
  })

  it('受控模式 expandedKeys 驱动且 emit update', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, expandedKeys: [] } })
    expect(wrapper.text()).not.toContain('研发部')
    await wrapper.findAll('.ui-tree__arrow')[0].trigger('click')
    expect(wrapper.emitted('update:expandedKeys')).toBeTruthy()
    // 受控下内部不展开，仍需外部更新 props
    expect(wrapper.text()).not.toContain('研发部')
    await wrapper.setProps({ expandedKeys: ['hq'] })
    expect(wrapper.text()).toContain('研发部')
  })

  it('defaultExpandedKeys 初始展开', () => {
    const wrapper = mount(UiTree, { props: { data: treeData, defaultExpandedKeys: ['hq'] } })
    expect(wrapper.text()).toContain('研发部')
  })
})

describe('UiTree 父子选中联动', () => {
  it('checkable 显示复选框', () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true } })
    expect(wrapper.findAll('input[type=checkbox]').length).toBeGreaterThan(0)
  })

  it('勾选父节点 → 全部后代选中', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true, defaultExpandAll: true } })
    const checkboxes = wrapper.findAll('input[type=checkbox]')
    await checkboxes[0].setValue(true) // 勾选 总部
    const checked = wrapper.findAll('input[type=checkbox]').filter((c) => (c.element as HTMLInputElement).checked)
    // 总部 + 研发部 + 前端 + 后端 + 市场
    expect(checked.length).toBe(5)
    const emitted = wrapper.emitted('update:checkedKeys')!.at(-1)![0] as (string | number)[]
    expect(emitted).toEqual(expect.arrayContaining(['hq', 'dev', 'fe', 'be', 'mkt']))
  })

  it('部分勾选子节点 → 父节点半选态', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true, defaultExpandAll: true } })
    const checkboxes = wrapper.findAll('input[type=checkbox]')
    await checkboxes[2].setValue(true) // 勾选 前端组 (index: hq, dev, fe, be, mkt)
    const devCheckbox = wrapper.findAll('input[type=checkbox]')[1].element as HTMLInputElement
    expect(devCheckbox.indeterminate).toBe(true)
    const hqCheckbox = wrapper.findAll('input[type=checkbox]')[0].element as HTMLInputElement
    expect(hqCheckbox.indeterminate).toBe(true)
  })

  it('勾选全部子节点 → 父自动选中', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true, defaultExpandAll: true } })
    const checkboxes = wrapper.findAll('input[type=checkbox]')
    await checkboxes[2].setValue(true) // fe
    await checkboxes[3].setValue(true) // be
    const devCheckbox = wrapper.findAll('input[type=checkbox]')[1].element as HTMLInputElement
    expect(devCheckbox.checked).toBe(true)
    expect(devCheckbox.indeterminate).toBe(false)
  })

  it('取消父节点勾选 → 后代全部取消', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true, defaultExpandAll: true } })
    await wrapper.findAll('input[type=checkbox]')[0].setValue(true)
    await wrapper.findAll('input[type=checkbox]')[0].setValue(false)
    const checked = wrapper.findAll('input[type=checkbox]').filter((c) => (c.element as HTMLInputElement).checked)
    expect(checked.length).toBe(0)
  })

  it('checkStrictly 严格模式父不影响子', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true, defaultExpandAll: true, checkStrictly: true } })
    await wrapper.findAll('input[type=checkbox]')[0].setValue(true) // 只勾 总部
    const checked = wrapper.findAll('input[type=checkbox]').filter((c) => (c.element as HTMLInputElement).checked)
    expect(checked.length).toBe(1)
  })

  it('emit check 事件携带 keys 与节点', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, checkable: true } })
    await wrapper.find('input[type=checkbox]').setValue(true)
    const check = wrapper.emitted('check')!.at(-1)!
    expect(check[1]).toMatchObject({ value: 'hq' })
  })
})

describe('UiTree 单选选中', () => {
  it('点击节点触发 select 且高亮', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData } })
    await wrapper.findAll('.ui-tree__label')[0].trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('node-click')).toBeTruthy()
    const sel = wrapper.find('.ui-tree__node.is-selected')
    expect(sel.text()).toContain('总部')
  })

  it('selectable=false 点击不高亮不 emit select', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, selectable: false } })
    await wrapper.findAll('.ui-tree__label')[0].trigger('click')
    expect(wrapper.emitted('select')).toBeFalsy()
    expect(wrapper.find('.ui-tree__node.is-selected').exists()).toBe(false)
  })

  it('点击另一个节点切换选中', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData } })
    await wrapper.findAll('.ui-tree__label')[0].trigger('click')
    await wrapper.findAll('.ui-tree__label')[1].trigger('click')
    const sel = wrapper.find('.ui-tree__node.is-selected')
    expect(sel.text()).toContain('分公司')
  })
})

describe('UiTree 懒加载', () => {
  it('展开时调用 load 加载子节点', async () => {
    const load = vi.fn().mockResolvedValue([{ label: '动态子', value: 'dyn' }])
    const d: TreeNode[] = [{ label: '根', value: 'root' }]
    const wrapper = mount(UiTree, { props: { data: d, load } })
    const arrow = wrapper.find('.ui-tree__arrow')
    expect(arrow.exists()).toBe(true)
    await arrow.trigger('click')
    await flushPromises() // 等 async load
    expect(load).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('动态子')
  })

  it('isLeaf 节点即使有 load 也不展开', async () => {
    const load = vi.fn()
    const d: TreeNode[] = [{ label: '叶', value: 'leaf', isLeaf: true }]
    const wrapper = mount(UiTree, { props: { data: d, load } })
    const arrow = wrapper.find('.ui-tree__arrow')
    expect(arrow.classes()).toContain('is-leaf')
  })
})

describe('UiTree 过滤', () => {
  it('filterText 命中节点及其祖先保留，无关节点隐藏', async () => {
    const wrapper = mount(UiTree, { props: { data: treeData, filterText: '前端' } })
    expect(wrapper.text()).toContain('前端组')
    expect(wrapper.text()).toContain('研发部') // 祖先
    expect(wrapper.text()).toContain('总部') // 祖先
    expect(wrapper.text()).not.toContain('市场部')
    expect(wrapper.text()).not.toContain('分公司')
  })

  it('过滤命中节点高亮 is-matched', () => {
    const wrapper = mount(UiTree, { props: { data: treeData, filterText: '前端' } })
    const matched = wrapper.find('.ui-tree__label.is-matched')
    expect(matched.text()).toContain('前端组')
  })
})
