<script setup lang="ts">
// TableView —— UiTable 数据表格演示页（作品㉖）
// 演示: 排序 + 分页 + 作用域插槽 + 受控排序 + 加载/空态
import { ref } from 'vue'
import UiTable, { type TableColumn, type SortOrder } from '../components/ui/UiTable.vue'

// 模拟员工数据
const rows = ref(
  Array.from({ length: 28 }, (_, i) => ({
    id: i + 1,
    name: (['张伟', '王芳', '李娜', '刘洋', '陈静', '杨杰', '赵敏', '黄磊', '周莹', '吴强'][i % 10] as string) + (i + 1),
    dept: ['研发部', '产品部', '设计部', '市场部', '人事部'][i % 5],
    salary: 8000 + (i * 1370) % 9000,
    status: i % 3 === 0 ? 'active' : i % 3 === 1 ? 'pending' : 'disabled',
    joinDate: new Date(2024, (i % 12), (i % 28) + 1),
  })),
)

const columns: TableColumn[] = [
  { key: 'id', label: 'ID', width: 60, align: 'center' },
  { key: 'name', label: '姓名', sortable: true },
  { key: 'dept', label: '部门' },
  { key: 'salary', label: '薪资', sortable: true, align: 'right', formatter: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'status', label: '状态' },
  { key: 'joinDate', label: '入职日期', sortable: true },
]

// 受控排序演示
const sortKey = ref('')
const sortOrder = ref<SortOrder>(null)
function onSortKey(key: string) {
  sortKey.value = key
}
function onSortOrder(order: SortOrder) {
  sortOrder.value = order
}

// 加载 / 空态切换
const loading = ref(false)
const showEmpty = ref(false)
const displayData = ref(rows.value)
function toggleLoading() {
  loading.value = true
  setTimeout(() => (loading.value = false), 1200)
}
function toggleEmpty() {
  showEmpty.value = !showEmpty.value
  displayData.value = showEmpty.value ? [] : rows.value
}

// 状态徽标配置
const statusMap = {
  active: { text: '在职', color: 'green' },
  pending: { text: '试用', color: 'orange' },
  disabled: { text: '离职', color: 'gray' },
} as const

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="page">
    <h1>📊 UiTable 数据表格</h1>
    <p class="sub">列配置驱动 + 排序 + 分页 + 作用域插槽，企业级表格组件（作品㉖）</p>

    <div class="controls">
      <button @click="toggleLoading">⏳ 加载态</button>
      <button @click="toggleEmpty">📭 空态</button>
      <span class="hint">薪资列有 formatter；状态列用作用域插槽渲染徽标</span>
    </div>

    <UiTable
      :columns="columns"
      :data="displayData"
      :page-size="8"
      :loading="loading"
      :empty-text="showEmpty ? '暂无员工数据' : '暂无数据'"
      striped
    >
      <!-- 作用域插槽: 状态列渲染为带色徽标 -->
      <template #cell="{ column, value, row }">
        <UiBadge v-if="column.key === 'status'" :color="(statusMap as any)[value].color">
          {{ (statusMap as any)[value].text }}
        </UiBadge>
        <span v-else-if="column.key === 'joinDate'">{{ fmtDate(value as Date) }}</span>
        <span v-else>{{ value }}</span>
      </template>
    </UiTable>

    <h2>受控排序</h2>
    <p class="sub">外部通过 sortKey / sortOrder + update 事件完全控制排序状态</p>
    <div class="controls">
      <button @click="sortKey = 'salary'; sortOrder = 'asc'">按薪资升序</button>
      <button @click="sortKey = 'salary'; sortOrder = 'desc'">按薪资降序</button>
      <button @click="sortKey = ''; sortOrder = null">清除排序</button>
      <span class="hint">当前: {{ sortKey ? `${sortKey} ${sortOrder}` : '无排序' }}</span>
    </div>
    <UiTable
      :columns="columns"
      :data="displayData"
      :page-size="5"
      :sort-key="sortKey"
      :sort-order="sortOrder"
      @update:sort-key="onSortKey"
      @update:sort-order="onSortOrder"
    />
  </div>
</template>

<style scoped>
.page h1 { font-size: 26px; margin: 0 0 4px; }
.page h2 { font-size: 20px; margin: 32px 0 4px; }
.sub { color: var(--ui-text-3); margin: 0 0 16px; }
.controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.controls button {
  border: 1px solid var(--ui-border); background: var(--ui-bg-soft); color: var(--ui-text-1);
  border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer; transition: all .2s;
}
.controls button:hover { border-color: var(--ui-primary); color: var(--ui-primary); }
.hint { font-size: 12px; color: var(--ui-text-3); }
</style>
