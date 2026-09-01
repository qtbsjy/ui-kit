<script setup lang="ts">
// UiTree — 树形组件（作品㊱）
// 学习重点:
//   1. 递归渲染（UiTreeNode 自引用 / 父子树组件协作）
//   2. value→node 扁平映射 + 父子选中联动（半选态计算）
//   3. 受控/非受控双模式（expandedKeys / checkedKeys）
//   4. 懒加载（load 回调 + loading 态）
//   5. 过滤（filterText 命中节点及其祖先强制展开显示）

import { computed, provide, ref, watch } from 'vue'
import UiTreeNode from './UiTreeNode.vue'
import type { TreeNode, TreeContext } from './treeContext'
import { TreeKey, buildNodeMap, getDescendants } from './treeContext'

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
function refreshIndeterminate() {
  const set = new Set<string | number>()
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      if (n.children?.length) {
        if (hasCheckedDescendants(n) && !allDescendantsChecked(n)) set.add(n.value)
        walk(n.children)
      }
    }
  }
  walk(props.data)
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
      for (const n of getDescendants(node)) next.add(n.value)
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
}

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
  <div class="ui-tree" :class="{ 'ui-tree--line': showLine }" role="tree">
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
</style>
