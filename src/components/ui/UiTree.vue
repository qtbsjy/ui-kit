<script setup lang="ts">
// UiTree — 树形组件（作品㊱ 基础版 → ㊲ 交互增强版）
// 学习重点:
//   1. 递归渲染（UiTreeNode 自引用 / 父子树组件协作）
//   2. value→node 扁平映射 + 父子选中联动（半选态计算）
//   3. 受控/非受控双模式（expandedKeys / checkedKeys）
//   4. 懒加载（load 回调 + loading 态）
//   5. 过滤（filterText 命中节点及其祖先强制展开显示）
//   —— ㊲ 新增 ——
//   6. 键盘导航：roving tabindex + 方向键/Home/End/展开折叠/勾选 全套无障碍
//   7. 拖拽排序：HTML5 DnD + 放置位置判定（内部/前/后）+ 不可变树变换
//   8. 半选态用 O(n) 后序遍历替代 O(n²) 逐节点扫描

import { computed, nextTick, onMounted, provide, ref, watch } from 'vue'
import UiTreeNode from './UiTreeNode.vue'
import type { DropPosition, NodeClickArea, TreeNode, TreeContext } from './treeContext'
import {
  TreeKey,
  buildNodeMap,
  findNode,
  flattenVisible,
  getDescendants,
  moveNode,
} from './treeContext'

const props = withDefaults(
  defineProps<{
    data: TreeNode[]
    selectable?: boolean
    checkable?: boolean
    checkStrictly?: boolean
    defaultExpandAll?: boolean
    defaultExpandedKeys?: (string | number)[]
    expandedKeys?: (string | number)[]
    checkedKeys?: (string | number)[]
    filterText?: string
    showLine?: boolean
    load?: (node: TreeNode) => Promise<TreeNode[]>
    /** ㊲：点击节点文本即展开/折叠 */
    clickToExpand?: boolean
    /** ㊲：开启键盘导航（单 tabindex 进入 + 方向键移动） */
    keyboardNav?: boolean
    /** ㊲：开启拖拽排序 */
    draggable?: boolean
    /** ㊲：禁用拖拽的节点判定 */
    allowDrop?: (dragNode: TreeNode, dropNode: TreeNode, position: DropPosition) => boolean
    /** ㊲：拖拽后被拖节点的初始展开态（默认展开，方便看到拖入的子节点） */
    expandOnDrop?: boolean
  }>(),
  {
    selectable: true,
    checkable: false,
    checkStrictly: false,
    defaultExpandAll: false,
    defaultExpandedKeys: () => [],
    expandedKeys: undefined,
    checkedKeys: undefined,
    filterText: '',
    showLine: false,
    load: undefined,
    clickToExpand: false,
    keyboardNav: false,
    draggable: false,
    allowDrop: undefined,
    expandOnDrop: true,
  },
)

const emit = defineEmits<{
  'update:expandedKeys': [keys: (string | number)[]]
  'update:checkedKeys': [keys: (string | number)[]]
  'select': [node: TreeNode, selected: boolean]
  'check': [checkedKeys: (string | number)[], node: TreeNode, checked: boolean]
  'node-click': [node: TreeNode]
  'node-expand': [node: TreeNode]
  'node-collapse': [node: TreeNode]
  /** ㊲：拖拽完成，data = 变换后的新树 */
  'drop': [payload: { dragKey: string | number; dropKey: string | number; position: DropPosition; data: TreeNode[] }]
  /** ㊲：键盘操作钩子（便于埋点/自定义） */
  'keydown': [key: string, node: TreeNode | null]
}>()

// ---------- 节点扁平化 ----------
const nodeMap = computed(() => {
  const m = new Map<string | number, TreeNode>()
  buildNodeMap(props.data, m)
  return m
})

// 收集默认展开 keys
function collectDefaultExpanded(nodes: TreeNode[]): Set<string | number> {
  const set = new Set<string | number>()
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.children?.length && (n.expanded || props.defaultExpandAll)) {
        set.add(n.value)
        walk(n.children)
      }
    }
  }
  walk(nodes)
  return set
}

const isControlledExpand = computed(() => props.expandedKeys !== undefined)
const isControlledCheck = computed(() => props.checkedKeys !== undefined)

const internalExpanded = ref<Set<string | number>>(new Set())
const internalChecked = ref<Set<string | number>>(new Set())

const expandedKeys = computed<Set<string | number>>(() => {
  if (isControlledExpand.value) return new Set(props.expandedKeys)
  return internalExpanded.value
})

const checkedKeys = computed<Set<string | number>>(() => {
  if (isControlledCheck.value) return new Set(props.checkedKeys)
  return internalChecked.value
})

