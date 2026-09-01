// UiTree 树形组件共享上下文（作品㊱）
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
  /** 禁用（不可选/不可勾选） */
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
