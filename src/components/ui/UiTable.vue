<script setup lang="ts">
// UiTable —— 企业级数据表格
// 学习重点:
//   1. 列配置驱动渲染 (columns 数据 + 作用域插槽自定义单元格)
//   2. 排序 (点击表头循环 asc→desc→none, 不可变数据更新)
//   3. 分页 (computed 切片当前页数据, 内置分页控件)
//   4. 空态/加载态
import { computed, ref } from 'vue'

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
  }>(),
  {
    pageSize: 10,
    loading: false,
    emptyText: '暂无数据',
    striped: false,
    dense: false,
    sortKey: '',
    sortOrder: null,
  },
)

const emit = defineEmits<{
  /** 排序变化 (key, order) */
  'update:sortKey': [key: string]
  'update:sortOrder': [order: SortOrder]
  /** 页码变化 */
  'update:currentPage': [page: number]
}>()

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

// 供模板用的数据
const tableData = computed(() => {
  if (props.loading) return []
  if (props.pageSize > 0) return pagedData.value
  return sortedData.value
})
const showPagination = computed(() => props.pageSize > 0 && !props.loading && sortedData.value.length > 0)

// 排序图标
function sortIcon(order: SortOrder, active: boolean): string {
  if (!active) return '↕'
  return order === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="ui-table" :class="{ 'is-dense': dense }">
    <div class="ui-table__scroll">
      <table class="ui-table__table" :class="{ 'is-striped': striped }">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[`is-${col.align || 'left'}`, { 'is-sortable': col.sortable }]"
              :style="col.width ? { width: typeof col.width === 'number' ? col.width + 'px' : col.width } : undefined"
              @click="toggleSort(col)"
            >
              <span class="ui-table__th-inner">
                {{ col.label }}
                <span v-if="col.sortable" class="ui-table__sort-icon" :class="{ 'is-active': sortKey === col.key }">{{ sortIcon(sortOrder, sortKey === col.key) }}</span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length" class="ui-table__state">
              <span class="ui-table__loading">加载中…</span>
            </td>
          </tr>
          <tr v-else-if="tableData.length === 0">
            <td :colspan="columns.length" class="ui-table__state">
              <span class="ui-table__empty">📭 {{ emptyText }}</span>
            </td>
          </tr>
          <tr v-for="(row, i) in tableData" :key="i">
            <td
              v-for="col in columns"
              :key="col.key"
              :class="`is-${col.align || 'left'}`"
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
}
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