// ---------- 半选态计算 ----------
function hasCheckedDescendants(node: TreeNode): boolean {
  if (props.checkStrictly) return false
  const keys = checkedKeys.value
  return getDescendants(node).some((n) => keys.has(n.value) && !n.disabled)
}

function allDescendantsChecked(node: TreeNode): boolean {
  if (props.checkStrictly) return true
  const keys = checkedKeys.value
  const desc = getDescendants(node).filter((n) => !n.disabled)
  if (!desc.length) return true
  return desc.every((n) => keys.has(n.value))
}

const indeterminateKeys = ref<Set<string | number>>(new Set())
// ㊲：改为单次后序遍历 O(n)，返回 { 全选, 部分选 }，避免逐节点扫后代的 O(n²)
function refreshIndeterminate() {
  const set = new Set<string | number>()
  const keys = checkedKeys.value
  const strict = props.checkStrictly
  const walk = (n: TreeNode): { all: boolean; some: boolean } => {
    if (n.disabled) return { all: false, some: false }
    if (!n.children?.length) {
      const hit = keys.has(n.value)
      return { all: hit, some: hit }
    }
    let all = true
    let some = false
    let counted = 0
    for (const c of n.children) {
      // 禁用子节点不参与判定（既不算全选也不算部分选）
      if (c.disabled) continue
      const r = walk(c)
      counted++
      if (r.all) some = true
      else all = false
    }
    if (counted === 0) return { all: false, some: false }
    // 后代全部选 → 即便自身 key 不在集合里也视为全选（受控场景常见）
    const selfChecked = keys.has(n.value)
    const effAll = all && selfChecked
    const effSome = some || selfChecked
    if (!strict && effSome && !effAll) set.add(n.value)
    return { all: effAll, some: effSome }
  }
  for (const n of props.data) walk(n)
  indeterminateKeys.value = set
  return set
}

watch(checkedKeys, () => refreshIndeterminate(), { immediate: true })

// ---------- 懒加载 ----------
const loadingKeys = ref<Set<string | number>>(new Set())
async function loadNode(node: TreeNode) {
  if (!props.load) return
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const isLeaf = node.isLeaf === true
  if (hasChildren || isLeaf) return
  if (loadingKeys.value.has(node.value)) return
  const next = new Set(loadingKeys.value)
  next.add(node.value)
  loadingKeys.value = next
  try {
    const children = await props.load(node)
    node.children = children
    nodeMapDirty.value++
  } finally {
    const nxt = new Set(loadingKeys.value)
    nxt.delete(node.value)
    loadingKeys.value = nxt
  }
}
const nodeMapDirty = ref(0)
void nodeMapDirty

// ---------- 展开/折叠 ----------
function toggleExpand(node: TreeNode) {
  const hasKids = Array.isArray(node.children) && node.children.length > 0
  const isLeaf = node.isLeaf === true || (!hasKids && !props.load)
  if (isLeaf) return
  const keys = expandedKeys.value
  const next = new Set(keys)
  if (next.has(node.value)) {
    next.delete(node.value)
    if (!isControlledExpand.value) internalExpanded.value = next
    emit('node-collapse', node)
  } else {
    next.add(node.value)
    if (!isControlledExpand.value) internalExpanded.value = next
    emit('node-expand', node)
    if (props.load && !hasKids && node.isLeaf !== true) {
      loadNode(node)
    }
  }
  if (isControlledExpand.value) {
    emit('update:expandedKeys', [...next])
  }
}

// ---------- 选中（父子联动） ----------
function parentOf(node: TreeNode): TreeNode | null {
  let found: TreeNode | null = null
  const walk = (list: TreeNode[], parent: TreeNode | null) => {
    for (const n of list) {
      if (found) return
      if (n.value === node.value) {
        found = parent
        return
      }
      if (n.children?.length) walk(n.children, n)
    }
  }
  walk(props.data, null)
  return found
}

function handleCheck(node: TreeNode, checked: boolean) {
  if (node.disabled) return
  const keys = checkedKeys.value
  const next = new Set(keys)
  if (props.checkStrictly) {
    if (checked) next.add(node.value)
    else next.delete(node.value)
  } else {
    if (checked) {
      for (const n of getDescendants(node)) if (!n.disabled) next.add(n.value)
      next.add(node.value)
      // 向上：父的所有直接子（的实际选中）都满足 → 父选中
      propagateUp(node, next)
    } else {
      for (const n of getDescendants(node)) next.delete(n.value)
      next.delete(node.value)
      // 向上：移除所有祖先
      let p = parentOf(node)
      while (p) {
        next.delete(p.value)
        p = parentOf(p)
      }
    }
  }
  if (!isControlledCheck.value) internalChecked.value = next
  emit('update:checkedKeys', [...next])
  emit('check', [...next], node, checked)
}

