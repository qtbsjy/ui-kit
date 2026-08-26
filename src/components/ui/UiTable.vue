<script setup lang="ts">
// UiTable —— 企业级数据表格
// 学习重点:
//   1. 列配置驱动渲染 (columns 数据 + 作用域插槽自定义单元格)
//   2. 排序 (点击表头循环 asc→desc→none, 不可变数据更新)
//   3. 分页 (computed 切片当前页数据, 内置分页控件)
//   4. 空态/加载态
//   5. 表头固定 (stickyHeader: 滚动容器内 position:sticky 表头)
//   6. 多选 (selectable: 行选择 + 全选/半选/跨页)
//   7. 列宽拖动 (resizable: 表头拖拽改列宽)
import { computed, ref, onBeforeUnmount } from 'vue'

export type SortOrder = 'asc' | 'desc' | null

export interface TableColumn<T = any> {
  /** 字段 key（数据行的属性名） */
  key: string
  /** 表头文字 */
  label: string
  /** 列宽 */
  width?: number | string
  /** 对齐 */
  align?: 'left' | 'center' | 'right'
  /** 允许排序 */
  sortable?: boolean
  /** 自定义格式化（优先级低于作用域插槽） */
  formatter?: (value: unknown, row: T) => string
}

const props = withDefaults(
  defineProps<{
    /** 列配置 */
    columns: TableColumn[]
    /** 数据行 */
    data: any[]
    /** 分页大小（<=0 表示不分页） */
    pageSize?: number
    /** 加载态 */
    loading?: boolean
    /** 空态文案 */
    emptyText?: string
    /** 斑马纹 */
    striped?: boolean
    /** 紧凑模式 */
    dense?: boolean
    /** 排序状态受控（可选，用于外部控制） */
    sortKey?: string
    sortOrder?: SortOrder
    /** 表头固定：限制高度内滚动，表头吸附顶部 */
    stickyHeader?: boolean
    /** 表头固定时可视区最大高度（如 '400px'） */
    maxHeight?: string
    /** 开启行选择（多选） */
    selectable?: boolean
    /** 行的唯一标识字段（默认 'key'） */
    rowKey?: string
    /** 已选行 key 列表（受控） */
    selected?: (string | number)[]
    /** 开启列宽拖动 */
    resizable?: boolean
    /** 列宽表（受控，key → 像素宽） */
    columnWidths?: Record<string, number>
    /** 拖拽列的最小宽（px） */
    minColWidth?: number
  }>(),
  {
    pageSize: 10,
    loading: false,
    emptyText: '暂无数据',
    striped: false,
    dense: false,
    sortKey: '',
    sortOrder: null,
    stickyHeader: false,
    maxHeight: '300px',
    selectable: false,
    rowKey: 'key',
    selected: () => [],
    resizable: false,
    columnWidths: () => ({}),
    minColWidth: 60,
  },
)

const emit = defineEmits<{
  /** 排序变化 (key, order) */
  'update:sortKey': [key: string]
  'update:sortOrder': [order: SortOrder]
  /** 页码变化 */
  'update:currentPage': [page: number]
  /** 行选择变化 */
  'update:selected': [keys: (string | number)[]]
  /** 列宽变化 */
  'update:columnWidths': [widths: Record<string, number>]
}>()

// ---------- 行 key 提取 ----------
function rowId(row: any): string | number {
  return row?.[props.rowKey] ?? row?.key
}

// ---------- 排序状态 ----------
// 受控模式: 外部通过 sortKey/sortOrder 控制; 非受控: 内部维护
const internalSortKey = ref('')
const internalSortOrder = ref<SortOrder>(null)
const sortKey = computed(() => props.sortKey || internalSortKey.value)
const sortOrder = computed(() => (props.sortKey ? props.sortOrder : internalSortOrder.value))

function toggleSort(col: TableColumn) {
  if (!col.sortable) return
  let next: SortOrder
  if (sortKey.value === col.key) {
    next = sortOrder.value === 'asc' ? 'desc' : sortOrder.value === 'desc' ? null : 'asc'
  } else {
    next = 'asc'
  }
  if (props.sortKey) {
    emit('update:sortKey', col.key)
    emit('update:sortOrder', next)
  } else {
    internalSortKey.value = col.key
    internalSortOrder.value = next
  }
}

