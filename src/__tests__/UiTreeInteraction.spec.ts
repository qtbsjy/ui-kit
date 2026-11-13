// UiTree ㊲ 交互增强测试：键盘导航 / 拖拽排序 / 点击展开 / 不可变树工具
import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UiTree from '../components/ui/UiTree.vue'
import {
  cloneTree,
  findNode,
  removeNode,
  moveNode,
  isAncestorOf,
  flattenVisible,
} from '../components/ui/treeContext'
import type { TreeNode } from '../components/ui/treeContext'

const data = (): TreeNode[] => [
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

// jsdom 没有布局：给节点伪造 rect 高度，便于测试 before/after 判定
function fakeRect(h = 32) {
  return { top: 0, bottom: h, height: h, left: 0, right: 100, width: 100, x: 0, y: 0, toJSON() {} } as DOMRect
}

describe('treeContext 不可变树工具', () => {
  it('cloneTree 深拷贝，修改副本不影响原树', () => {
    const t = data()
    const c = cloneTree(t)
    c[0]!.children!.push({ label: 'x', value: 'x' })
    expect(t[0]!.children!.length).toBe(2)
    expect(c[0]!.children!.length).toBe(3)
    expect(c[0]).not.toBe(t[0])
  })

  it('findNode 找到节点与父节点', () => {
    const t = data()
    const hit = findNode(t, 'fe')!
    expect(hit.node.label).toBe('前端组')
    expect(hit.parent?.value).toBe('dev')
    expect(findNode(t, 'hq')!.parent).toBeNull()
    expect(findNode(t, 'nope')).toBeNull()
  })

  it('removeNode 摘除节点并返回它', () => {
    const t = data()
    const removed = removeNode(t, 'mkt')!
    expect(removed.label).toBe('市场部')
    expect(t[0]!.children!.some((n) => n.value === 'mkt')).toBe(false)
    expect(removeNode(t, 'nope')).toBeNull()
  })

  it('isAncestorOf 判断祖先关系', () => {
    const t = data()
    expect(isAncestorOf(t[0]!, findNode(t, 'fe')!.node)).toBe(true)
    expect(isAncestorOf(findNode(t, 'fe')!.node, t[0]!)).toBe(false)
  })

  it('moveNode before：插到目标前一位', () => {
    const t = data()
    const next = moveNode(t, 'branch', 'hq', 'before')
    expect(next[0]!.value).toBe('branch')
    expect(next[1]!.value).toBe('hq')
    // 原树未被改动
    expect(t[0]!.value).toBe('hq')
  })

  it('moveNode after：插到目标后一位（跨层级搬运到根）', () => {
    const t = data()
    const next = moveNode(t, 'mkt', 'hq', 'after')
    const roots = next.map((n) => n.value)
    expect(roots).toContain('mkt')
    expect(next[0]!.children!.some((n) => n.value === 'mkt')).toBe(false)
  })

  it('moveNode inner：成为目标的子节点（末尾追加）', () => {
    const t = data()
    const next = moveNode(t, 'branch', 'dev', 'inner')
    const dev = findNode(next, 'dev')!.node
    expect(dev.children!.map((n) => n.value)).toEqual(['fe', 'be', 'branch'])
    expect(next.map((n) => n.value)).toEqual(['hq'])
  })

  it('moveNode 自我保护：拖到自身 / 拖进后代 → 原树不变', () => {
    const t = data()
    expect(moveNode(t, 'hq', 'hq', 'inner')).toBe(t)
    expect(moveNode(t, 'hq', 'dev', 'inner')).toBe(t)
  })

  it('flattenVisible 按展开态给出可见顺序', () => {
    const t = data()
    expect(flattenVisible(t, new Set()).map((n) => n.value)).toEqual(['hq', 'branch'])
    expect(flattenVisible(t, new Set(['hq', 'dev'])).map((n) => n.value)).toEqual([
      'hq', 'dev', 'fe', 'be', 'mkt', 'branch',
    ])
  })
})

describe('UiTree 点击展开（clickToExpand）', () => {
  it('默认点文本不展开，只选中', async () => {
    const wrapper = mount(UiTree, { props: { data: data() } })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('click')
    expect(wrapper.text()).not.toContain('研发部')
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('clickToExpand 后点文本即展开', async () => {
    const wrapper = mount(UiTree, { props: { data: data(), clickToExpand: true } })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('click')
    expect(wrapper.text()).toContain('研发部')
    expect(wrapper.emitted('node-expand')).toBeTruthy()
  })

  it('点击复选框不会连带触发展开/选中', async () => {
    const wrapper = mount(UiTree, { props: { data: data(), checkable: true, clickToExpand: true } })
    await wrapper.findAll('input[type=checkbox]')[0]!.trigger('click')
    expect(wrapper.text()).not.toContain('研发部')
    expect(wrapper.emitted('select')).toBeFalsy()
  })
})

describe('UiTree 键盘导航', () => {
  function mountNav() {
    return mount(UiTree, {
      props: { data: data(), keyboardNav: true, defaultExpandAll: true },
      attachTo: document.body,
    })
  }

  it('roving tabindex：只有一个节点 tabindex=0', () => {
    const wrapper = mountNav()
    const nodes = wrapper.findAll('.ui-tree__node')
    const zeros = nodes.filter((n) => n.attributes('tabindex') === '0')
    expect(zeros.length).toBe(1)
    expect(zeros[0]!.text()).toContain('总部')
    wrapper.unmount()
  })

  it('非 keyboardNav 模式不设置 tabindex=0', () => {
    const wrapper = mount(UiTree, { props: { data: data() } })
    expect(wrapper.findAll('.ui-tree__node[tabindex="0"]').length).toBe(0)
  })

  it('ArrowDown / ArrowUp 移动焦点', async () => {
    const wrapper = mountNav()
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('研发部')
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowUp' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('总部')
    wrapper.unmount()
  })

  it('Home / End 跳到首尾', async () => {
    const wrapper = mountNav()
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'End' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('分公司')
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'Home' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('总部')
    wrapper.unmount()
  })

  it('ArrowRight 展开折叠节点，再次右移至首个子节点', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), keyboardNav: true },
      attachTo: document.body,
    })
    expect(wrapper.text()).not.toContain('研发部')
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(wrapper.text()).toContain('研发部')
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowRight' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('研发部')
    wrapper.unmount()
  })

  it('ArrowLeft 折叠，再左移回到父节点', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), keyboardNav: true, defaultExpandedKeys: ['hq', 'dev'] },
      attachTo: document.body,
    })
    // 焦点初始在总部；下→研发部
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    // 研发部自身折叠了
    expect(wrapper.text()).not.toContain('前端组')
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'ArrowLeft' })
    await flushPromises()
    expect(document.activeElement?.textContent).toContain('总部')
    wrapper.unmount()
  })

  it('Enter 在 checkable 模式勾选，且向下级联', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), keyboardNav: true, checkable: true },
      attachTo: document.body,
    })
    await wrapper.find('.ui-tree').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const keys = wrapper.emitted('update:checkedKeys')![0]![0] as (string | number)[]
    expect(keys).toEqual(expect.arrayContaining(['hq', 'dev', 'fe', 'be', 'mkt']))
    wrapper.unmount()
  })

  it('Space 在非 checkable 模式选中节点', async () => {
    const wrapper = mountNav()
    await wrapper.find('.ui-tree').trigger('keydown', { key: ' ' })
    await flushPromises()
    expect(wrapper.emitted('select')).toBeTruthy()
    wrapper.unmount()
  })
})