function propagateUp(node: TreeNode, keys: Set<string | number>) {
  let p = parentOf(node)
  while (p) {
    const kids = (p.children || []).filter((k) => !k.disabled)
    const allKidSelected = kids.length > 0 && kids.every((k) => {
      const all = keys.has(k.value) || allDescendantsChecked(k)
      return all
    })
    if (allKidSelected) {
      keys.add(p.value)
    } else {
      break
    }
    p = parentOf(p)
  }
}

// ---------- 单选 ----------
const selectedNode = ref<TreeNode | null>(null)
function handleSelect(node: TreeNode) {
  if (!props.selectable || node.disabled) return
  const was = selectedNode.value
  const isSelected = was?.value === node.value
  selectedNode.value = isSelected ? null : node
  emit('select', node, !isSelected)
  emit('node-click', node)
  // 选中同时把键盘焦点移过去
  if (props.keyboardNav && !isSelected) focusNode(node.value, false)
}

// ---------- ㊲：点击区域分发（箭头 / 文本 / 复选框） ----------
function handleNodeClick(node: TreeNode, area: NodeClickArea) {
  if (area === 'arrow') {
    toggleExpand(node)
    return
  }
  if (area === 'label') {
    if (props.clickToExpand) toggleExpand(node)
    handleSelect(node)
  }
}

// ---------- ㊲：拖拽（HTML5 DnD） ----------
// 关键点：
//   1. 放置位置判定：鼠标在节点上 1/4 高度 → before，下 1/4 → after，中间 → inner
//   2. 禁止把节点拖进自己的后代（会成环）
//   3. 变换用不可变树（cloneTree + removeNode + 插入），emit 新树给父级
//   4. dragover 必须 preventDefault 才能触发 drop
const draggingKey = ref<string | number | null>(null)
const dropTarget = ref<{ key: string | number; position: DropPosition } | null>(null)

function isDragAllowed(node: TreeNode) {
  return props.draggable && !node.disabled
}

function onDragStart(node: TreeNode, e: DragEvent) {
  if (!isDragAllowed(node)) {
    e.preventDefault()
    return
  }
  draggingKey.value = node.value
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    // Firefox 必须 setData，否则不开始拖拽
    try {
      e.dataTransfer.setData('text/plain', String(node.value))
    } catch {
      /* noop */
    }
  }
}

function computePosition(node: TreeNode, e: DragEvent): DropPosition {
  const el = nodeEls.get(node.value) ?? (e.currentTarget as HTMLElement | null)
  const rect = el?.getBoundingClientRect?.()
  // jsdom / 无布局环境：rect 高度为 0 → 全屏按 inner 处理
  if (!rect || !rect.height) return 'inner'
  const offset = e.clientY - rect.top
  const q = rect.height / 4
  if (offset < q) return 'before'
  if (offset > rect.height - q) return 'after'
  return 'inner'
}

function canDrop(dragNode: TreeNode, dropNode: TreeNode, position: DropPosition): boolean {
  if (dragNode.value === dropNode.value) return false
  // 不能拖到自己的后代内部（无限递归的事故源头）
  if (position === 'inner' && getDescendants(dragNode).some((d) => d.value === dropNode.value)) return false
  if (dropNode.disabled) return false
  if (props.allowDrop) return props.allowDrop(dragNode, dropNode, position)
  return true
}

function onDragOver(node: TreeNode, e: DragEvent) {
  if (!props.draggable || draggingKey.value === null) return
  const dragNode = nodeByKey(draggingKey.value)
  if (!dragNode) return
  const position = computePosition(node, e)
  if (!canDrop(dragNode, node, position)) {
    dropTarget.value = null
    return
  }
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dropTarget.value = { key: node.value, position }
}

function onDragLeave(node: TreeNode, _e: DragEvent) {
  if (dropTarget.value?.key === node.value) dropTarget.value = null
}

function onDragEnd() {
  draggingKey.value = null
  dropTarget.value = null
}

