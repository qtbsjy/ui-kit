// UiTree ㊳ 节点编辑测试：重命名 / 新增子节点 / 新增根节点 / 删除 / 右键菜单
import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UiTree from '../components/ui/UiTree.vue'
import { insertNode, makeTempKey, renameNode, buildNodeMap } from '../components/ui/treeContext'
import type { TreeNode } from '../components/ui/treeContext'

const data = (): TreeNode[] => [
  {
    label: '总部',
    value: 'hq',
    children: [
      { label: '研发部', value: 'dev', children: [{ label: '前端组', value: 'fe' }] },
      { label: '市场部', value: 'mkt' },
    ],
  },
  { label: '分公司', value: 'branch' },
]

describe('treeContext 编辑工具', () => {
  it('renameNode 改名且不改动原树', () => {
    const t = data()
    const next = renameNode(t, 'mkt', '市场中心')
    expect(next[0]!.children![1]!.label).toBe('市场中心')
    expect(t[0]!.children![1]!.label).toBe('市场部')
  })

  it('renameNode 找不到 key 时返回原树引用', () => {
    const t = data()
    expect(renameNode(t, 'nope', 'x')).toBe(t)
  })

  it('insertNode 指定父节点追加子节点', () => {
    const t = data()
    const next = insertNode(t, 'hq', { label: '法务部', value: 'law' })
    expect(next[0]!.children!.map((n) => n.value)).toEqual(['dev', 'mkt', 'law'])
    // 原树不受影响
    expect(t[0]!.children!.map((n) => n.value)).toEqual(['dev', 'mkt'])
  })

  it('insertNode parentKey=null 插入根级（可指定位置）', () => {
    const t = data()
    const next = insertNode(t, null, { label: '新根', value: 'r' }, 0)
    expect(next[0]!.value).toBe('r')
    expect(next.length).toBe(3)
  })

  it('insertNode 父节点不存在时返回原树', () => {
    const t = data()
    expect(insertNode(t, 'ghost', { label: 'x', value: 'x' })).toBe(t)
  })

  it('makeTempKey 避开已存在 key', () => {
    const map = buildNodeMap(data())
    const k = makeTempKey(map)
    expect(k.startsWith('__new_')).toBe(true)
    expect(map.has(k)).toBe(false)
    map.set(k, { label: 't', value: k })
    expect(makeTempKey(map)).not.toBe(k)
  })
})