describe('UiTree 拖拽', () => {
  function dragSetup() {
    const wrapper = mount(UiTree, {
      props: { data: data(), draggable: true, defaultExpandAll: true },
      attachTo: document.body,
    })
    wrapper.findAll('.ui-tree__node').forEach((n) => {
      ;(n.element as HTMLElement).getBoundingClientRect = () => fakeRect(32)
    })
    return wrapper
  }

  it('draggable 关闭时节点不可拖', () => {
    const wrapper = mount(UiTree, { props: { data: data() } })
    expect(wrapper.find('.ui-tree__node').attributes('draggable')).toBe('false')
  })

  it('开启后节点 draggable=true', () => {
    const wrapper = dragSetup()
    expect(wrapper.find('.ui-tree__node').attributes('draggable')).toBe('true')
    wrapper.unmount()
  })

  it('拖拽到目标中部 → inner，emit 新树', async () => {
    const wrapper = dragSetup()
    const nodes = wrapper.findAll('.ui-tree__node')
    // 节点顺序（全展开）：总部/研发部/前端组/后端组/市场部/分公司
    const branch = nodes[5]!
    const dev = nodes[1]!

    await branch.trigger('dragstart')
    await dev.trigger('dragover', { clientY: 16 })
    await dev.trigger('drop', { clientY: 16 })
    await flushPromises()

    const ev = wrapper.emitted('drop')![0]![0] as any
    expect(ev.dragKey).toBe('branch')
    expect(ev.dropKey).toBe('dev')
    expect(ev.position).toBe('inner')
    expect(ev.data[0].children[0].children.map((n: TreeNode) => n.value)).toEqual(['fe', 'be', 'branch'])
    wrapper.unmount()
  })

  it('拖到顶部 1/4 → before；底部 1/4 → after', async () => {
    const wrapper = dragSetup()
    const nodes = wrapper.findAll('.ui-tree__node')
    const mkt = nodes[4]!
    const fe = nodes[2]!

    await mkt.trigger('dragstart')
    await fe.trigger('dragover', { clientY: 2 })
    expect(nodes[2]!.classes()).toContain('is-drop-before')
    await fe.trigger('drop', { clientY: 2 })
    expect((wrapper.emitted('drop')![0]![0] as any).position).toBe('before')

    await mkt.trigger('dragstart')
    await fe.trigger('dragover', { clientY: 30 })
    expect(nodes[2]!.classes()).toContain('is-drop-after')
    wrapper.unmount()
  })

  it('不能拖进自己的后代（无 drop 事件）', async () => {
    const wrapper = dragSetup()
    const nodes = wrapper.findAll('.ui-tree__node')
    await nodes[0]!.trigger('dragstart') // 总部
    await nodes[1]!.trigger('dragover', { clientY: 16 }) // 研发部（总部后代）
    await nodes[1]!.trigger('drop', { clientY: 16 })
    expect(wrapper.emitted('drop')).toBeFalsy()
    wrapper.unmount()
  })

  it('allowDrop 返回 false 时阻止放置', async () => {
    const wrapper = mount(UiTree, {
      props: {
        data: data(),
        draggable: true,
        defaultExpandAll: true,
        allowDrop: () => false,
      },
      attachTo: document.body,
    })
    wrapper.findAll('.ui-tree__node').forEach((n) => {
      ;(n.element as HTMLElement).getBoundingClientRect = () => fakeRect(32)
    })
    const nodes = wrapper.findAll('.ui-tree__node')
    await nodes[4]!.trigger('dragstart')
    await nodes[1]!.trigger('dragover', { clientY: 16 })
    await nodes[1]!.trigger('drop', { clientY: 16 })
    expect(wrapper.emitted('drop')).toBeFalsy()
    wrapper.unmount()
  })

  it('disabled 节点不可拖动', async () => {
    const d = data()
    d[1]!.disabled = true
    const wrapper = mount(UiTree, { props: { data: d, draggable: true } })
    expect(wrapper.findAll('.ui-tree__node')[1]!.attributes('draggable')).toBe('false')
  })
})