function onDrop(node: TreeNode, e: DragEvent) {
  if (draggingKey.value === null) return
  e.preventDefault()
  e.stopPropagation()
  const dragKey = draggingKey.value
  const position = dropTarget.value?.key === node.value ? dropTarget.value.position : computePosition(node, e)
  const dragNode = nodeByKey(dragKey)
  if (!dragNode || !canDrop(dragNode, node, position)) {
    onDragEnd()
    return
  }
  const nextData = moveNode(props.data, dragKey, node.value, position)
  // 拖拽后被拖节点展开（inner 场景方便看到结果）
  if (props.expandOnDrop && !isControlledExpand.value) {
    const nxt = new Set(internalExpanded.value)
    nxt.add(dragKey)
    internalExpanded.value = nxt
  }
  emit('drop', { dragKey, dropKey: node.value, position, data: nextData })
  onDragEnd()
}

function parentOfKey(key: string | number): TreeNode | null {
  return findNode(props.data, key)?.parent ?? null
}

onMounted(() => {
  // 键盘导航首次进入时聚焦第一项（tabindex=0 已在渲染时给到 focusedKey）
  if (props.keyboardNav) {
    const order = focusOrder.value
    if (order.length && focusedKey.value === null) focusedKey.value = order[0]!
  }
})

// ---------- 过滤 ----------
const filterText = computed(() => props.filterText.trim())
const matchedKeys = computed<Set<string | number>>(() => {
  const t = filterText.value
  const set = new Set<string | number>()
  if (!t) return set
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.label.includes(t)) set.add(n.value)
      if (n.children?.length) walk(n.children)
    }
  }
  walk(props.data)
  return set
})
const ancestorKeys = computed<Set<string | number>>(() => {
  const set = new Set<string | number>()
  if (!filterText.value) return set
  const collect = (list: TreeNode[], ancestors: (string | number)[]) => {
    for (const n of list) {
      if (matchedKeys.value.has(n.value)) for (const a of ancestors) set.add(a)
      if (n.children?.length) collect(n.children, [...ancestors, n.value])
    }
  }
  collect(props.data, [])
  return set
})

function isFilterVisible(node: TreeNode): boolean {
  if (!filterText.value) return true
  if (matchedKeys.value.has(node.value)) return true
  if (ancestorKeys.value.has(node.value)) return true
  return getDescendants(node).some((n) => matchedKeys.value.has(n.value))
}

const effectiveExpanded = computed<Set<string | number>>(() => {
  if (!filterText.value) return expandedKeys.value
  const s = new Set(expandedKeys.value)
  for (const k of ancestorKeys.value) s.add(k)
  return s
})

// ---------- ㊲：键盘导航（roving tabindex） ----------
// 理念：整棵树只有一个 tabindex=0（当前聚焦节点），Tab 只进入一次，
// 内部用方向键移动（roving tabindex），这是 ARIA tree 的标准做法。
const focusedKey = ref<string | number | null>(null)
const nodeEls = new Map<string | number, HTMLElement>()

function visibleNodes(): TreeNode[] {
  return flattenVisible(props.data, effectiveExpanded.value, filterText.value ? isFilterVisible : undefined)
}
const focusOrder = computed<(string | number)[]>(() =>
  props.keyboardNav ? visibleNodes().map((n) => n.value) : [],
)

function focusNode(key: string | number, scroll = true) {
  focusedKey.value = key
  nextTick(() => {
    const el = nodeEls.get(key)
    if (!el) return
    el.setAttribute('tabindex', '0')
    el.focus({ preventScroll: true })
    if (scroll && typeof el.scrollIntoView === 'function') {
      // jsdom 没有实现 scrollIntoView，做保护
      try {
        el.scrollIntoView({ block: 'nearest' })
      } catch {
        /* noop */
      }
    }
  })
}

// 初始化聚焦节点：第一个可用节点
watch(
  () => [props.keyboardNav, props.data] as const,
  () => {
    if (!props.keyboardNav) return
    const order = focusOrder.value
    if (!order.length) {
      focusedKey.value = null
      return
    }
    if (focusedKey.value === null || !order.includes(focusedKey.value)) {
      focusedKey.value = order[0]!
    }
  },
  { immediate: true },
)

function moveFocus(delta: number) {
  const order = focusOrder.value
  if (!order.length) return
  const idx = focusedKey.value === null ? -1 : order.indexOf(focusedKey.value)
  const next = Math.max(0, Math.min(order.length - 1, idx + delta))
  focusNode(order[next]!)
}

function nodeByKey(key: string | number | null): TreeNode | null {
  if (key === null) return null
  return nodeMap.value.get(key) ?? null
}