// ---------- 排序后的数据 ----------
const sortedData = computed(() => {
  if (!sortKey.value || !sortOrder.value) return props.data
  const key = sortKey.value
  const order = sortOrder.value
  // 拷贝后排序（不可变），支持数字/字符串/日期比较
  return [...props.data].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    let cmp = 0
    if (typeof av === 'number' && typeof bv === 'number') {
      cmp = av - bv
    } else if (av instanceof Date && bv instanceof Date) {
      cmp = av.getTime() - bv.getTime()
    } else {
      cmp = String(av ?? '').localeCompare(String(bv ?? ''), 'zh-CN')
    }
    return order === 'asc' ? cmp : -cmp
  })
})

// ---------- 分页 ----------
const currentPage = ref(1)
const totalPages = computed(() => (props.pageSize > 0 ? Math.max(1, Math.ceil(sortedData.value.length / props.pageSize)) : 1))
// pageSize 变化时钳制页码
const pagedData = computed(() => {
  if (props.pageSize <= 0) return sortedData.value
  const page = Math.min(currentPage.value, totalPages.value)
  const start = (page - 1) * props.pageSize
  return sortedData.value.slice(start, start + props.pageSize)
})
function goPage(p: number) {
  currentPage.value = Math.min(Math.max(1, p), totalPages.value)
  emit('update:currentPage', currentPage.value)
}

// ---------- 行选择（多选）----------
// 受控: 外部通过 selected 控制; 非受控: 内部维护
const internalSelected = ref<(string | number)[]>([])
const selected = computed<(string | number)[]>(() =>
  props.selected.length ? props.selected : internalSelected.value,
)
function setSelected(keys: (string | number)[]) {
  if (props.selected.length) {
    emit('update:selected', keys)
  } else {
    internalSelected.value = keys
  }
}
function isSelected(row: any): boolean {
  return selected.value.includes(rowId(row))
}
// 当前页可见行 id（排除加载/空态）
const pageRowIds = computed<(string | number)[]>(() =>
  tableData.value.map((r) => rowId(r)).filter((id) => id !== undefined),
)
// 当前页是否全选 / 部分选中
const pageAllSelected = computed(
  () => pageRowIds.value.length > 0 && pageRowIds.value.every((id) => selected.value.includes(id)),
)
const pageSomeSelected = computed(
  () => pageRowIds.value.some((id) => selected.value.includes(id)) && !pageAllSelected.value,
)
// 表头全选/取消（作用于当前页可见行，保留其它页已选）
function togglePageSelect() {
  const current = new Set(selected.value)
  if (pageAllSelected.value) {
    pageRowIds.value.forEach((id) => current.delete(id))
  } else {
    pageRowIds.value.forEach((id) => current.add(id))
  }
  setSelected([...current])
}
// 单行切换选中
function toggleRow(row: any) {
  const id = rowId(row)
  const current = new Set(selected.value)
  if (current.has(id)) current.delete(id)
  else current.add(id)
  setSelected([...current])
}

// 供模板用的数据
const tableData = computed(() => {
  if (props.loading) return []
  if (props.pageSize > 0) return pagedData.value
  return sortedData.value
})
const showPagination = computed(() => props.pageSize > 0 && !props.loading && sortedData.value.length > 0)
// 状态单元格（加载/空态）跨列数，多选时 +1 选择列
const colspanTotal = computed(() => props.columns.length + (props.selectable ? 1 : 0))

