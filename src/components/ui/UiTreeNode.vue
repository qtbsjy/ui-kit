<script setup lang="ts">
// UiTreeNode — 树形递归子节点（作品㊱ → ㊲）
// 学习重点:
//   1. 递归组件自身引用（defineOptions name）+ inject 共享树上下文
//   2. 键盘导航：ref 注册 DOM 句柄到 ctx.nodeEls，由父级统一 roving tabindex 调度
//   3. 拖拽：HTML5 draggable + dragover 时用 data-* 指示放置位置（before/after/inner）
import { computed, inject, onBeforeUnmount, ref } from 'vue'
import type { NodeClickArea, TreeNode, TreeContext } from './treeContext'
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
// 是否具有可展开性（决定箭头/子容器）——注意：懒加载节点未加载前 hasChildren 为 false，
// 所以不能用 hasChildren 判断，否则展开那刻箭头/子容器会消失（作品㊲ 修）
const canExpand = computed(() => !isLeaf.value)
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

// ---------- ㊲：键盘导航 ----------
const elRef = ref<HTMLElement | null>(null)
const isFocused = computed(() => ctx.focusedKey.value === props.node.value)
// roving tabindex：只有焦点节点可 tab 进入
const tabindex = computed(() => (isFocused.value ? 0 : -1))
// 用 ref 回调登记 DOM，父级做 focus() 时直接取
function registerEl(el: Element | { $el?: Element } | null) {
  const dom = (el as HTMLElement)?.nodeType === 1 ? (el as HTMLElement) : ((el as any)?.$el as HTMLElement | undefined)
  if (!dom) {
    ctx.nodeEls.delete(props.node.value)
    return
  }
  ctx.nodeEls.set(props.node.value, dom)
}
onBeforeUnmount(() => ctx.nodeEls.delete(props.node.value))

// ---------- ㊲：拖拽 ----------
const isDragging = computed(() => ctx.draggingKey.value === props.node.value)
const dropPos = computed(() =>
  ctx.dropTarget.value?.key === props.node.value ? ctx.dropTarget.value.position : null,
)

function onArrowClick(e: MouseEvent) {
  e.stopPropagation()
  ctx.handleNodeClick(props.node, 'arrow')
}
function onLabelClick() {
  ctx.handleNodeClick(props.node, 'label')
  if (props.node.disabled) return
  ctx.focusedKey.value = props.node.value
}
function onCheck(e: Event) {
  const target = e.target as HTMLInputElement
  ctx.focusedKey.value = props.node.value
  ctx.handleCheck(props.node, target.checked)
}

function onDragStart(e: DragEvent) {
  ctx.onDragStart(props.node, e)
}
function onDragOver(e: DragEvent) {
  ctx.onDragOver(props.node, e)
}
function onDragLeave(e: DragEvent) {
  ctx.onDragLeave(props.node, e)
}
function onDrop(e: DragEvent) {
  ctx.onDrop(props.node, e)
}
function onDragEnd() {
  ctx.onDragEnd()
}
</script>

<template>
  <div
    v-if="visible"
    class="ui-tree__node-wrap"
    :style="{ paddingLeft: depth ? `${depth * 20}px` : '0px' }"
  >
    <div
      :ref="registerEl"
      class="ui-tree__node"
      :class="{
        'is-expanded': isExpanded,
        'is-selected': isSelected,
        'is-disabled': isDisabled,
        'is-focused': isFocused && ctx.focusedKey.value !== null,
        'is-dragging': isDragging,
        'is-drop-before': dropPos === 'before',
        'is-drop-after': dropPos === 'after',
        'is-drop-inner': dropPos === 'inner',
      }"
      role="treeitem"
      :tabindex="ctx.focusOrder.value.length ? tabindex : -1"
      :aria-expanded="isLeaf ? undefined : isExpanded"
      :aria-selected="isSelected"
      :aria-level="depth + 1"
      :aria-disabled="isDisabled || undefined"
      :draggable="ctx.draggable.value && !isDisabled"
      @click="onLabelClick"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @dragend="onDragEnd"
    >
      <span
        class="ui-tree__arrow"
        :class="{ 'is-expanded': isExpanded, 'is-leaf': isLeaf }"
        @click="onArrowClick"
      >▸</span>
      <input
        v-if="ctx.checkable.value"
        type="checkbox"
        class="ui-tree__checkbox"
        :checked="isChecked"
        :indeterminate="isIndeterminate"
        :disabled="isDisabled"
        @change="onCheck"
        @click.stop
      >
      <span
        class="ui-tree__label"
        :class="{ 'is-matched': isMatched, 'is-disabled': isDisabled }"
      >
        {{ node.label }}
        <span v-if="isLoading" class="ui-tree__loading">⏳</span>
      </span>
    </div>
    <div v-if="isExpanded && canExpand" class="ui-tree__children" role="group">
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
  border: 1px dashed transparent;
  position: relative;
  outline: none;
}
.ui-tree__node:hover:not(.is-disabled) { background: var(--ui-bg-soft); }
.ui-tree__node.is-selected { background: var(--ui-primary-soft); }
.ui-tree__node.is-disabled { opacity: .5; }
/* 键盘焦点环（只在键盘导航模式下出现） */
.ui-tree__node.is-focused { box-shadow: inset 0 0 0 2px var(--ui-primary); }
/* 拖拽 */
.ui-tree__node.is-dragging { opacity: .4; }
.ui-tree__node.is-drop-before::before,
.ui-tree__node.is-drop-after::after {
  content: '';
  position: absolute;
  left: 4px;
  right: 4px;
  height: 2px;
  background: var(--ui-primary);
  border-radius: 2px;
  pointer-events: none;
}
.ui-tree__node.is-drop-before::before { top: -1px; }
.ui-tree__node.is-drop-after::after { bottom: -1px; }
.ui-tree__node.is-drop-inner { border-color: var(--ui-primary); background: var(--ui-primary-soft); }

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