function onTreeKeydown(e: KeyboardEvent) {
  if (!props.keyboardNav) return
  const node = nodeByKey(focusedKey.value)
  const key = e.key
  let handled = true
  switch (key) {
    case 'ArrowDown':
      moveFocus(1)
      break
    case 'ArrowUp':
      moveFocus(-1)
      break
    case 'Home':
      if (focusOrder.value.length) focusNode(focusOrder.value[0]!)
      break
    case 'End':
      if (focusOrder.value.length) focusNode(focusOrder.value[focusOrder.value.length - 1]!)
      break
    case 'ArrowRight':
      if (node) {
        if (!expandedKeys.value.has(node.value)) toggleExpand(node)
        else {
          // 已展开 → 进入第一个子节点
          const order = focusOrder.value
          const i = order.indexOf(node.value)
          if (i >= 0 && i + 1 < order.length) focusNode(order[i + 1]!)
        }
      }
      break
    case 'ArrowLeft':
      if (node) {
        if (expandedKeys.value.has(node.value)) toggleExpand(node)
        else {
          // 已折叠/叶子 → 回到父节点
          const p = parentOf(node)
          if (p) focusNode(p.value)
        }
      }
      break
    case 'Enter':
    case ' ':
      if (node && !node.disabled) {
        if (props.checkable) handleCheck(node, !checkedKeys.value.has(node.value))
        else handleSelect(node)
      }
      break
    default:
      handled = false
  }
  if (handled) {
    e.preventDefault()
    e.stopPropagation()
    emit('keydown', key, node)
  }
}

// ---------- provide ----------
provide<TreeContext>(TreeKey, {
  expandedKeys: effectiveExpanded,
  checkedKeys,
  indeterminateKeys,
  toggleExpand,
  handleCheck,
  handleSelect,
  isFilterVisible,
  loadNode,
  hasLoad: computed(() => !!props.load),
  loadingKeys,
  selectedNodeRef: selectedNode,
  filterText,
  showLine: computed(() => props.showLine),
  checkable: computed(() => props.checkable),
  selectable: computed(() => props.selectable),
  checkStrictly: computed(() => props.checkStrictly),
  defaultExpandAll: computed(() => props.defaultExpandAll),
  // ---------- ㊲ ----------
  focusedKey,
  focusOrder,
  focusNode,
  nodeEls,
  clickToExpand: computed(() => !!props.clickToExpand),
  handleNodeClick,
  draggable: computed(() => !!props.draggable),
  draggingKey,
  dropTarget,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  parentOfKey,
  isNodeLoading: (n: TreeNode) => loadingKeys.value.has(n.value),
})

// ---------- 初始化非受控状态 ----------
function ensureAncestorsChecked(nodes: TreeNode[], keys: Set<string | number>) {
  const walk = (list: TreeNode[], ancestors: TreeNode[]) => {
    for (const n of list) {
      if (keys.has(n.value) || getDescendants(n).some((d) => keys.has(d.value))) {
        for (const a of ancestors) keys.add(a.value)
      }
      if (n.children?.length) walk(n.children, [...ancestors, n])
    }
  }
  walk(nodes, [])
}

function ensureInternalInit() {
  if (!isControlledExpand.value) {
    const defExp = collectDefaultExpanded(props.data)
    for (const k of props.defaultExpandedKeys || []) defExp.add(k)
    internalExpanded.value = defExp
  }
  if (!isControlledCheck.value) {
    const init = new Set<string | number>()
    const walk = (list: TreeNode[]) => {
      for (const n of list) {
        if (n.checked) init.add(n.value)
        if (n.children?.length) walk(n.children)
      }
    }
    walk(props.data)
    if (!props.checkStrictly) ensureAncestorsChecked(props.data, init)
    internalChecked.value = init
  }
}

watch(() => props.data, () => {
  ensureInternalInit()
  refreshIndeterminate()
}, { immediate: true })

watch(() => props.checkStrictly, () => refreshIndeterminate())
</script>

<template>
  <div
    class="ui-tree"
    :class="{ 'ui-tree--line': showLine, 'ui-tree--dragging': draggingKey !== null }"
    role="tree"
    :aria-multiselectable="checkable"
    @keydown="onTreeKeydown"
  >
    <UiTreeNode
      v-for="node in data"
      :key="String(node.value)"
      :node="node"
      :depth="0"
      :visible="isFilterVisible(node)"
    />
    <div v-if="!data.length" class="ui-tree__empty">暂无数据</div>
  </div>
</template>

<style scoped>
.ui-tree {
  font-size: 14px;
  color: var(--ui-text-1);
  user-select: none;
}
.ui-tree__empty {
  padding: 16px;
  text-align: center;
  color: var(--ui-text-3);
  font-size: 13px;
}
.ui-tree--line .ui-tree__children { margin-left: 9px; border-left: 1px solid var(--ui-border); }
.ui-tree--dragging { cursor: grabbing; }
</style>
