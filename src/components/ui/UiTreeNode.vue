<script setup lang="ts">
// UiTreeNode — 树形递归子节点（作品㊱）
// 学习重点: 递归组件自身引用（defineOptions name）+ inject 共享树上下文
import { computed, inject } from 'vue'
import type { TreeNode, TreeContext } from './treeContext'
import { TreeKey } from './treeContext'

// 允许组件模板里递归引用自身（<UiTreeNode>）
defineOptions({ name: 'UiTreeNode' })

const props = defineProps<{
  node: TreeNode
  depth: number
  visible?: boolean
}>()

const ctx = inject<TreeContext>(TreeKey)!

const hasChildren = computed(() => !!(props.node.children && props.node.children.length))
const isLeaf = computed(() => {
  if (props.node.isLeaf === true) return true
  if (hasChildren.value) return false
  // 无 children 但有 load → 可展开的非叶（懒加载）
  return !ctx.hasLoad.value
})
const isExpanded = computed(() => ctx.expandedKeys.value.has(props.node.value))
const isChecked = computed(() => ctx.checkedKeys.value.has(props.node.value))
const isIndeterminate = computed(() => ctx.indeterminateKeys.value.has(props.node.value))
const isLoading = computed(() => ctx.loadingKeys.value.has(props.node.value))
const isDisabled = computed(() => props.node.disabled === true)
const isMatched = computed(() => {
  const t = ctx.filterText.value.trim()
  return !!t && props.node.label.includes(t)
})
// 当前节点是否被选中（单选高亮）
const isSelected = computed(() => ctx.selectable.value && ctx.selectedNodeRef?.value?.value === props.node.value)

function onToggle() {
  ctx.toggleExpand(props.node)
}
function onCheck(e: Event) {
  const target = e.target as HTMLInputElement
  ctx.handleCheck(props.node, target.checked)
}
function onClick() {
  ctx.handleSelect(props.node)
}
</script>

<template>
  <div
    v-if="visible"
    class="ui-tree__node-wrap"
    :style="{ paddingLeft: depth ? `${depth * 20}px` : '0px' }"
  >
    <div
      class="ui-tree__node"
      :class="{
        'is-expanded': isExpanded,
        'is-selected': isSelected,
        'is-disabled': isDisabled,
      }"
      role="treeitem"
      :aria-expanded="hasChildren ? isExpanded : undefined"
      :aria-selected="isSelected"
    >
      <span
        class="ui-tree__arrow"
        :class="{ 'is-expanded': isExpanded, 'is-leaf': isLeaf }"
        @click="onToggle"
      >▸</span>
      <input
        v-if="ctx.checkable.value"
        type="checkbox"
        class="ui-tree__checkbox"
        :checked="isChecked"
        :indeterminate="isIndeterminate"
        :disabled="isDisabled"
        @change="onCheck"
      >
      <span
        class="ui-tree__label"
        :class="{ 'is-matched': isMatched, 'is-disabled': isDisabled }"
        @click="onClick"
      >
        {{ node.label }}
        <span v-if="isLoading" class="ui-tree__loading">⏳</span>
      </span>
    </div>
    <div v-if="hasChildren && isExpanded" class="ui-tree__children">
      <UiTreeNode
        v-for="child in node.children"
        :key="String(child.value)"
        :node="child"
        :depth="depth + 1"
        :visible="ctx.filterText.value ? ctx.isFilterVisible(child) : true"
      />
    </div>
  </div>
</template>

<style scoped>
.ui-tree__node-wrap { }

/* 单行节点 */
.ui-tree__node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: default;
  transition: background .15s;
}
.ui-tree__node:hover:not(.is-disabled) { background: var(--ui-bg-soft); }
.ui-tree__node.is-selected { background: var(--ui-primary-soft); }
.ui-tree__node.is-disabled { opacity: .5; }

/* 展开箭头 */
.ui-tree__arrow {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ui-text-3);
  font-size: 12px;
  cursor: pointer;
  transition: transform .2s;
  transform: rotate(0deg);
  border-radius: 4px;
}
.ui-tree__arrow:hover { background: var(--ui-bg-soft); color: var(--ui-primary); }
.ui-tree__arrow.is-expanded { transform: rotate(90deg); }
.ui-tree__arrow.is-leaf { visibility: hidden; }

/* 复选框 */
.ui-tree__checkbox {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--ui-primary);
  cursor: pointer;
}
.ui-tree__node.is-disabled .ui-tree__checkbox { cursor: not-allowed; }

/* 节点文本 */
.ui-tree__label {
  flex: 1;
  padding: 2px 0;
}
.ui-tree__label.is-matched { color: var(--ui-primary); font-weight: 600; }
.ui-tree__label.is-disabled { color: var(--ui-text-3); }
.ui-tree__loading { font-size: 12px; margin-left: 4px; }

/* 子节点容器展开/折叠动画 */
.ui-tree__children { overflow: hidden; }
</style>