// ---------- 列宽拖动（resizable）----------
// 受控: 外部通过 columnWidths 控制; 非受控: 内部维护
const internalWidths = ref<Record<string, number>>({})
const columnWidths = computed<Record<string, number>>(() =>
  props.columnWidths && Object.keys(props.columnWidths).length
    ? props.columnWidths
    : internalWidths.value,
)
function setColumnWidth(key: string, w: number) {
  const next = { ...columnWidths.value, [key]: w }
  if (props.columnWidths && Object.keys(props.columnWidths).length) {
    emit('update:columnWidths', next)
  } else {
    internalWidths.value = next
  }
}
// 计算某列最终宽（受控/拖动覆盖 > col.width > 自适应）
function resolveWidth(col: TableColumn): string | undefined {
  const dragged = columnWidths.value[col.key]
  if (dragged) return dragged + 'px'
  if (col.width) return typeof col.width === 'number' ? col.width + 'px' : col.width
  return undefined
}
// 拖动状态
const dragState = ref<{ colKey: string; startX: number; startWidth: number } | null>(null)
const resizing = computed(() => dragState.value !== null)
function startResize(e: MouseEvent, col: TableColumn) {
  if (!props.resizable) return
  e.preventDefault()
  e.stopPropagation()
  const current = columnWidths.value[col.key]
  // 无固定宽时拿 DOM 实测当前列宽作为起点
  let startWidth = current
  if (!startWidth) {
    const th = (e.currentTarget as HTMLElement).closest('th')
    startWidth = th ? th.getBoundingClientRect().width : 120
  }
  dragState.value = { colKey: col.key, startX: e.clientX, startWidth }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}
function onDragMove(e: MouseEvent) {
  if (!dragState.value) return
  const { colKey, startX, startWidth } = dragState.value
  const next = Math.max(props.minColWidth, Math.round(startWidth + (e.clientX - startX)))
  setColumnWidth(colKey, next)
}
function onDragEnd() {
  dragState.value = null
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}
// 组件卸载时清理全局监听
onBeforeUnmount(() => {
  if (dragState.value) {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
  }
})