describe('UiTree 内联编辑', () => {
  it('默认 editable=false：双击不出输入框', async () => {
    const wrapper = mount(UiTree, { props: { data: data() } })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('dblclick')
    expect(wrapper.find('.ui-tree__edit-input').exists()).toBe(false)
    wrapper.unmount()
  })

  it('editable：双击进入编辑并带入原文本', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true },
      attachTo: document.body,
    })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('dblclick')
    await flushPromises()
    const input = wrapper.find('.ui-tree__edit-input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('总部')
    wrapper.unmount()
  })

  it('Enter 提交重命名 + emit rename / update:data', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true },
      attachTo: document.body,
    })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('dblclick')
    await flushPromises()
    const input = wrapper.find('.ui-tree__edit-input')
    await input.setValue('集团总部')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(wrapper.text()).toContain('集团总部')
    const renamed = wrapper.emitted('rename')![0]!
    expect((renamed[0] as TreeNode).value).toBe('hq')
    expect(renamed[1]).toBe('集团总部')
    expect(wrapper.emitted('update:data')).toBeTruthy()
    wrapper.unmount()
  })

  it('Esc 取消重命名，文本保持不变', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true },
      attachTo: document.body,
    })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('dblclick')
    await flushPromises()
    const input = wrapper.find('.ui-tree__edit-input')
    await input.setValue('乱写的名字')
    await input.trigger('keydown', { key: 'Escape' })
    await flushPromises()
    expect(wrapper.find('.ui-tree__edit-input').exists()).toBe(false)
    expect(wrapper.text()).toContain('总部')
    expect(wrapper.text()).not.toContain('乱写的名字')
    expect(wrapper.emitted('rename')).toBeFalsy()
    wrapper.unmount()
  })

  it('空白名提交：新建节点被丢弃且不 emit add', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true },
      attachTo: document.body,
    })
    // 通过右键 + 新增子节点走完整流程
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    const items = Array.from(document.querySelectorAll('.ui-tree__menu-item')) as HTMLElement[]
    items[0]!.click()
    await flushPromises()
    expect(wrapper.findAll('.ui-tree__edit-input').length).toBe(1)
    const input = wrapper.find('.ui-tree__edit-input')
    await input.setValue('   ')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(wrapper.emitted('add')).toBeFalsy()
    wrapper.unmount()
  })

  it('maxLabelLength 截断超长名称', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, maxLabelLength: 5 },
      attachTo: document.body,
    })
    await wrapper.findAll('.ui-tree__label')[0]!.trigger('dblclick')
    await flushPromises()
    const input = wrapper.find('.ui-tree__edit-input')
    await input.setValue('一二三四五六七八九十')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect((wrapper.emitted('rename')![0]![1] as string).length).toBe(5)
    wrapper.unmount()
  })

  it('disabled 节点不可双击编辑', async () => {
    const d = data()
    d[1]!.disabled = true
    const wrapper = mount(UiTree, {
      props: { data: d, editable: true },
      attachTo: document.body,
    })
    await wrapper.findAll('.ui-tree__label')[1]!.trigger('dblclick')
    await flushPromises()
    expect(wrapper.find('.ui-tree__edit-input').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('UiTree 右键菜单', () => {
  function mountMenu(extra: Record<string, unknown> = {}) {
    return mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true, ...extra },
      attachTo: document.body,
    })
  }

  it('contextMenu 关闭时不弹菜单', async () => {
    const wrapper = mount(UiTree, { props: { data: data(), editable: true }, attachTo: document.body })
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    expect(document.querySelector('.ui-tree__menu')).toBeNull()
    wrapper.unmount()
  })

  it('右键节点弹出菜单（Teleport 到 body）并定位', async () => {
    const wrapper = mountMenu()
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 120, clientY: 80 })
    await flushPromises()
    const menu = document.querySelector('.ui-tree__menu') as HTMLElement
    expect(menu).toBeTruthy()
    expect(menu.style.left).toBe('120px')
    expect(menu.style.top).toBe('80px')
    expect(menu.textContent).toContain('重命名')
    expect(menu.textContent).toContain('删除')
    wrapper.unmount()
  })

  it('点击菜单项后关闭菜单并 emit menu-action', async () => {
    const wrapper = mountMenu()
    const target = wrapper.findAll('.ui-tree__node')[1]! // 研发部
    await target.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    const items = Array.from(document.querySelectorAll('.ui-tree__menu-item')) as HTMLElement[]
    items[1]!.click() // 重命名
    await flushPromises()
    expect(wrapper.emitted('menu-action')).toBeTruthy()
    const [action] = wrapper.emitted('menu-action')![0]!
    expect((action as { key: string }).key).toBe('rename')
    expect(document.querySelector('.ui-tree__menu')).toBeNull()
    // 进入编辑
    expect(wrapper.find('.ui-tree__edit-input').exists()).toBe(true)
    wrapper.unmount()
  })

  it('自定义 menuActions 只 emit 不执行内置行为', async () => {
    const onAction = vi.fn()
    const wrapper = mountMenu({
      menuActions: [
        { key: 'copy', label: '复制' },
        { key: 'paste', label: '粘贴', disabled: true },
      ],
    })
    expect(onAction).not.toHaveBeenCalled()
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    const items = Array.from(document.querySelectorAll('.ui-tree__menu-item')) as HTMLElement[]
    expect(items.length).toBe(2)
    items[0]!.click()
    await flushPromises()
    expect(wrapper.emitted('menu-action')).toBeTruthy()
    // 自定义模式下不应进入编辑
    expect(wrapper.find('.ui-tree__edit-input').exists()).toBe(false)
    wrapper.unmount()
  })

  it('禁用菜单项点击无反应', async () => {
    const wrapper = mountMenu({ menuActions: [{ key: 'x', label: '不可用', disabled: true }] })
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    ;(document.querySelector('.ui-tree__menu-item') as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('menu-action')).toBeFalsy()
    wrapper.unmount()
  })

  it('按 Esc 关闭菜单', async () => {
    const wrapper = mountMenu()
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    expect(document.querySelector('.ui-tree__menu')).toBeTruthy()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(document.querySelector('.ui-tree__menu')).toBeNull()
    wrapper.unmount()
  })

  it('点击菜单外部关闭菜单', async () => {
    const wrapper = mountMenu()
    await wrapper.findAll('.ui-tree__node')[0]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await flushPromises()
    expect(document.querySelector('.ui-tree__menu')).toBeNull()
    wrapper.unmount()
  })
})

