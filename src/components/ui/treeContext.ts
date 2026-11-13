// UiTree 树形组件共享上下文（作品㊱ → ㊲ 增强）
// ⚠️ 为何独立成 .ts：<script setup> 不允许运行时 export（编译报错），
//   但 provide 的 InjectionKey + 类型必须共享给递归子组件 → 抽独立模块两头 import。
import type { InjectionKey, Ref } from 'vue'

// 节点数据结构
export interface TreeNode {
  /** 显示文本 */
  label: string
  /** 节点唯一值 */
  value: string | number
  /** 子节点 */
  children?: TreeNode[]
  /** 禁用（不可选/不可勾选/不可拖拽） */
  disabled?: boolean
  /** 初始展开（非受控） */
  expanded?: boolean
  /** 初始选中（非受控） */
  checked?: boolean
  /** 强制视为叶节点（懒加载场景下不显示展开箭头） */
  isLeaf?: boolean
  /** 额外字段透传 */
  [key: string]: unknown
}

/** 拖拽放置位置：节点内部（成为子节点）/ 节点前 / 节点后（同级） */
export type DropPosition = 'inner' | 'before' | 'after'

/** 节点单击事件（作品㊲：支持点击箭头/文本分别触发） */
export type NodeClickArea = 'arrow' | 'label' | 'checkbox'

// 树上下文：供递归子组件共享展开/选中状态与回调
export interface TreeContext {
  expandedKeys: Ref<Set<string | number>>
  checkedKeys: Ref<Set<string | number>>
  indeterminateKeys: Ref<Set<string | number>>
  // 方法
  toggleExpand: (node: TreeNode) => void
  handleCheck: (node: TreeNode, checked: boolean) => void
  handleSelect: (node: TreeNode) => void
  isFilterVisible: (node: TreeNode) => boolean
  loadNode: (node: TreeNode) => Promise<void>
  hasLoad: Ref<boolean>
  loadingKeys: Ref<Set<string | number>>
  selectedNodeRef: Ref<TreeNode | null>
  filterText: Ref<string>
  showLine: Ref<boolean>
  checkable: Ref<boolean>
  selectable: Ref<boolean>
  checkStrictly: Ref<boolean>
  defaultExpandAll: Ref<boolean>

  // ---------- 作品㊲ 新增 ----------
  /** 键盘导航：当前聚焦节点（roving tabindex） */
  focusedKey: Ref<string | number | null>
  /** 键盘导航：所有可见（可聚焦）节点的扁平顺序 */
  focusOrder: Ref<(string | number)[]>
  /** 键盘导航：聚焦某节点（焦点 DOM 由指令/ref 处理） */
  focusNode: (key: string | number) => void
  /** 键盘导航：聚焦后的 DOM 句柄注册表 */
  nodeEls: Map<string | number, HTMLElement>
  /** 点击文本是否也触发展开（node-click-expand） */
  clickToExpand: Ref<boolean>
  /** 节点单击回调（带区域信息） */
  handleNodeClick: (node: TreeNode, area: NodeClickArea) => void

  /** 拖拽：是否启用 */
  draggable: Ref<boolean>
  /** 拖拽：当前被拖动的节点 key */
  draggingKey: Ref<string | number | null>
  /** 拖拽：当前悬停目标 { key, position } */
  dropTarget: Ref<{ key: string | number; position: DropPosition } | null>
  /** 拖拽：开始 / 经过 / 放置 / 结束 */
  onDragStart: (node: TreeNode, e: DragEvent) => void
  onDragOver: (node: TreeNode, e: DragEvent) => void
  onDragLeave: (node: TreeNode, e: DragEvent) => void
  onDrop: (node: TreeNode, e: DragEvent) => void
  onDragEnd: () => void
  /** 找出某 key 的父节点（无父返回 null） */
  parentOfKey: (key: string | number) => TreeNode | null
  /** 加载态：node key → loading */
  isNodeLoading: (node: TreeNode) => boolean
}

