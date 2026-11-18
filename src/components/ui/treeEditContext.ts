// UiTree ㊳：节点编辑（重命名 / 新增 / 删除 / 右键菜单）共享上下文
// ⚠️ 同 treeContext：<script setup> 不能运行时 export，Context 抽独立模块。
import type { InjectionKey, Ref } from 'vue'
import type { TreeNode } from './treeContext'

/** 右键菜单项 */
export interface TreeMenuAction {
  /** 唯一 key，emit 时回传 */
  key: string
  /** 显示文本 */
  label: string
  /** 图标（emoji 或字符） */
  icon?: string
  /** 禁用该菜单项 */
  disabled?: boolean
  /** 显示分割线 */
  divider?: boolean
}

/** 右键菜单状态 */
export interface TreeMenuState {
  visible: boolean
  x: number
  y: number
  /** 触发菜单的节点（空白处为 null） */
  node: TreeNode | null
}

/** 内联编辑状态 */
export interface TreeEditState {
  key: string | number | null
  draft: string
  /** 本次编辑是否为「新建」（true 时取消 = 整行移除） */
  isNew: boolean
  /** 新建时挂到哪个父节点下（null = 根） */
  parentKey: string | number | null
}

export interface TreeEditContext {
  /** 是否允许编辑（editable 总开关） */
  editable: Ref<boolean>
  /** 内联编辑状态 */
  editing: Ref<TreeEditState | null>
  /** 开始重命名某节点 */
  startRename: (node: TreeNode) => void
  /** 开始新增子节点 */
  startAddChild: (node: TreeNode) => void
  /** 开始新增根节点 */
  startAddRoot: () => void
  /** 提交编辑（Enter / blur） */
  commitEdit: () => void
  /** 取消编辑（Esc） */
  cancelEdit: () => void
  /** 删除节点 */
  removeTreeNode: (node: TreeNode) => void

  /** 右键菜单状态 */
  menu: Ref<TreeMenuState>
  /** 打开菜单 */
  openMenu: (node: TreeNode | null, e: MouseEvent) => void
  /** 关闭菜单 */
  closeMenu: () => void
  /** 菜单配置 */
  menuActions: Ref<TreeMenuAction[]>
  /** 菜单项点击 */
  onMenuAction: (action: TreeMenuAction) => void

  /** 判断节点是否正在编辑 */
  isEditingKey: (key: string | number) => boolean
}

export const TreeEditKey: InjectionKey<TreeEditContext> = Symbol('UiTreeEdit')