describe('UiTree 新增 / 删除节点', () => {
  it('右键新增子节点：插入临时节点并进入编辑，Enter 后 emit add', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true, defaultExpandAll: true },
      attachTo: document.body,
    })
    const devIdx = wrapper.findAll('.ui-tree__node').findIndex((n) => n.text().includes('研发部'))
    await wrapper.findAll('.ui-tree__node')[devIdx]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    ;(document.querySelectorAll('.ui-tree__menu-item')[0] as HTMLElement).click() // 新增子节点
    await flushPromises()

    const input = wrapper.find('.ui-tree__edit-input')
    expect(input.exists()).toBe(true)
    await input.setValue('基础架构组')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    const ev = wrapper.emitted('add')![0]!
    const added = ev[0] as TreeNode
    expect(added.label).toBe('基础架构组')
    expect(ev[1]).toBe('dev') // 父节点 key
    expect(wrapper.text()).toContain('基础架构组')
    wrapper.unmount()
  })

  it('startAddRoot：根级新增', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true },
      attachTo: document.body,
    })
    // 空白处右键 → 菜单里没有内置 add-root，直接调组件方法不方便；
    // 这里验证空白右键 + 「新增子节点」不报错（node 为 null 时忽略）
    await wrapper.find('.ui-tree').trigger('contextmenu', { clientX: 5, clientY: 5 })
    await flushPromises()
    ;(document.querySelectorAll('.ui-tree__menu-item')[0] as HTMLElement).click()
    await flushPromises()
    expect(wrapper.emitted('add')).toBeFalsy()
    wrapper.unmount()
  })

  it('删除节点：emit remove + 新树不含该节点', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true, defaultExpandAll: true },
      attachTo: document.body,
    })
    const nodes = wrapper.findAll('.ui-tree__node')
    // 找到「市场部」
    const mktIdx = nodes.findIndex((n) => n.text().includes('市场部'))
    await nodes[mktIdx]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    const items = Array.from(document.querySelectorAll('.ui-tree__menu-item')) as HTMLElement[]
    items[2]!.click() // 删除
    await flushPromises()

    const ev = wrapper.emitted('remove')![0]!
    expect((ev[0] as TreeNode).value).toBe('mkt')
    expect(wrapper.text()).not.toContain('市场部')
    wrapper.unmount()
  })

  it('beforeDelete 返回 false 阻止删除', async () => {
    const beforeDelete = vi.fn().mockResolvedValue(false)
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true, defaultExpandAll: true, beforeDelete },
      attachTo: document.body,
    })
    const nodes = wrapper.findAll('.ui-tree__node')
    const mktIdx = nodes.findIndex((n) => n.text().includes('市场部'))
    await nodes[mktIdx]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    ;(document.querySelectorAll('.ui-tree__menu-item')[2] as HTMLElement).click()
    await flushPromises()
    expect(beforeDelete).toHaveBeenCalled()
    expect(wrapper.emitted('remove')).toBeFalsy()
    expect(wrapper.text()).toContain('市场部')
    wrapper.unmount()
  })

  it('删除被选中节点后清空选中态', async () => {
    const wrapper = mount(UiTree, {
      props: { data: data(), editable: true, contextMenu: true, defaultExpandAll: true },
      attachTo: document.body,
    })
    const nodes = wrapper.findAll('.ui-tree__node')
    const mktIdx = nodes.findIndex((n) => n.text().includes('市场部'))
    await nodes[mktIdx]!.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.is-selected').length).toBe(1)
    await nodes[mktIdx]!.trigger('contextmenu', { clientX: 10, clientY: 10 })
    await flushPromises()
    ;(document.querySelectorAll('.ui-tree__menu-item')[2] as HTMLElement).click()
    await flushPromises()
    expect(wrapper.findAll('.is-selected').length).toBe(0)
    wrapper.unmount()
  })
})