// provide/inject 的 Key（符号）
export const TreeKey: InjectionKey<TreeContext> = Symbol('UiTree')

// 递归扁平化所有节点到 map
export function buildNodeMap(nodes: TreeNode[], map: Map<string | number, TreeNode> = new Map()) {
  for (const n of nodes) {
    map.set(n.value, n)
    if (n.children && n.children.length) buildNodeMap(n.children, map)
  }
  return map
}

// 收集某节点的所有后代（含间接）
export function getDescendants(node: TreeNode): TreeNode[] {
  const out: TreeNode[] = []
  const walk = (n: TreeNode) => {
    if (n.children) {
      for (const c of n.children) {
        out.push(c)
        if (c.children?.length) walk(c)
      }
    }
  }
  walk(node)
  return out
}

// ---------- 作品㊲：不可变树操作工具（拖拽的核心） ----------
// 为什么用"不可变"：直接变异 props.data 会触发父级数据意外变化、也无法撤销；
// 克隆出新树 + emit 让父级自己决定是否采用（受控思想）。

/** 深拷贝树（只拷贝结构字段，额外字段透传引用足够，但为安全做浅克隆节点对象） */
export function cloneTree(nodes: TreeNode[]): TreeNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : n.children,
  }))
}

/** 在树中查找节点及其父节点 */
export function findNode(
  nodes: TreeNode[],
  key: string | number,
): { node: TreeNode; parent: TreeNode | null; siblings: TreeNode[] } | null {
  const walk = (list: TreeNode[], parent: TreeNode | null): ReturnType<typeof findNode> => {
    for (const n of list) {
      if (n.value === key) return { node: n, parent, siblings: list }
      if (n.children?.length) {
        const hit = walk(n.children, n)
        if (hit) return hit
      }
    }
    return null
  }
  return walk(nodes, null)
}

/** 从树中删除节点，返回被删除的节点（找不到返回 null） */
export function removeNode(nodes: TreeNode[], key: string | number): TreeNode | null {
  const hit = findNode(nodes, key)
  if (!hit) return null
  const idx = hit.siblings.indexOf(hit.node)
  if (idx >= 0) hit.siblings.splice(idx, 1)
  return hit.node
}

/** 判断 a 是否为 b 的祖先（拖拽时禁止把父拖进自己的后代） */
export function isAncestorOf(a: TreeNode, b: TreeNode): boolean {
  return getDescendants(a).some((d) => d.value === b.value)
}

/** 把 dragKey 移动到 targetKey 的指定位置，返回新树（不修改入参） */
export function moveNode(
  tree: TreeNode[],
  dragKey: string | number,
  targetKey: string | number,
  position: DropPosition,
): TreeNode[] {
  if (dragKey === targetKey) return tree
  const next = cloneTree(tree)
  const dragHit = findNode(next, dragKey)
  const targetHit = findNode(next, targetKey)
  if (!dragHit || !targetHit) return tree
  // 不能把节点拖进自己的后代里
  if (isAncestorOf(dragHit.node, targetHit.node)) return tree
  const moved = removeNode(next, dragKey)!
  // 删除后重新定位目标（索引可能变化）
  if (position === 'inner') {
    const t = findNode(next, targetKey)
    if (!t) return tree
    t.node.children = t.node.children ? [...t.node.children, moved] : [moved]
  } else {
    const t = findNode(next, targetKey)
    if (!t) return tree
    const idx = t.siblings.indexOf(t.node)
    t.siblings.splice(position === 'before' ? idx : idx + 1, 0, moved)
  }
  return next
}

/** 把可见节点按显示顺序扁平化（键盘导航/拖拽顺序用） */
export function flattenVisible(
  nodes: TreeNode[],
  expanded: Set<string | number>,
  isVisible?: (n: TreeNode) => boolean,
): TreeNode[] {
  const out: TreeNode[] = []
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (isVisible && !isVisible(n)) continue
      out.push(n)
      if (n.children?.length && expanded.has(n.value)) walk(n.children)
    }
  }
  walk(nodes)
  return out
}