// 排序图标
function sortIcon(order: SortOrder, active: boolean): string {
  if (!active) return '↕'
  return order === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="ui-table" :class="{ 'is-dense': dense, 'is-sticky': stickyHeader }">
    <div
      class="ui-table__scroll"
      :class="{ 'ui-table__scroll--sticky': stickyHeader }"
      :style="stickyHeader ? { maxHeight } : undefined"
    >
      <table class="ui-table__table" :class="{ 'is-striped': striped }">
        <thead>
          <tr>
            <!-- 选择列 -->
            <th v-if="selectable" class="ui-table__check">
              <input
                type="checkbox"
                class="ui-table__checkbox"
                aria-label="全选当前页"
                :checked="pageAllSelected"
                :indeterminate="pageSomeSelected"
                @change="togglePageSelect"
              />
            </th>
            <th
              v-for="(col, colIndex) in columns"
              :key="col.key"
              :class="[`is-${col.align || 'left'}`, { 'is-sortable': col.sortable, 'is-resizing': resizing && dragState?.colKey === col.key }]"
              :style="resolveWidth(col) ? { width: resolveWidth(col) } : undefined"
              @click="toggleSort(col)"
            >
              <span class="ui-table__th-inner">
                {{ col.label }}
                <span v-if="col.sortable" class="ui-table__sort-icon" :class="{ 'is-active': sortKey === col.key }">{{ sortIcon(sortOrder, sortKey === col.key) }}</span>
              </span>
              <!-- 拖拽手柄（最后一列不显示） -->
              <span
                v-if="resizable && colIndex < columns.length - 1"
                class="ui-table__resizer"
                :class="{ 'is-active': resizing && dragState?.colKey === col.key }"
                @mousedown.stop.prevent="startResize($event, col)"
                @click.stop
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="colspanTotal" class="ui-table__state">
              <span class="ui-table__loading">加载中…</span>
            </td>
          </tr>
          <tr v-else-if="tableData.length === 0">
            <td :colspan="colspanTotal" class="ui-table__state">
              <span class="ui-table__empty">📭 {{ emptyText }}</span>
            </td>
          </tr>
          <tr v-for="(row, i) in tableData" :key="i" :class="{ 'is-selected': isSelected(row) }">
            <td v-if="selectable" class="ui-table__check">
              <input
                type="checkbox"
                class="ui-table__checkbox"
                :checked="isSelected(row)"
                @change="toggleRow(row)"
              />
            </td>
            <td
              v-for="col in columns"
              :key="col.key"
              :class="`is-${col.align || 'left'}`"
              :style="resolveWidth(col) ? { width: resolveWidth(col) } : undefined"
            >
              <!-- 作用域插槽优先: #cell="{ row, column, index }" -->
              <slot name="cell" :row="row" :column="col" :index="i" :value="row[col.key]">
                {{ col.formatter ? col.formatter(row[col.key], row) : row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页控件 -->
    <div v-if="showPagination" class="ui-table__pagination">
      <span class="ui-table__page-info">共 {{ sortedData.length }} 条，第 {{ currentPage }}/{{ totalPages }} 页</span>
      <div class="ui-table__page-actions">
        <button class="ui-table__page-btn" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">‹ 上一页</button>
        <button class="ui-table__page-btn" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页 ›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-table {
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--ui-bg, #fff);
  font-size: 14px;
  color: var(--ui-text-1);
}
.ui-table__scroll { overflow-x: auto; }
/* 表头固定: 让滚动容器同时可纵向滚动，表头 sticky 吸附顶部 */
.ui-table__scroll--sticky { overflow: auto; }
.ui-table.is-sticky .ui-table__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  /* sticky 需要不透明背景，否则下方内容会透出来 */
  background: var(--ui-bg-soft, #f7f8fa);
  box-shadow: 0 1px 0 var(--ui-border);
}
.ui-table__check {
  width: 40px;
  text-align: center !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}
.ui-table__checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--ui-primary, #4f46e5);
  cursor: pointer;
  vertical-align: middle;
}
.ui-table__table tbody tr.is-selected { background: color-mix(in srgb, var(--ui-primary, #4f46e5) 8%, transparent); }
.ui-table__table { width: 100%; border-collapse: collapse; }
.ui-table__table th, .ui-table__table td {
  padding: 12px 14px;
  text-align: left;
  border-bottom: 1px solid var(--ui-border);
  white-space: nowrap;
}
.ui-table__table thead th {
  background: var(--ui-bg-soft, #f7f8fa);
  font-weight: 600;
  color: var(--ui-text-2);
  user-select: none;
  position: relative;
}
/* 列宽拖拽手柄 */
.ui-table__resizer {
  position: absolute;
  top: 0;
  right: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 2;
  touch-action: none;
}
.ui-table__resizer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 3px;
  width: 2px;
  height: 100%;
  background: transparent;
  transition: background .15s;
}
.ui-table__resizer:hover::after,
.ui-table__resizer.is-active::after {
  background: var(--ui-primary, #4f46e5);
}
.ui-table__resizer.is-active { cursor: col-resize; }
.ui-table.is-dense .ui-table__table th, .ui-table.is-dense .ui-table__table td { padding: 6px 10px; font-size: 13px; }
.ui-table__table.is-striped tbody tr:nth-child(even) { background: var(--ui-bg-soft, #fafbfc); }
.ui-table__table tbody tr:hover { background: var(--ui-primary, #4f46e5)0f; }
.ui-table__table th.is-sortable { cursor: pointer; }
.ui-table__table th.is-sortable:hover { color: var(--ui-primary, #4f46e5); }
.ui-table__table th:last-child, .ui-table__table td:last-child { border-right: none; }
.ui-table__th-inner { display: inline-flex; align-items: center; gap: 4px; }
.ui-table__sort-icon { font-size: 12px; opacity: .5; }
.ui-table__sort-icon.is-active { opacity: 1; color: var(--ui-primary, #4f46e5); }
.is-center { text-align: center !important; }
.is-right { text-align: right !important; }
.ui-table__state { text-align: center !important; padding: 30px 0 !important; color: var(--ui-text-3); }
.ui-table__loading { display: inline-flex; gap: 8px; align-items: center; }
.ui-table__loading::before {
  content: ''; width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid var(--ui-border); border-top-color: var(--ui-primary, #4f46e5);
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.ui-table__pagination {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px; border-top: 1px solid var(--ui-border);
  background: var(--ui-bg, #fff);
}
.ui-table__page-info { font-size: 13px; color: var(--ui-text-3); }
.ui-table__page-actions { display: flex; gap: 8px; }
.ui-table__page-btn {
  border: 1px solid var(--ui-border); background: var(--ui-bg, #fff);
  border-radius: 6px; padding: 4px 12px; font-size: 13px; cursor: pointer;
  color: var(--ui-text-1); transition: all .2s;
}
.ui-table__page-btn:hover:not(:disabled) { border-color: var(--ui-primary, #4f46e5); color: var(--ui-primary, #4f46e5); }
.ui-table__page-btn:disabled { opacity: .4; cursor: not-allowed; }
</style>
