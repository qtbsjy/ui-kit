<script setup lang="ts">
/**
 * VirtualListView —— 作品⑯ 虚拟滚动 演示页
 *
 * 展示 UiVirtualList 应对大数据量（5 万条）的流畅度，
 * 并与「一次性渲染全部」的普通列表做性能对比。
 */
import { ref, computed } from 'vue'
import { UiVirtualList, UiButton, UiCard } from '../components'

// 生成 5 万条模拟数据
const N = 50000
const seed = ref<number[]>(Array.from({ length: N }, (_, i) => i + 1))

// 普通列表（全部渲染，用于对比）—— 仅在小数据量时演示
const plainCount = ref(0)
function addPlain() {
  plainCount.value = Math.min(plainCount.value + 1000, 5000)
}
const plainItems = computed(() => seed.value.slice(0, plainCount.value))

// 统计信息
const vRendered = ref(0)
const pRendered = ref(0)

// 行内容示例生成
interface RowData {
  id: number
  name: string
  mail: string
  score: number
  tag: string
}
function rowContent(n: number): RowData {
  return {
    id: n,
    name: `用户 ${n}`,
    mail: `user${n}@example.com`,
    score: (n * 137) % 100,
    tag: n % 3 === 0 ? 'VIP' : n % 2 === 0 ? '普通' : '新客',
  }
}

// 传给 UiVirtualList 的行数据（已定型），供模板安全访问字段
const rows = computed<RowData[]>(() => seed.value.map(rowContent))

// ---------- 动态行高演示数据 ----------
// 内容长短不一 → 行高不固定，验证 variable 动态测量
const dynCount = 2000
const loremFrag = [
  '短',
  '中等内容，会占一行多一点。',
  '这一段内容比较长，会自然地折成两三行甚至更多，用来模拟动态行高下内容长短不一的效果，让列表看起来错落有致。',
  '很长很长的一段描述文字，字多了就会自动换行换行换行，把这一行撑得更高，从而体现虚拟滚动里动态行高的处理能力——每一行的高度都不固定，但列表依然能正确滚动与定位。',
]
interface DynRow {
  id: number
  title: string
  content: string
}
const dynamicRows = computed<DynRow[]>(() =>
  Array.from({ length: dynCount }, (_, i) => ({
    id: i,
    title: `动态行 ${i}`,
    content: loremFrag[i % loremFrag.length]!,
  })),
)
// 展开行：实时改变该行高度，验证动态测量
const dynExpanded = ref<number | null>(null)
function toggleExpand(id: number) {
  dynExpanded.value = dynExpanded.value === id ? null : id
}
</script>

<template>
  <div class="vpage">
    <h1 class="vpage__title">作品⑰ 虚拟滚动列表（固定 + 动态行高）</h1>
    <p class="vpage__lead">
      只渲染可视区域内的行，<strong>5 万条</strong>固定行高数据丝滑滚动；下方<strong>动态行高</strong>示例展示内容长短不一、可展开行的实时测量。
    </p>

    <UiCard class="vpage__card">
      <template #header>
        <div class="vpage__cardhead">
          <strong>UiVirtualList（虚拟滚动）</strong>
          <UiButton size="sm" ghost @click="vRendered = 0">滚动看看</UiButton>
        </div>
      </template>
      <div class="vpage__vlist">
        <UiVirtualList :items="rows" :row-height="56" :overscan="5">
          <template #default="{ item, index }">
            <div class="vrow" :class="{ 'is-alt': index % 2 === 0 }">
              <span class="vrow__idx">{{ index + 1 }}</span>
              <div class="vrow__main">
                <div class="vrow__name">{{ item.name }} <em v-if="item.tag === 'VIP'">★</em></div>
                <div class="vrow__mail">{{ item.mail }}</div>
              </div>
              <span class="vrow__score" :class="'lvl' + Math.floor(item.score / 34)">
                {{ item.score }} 分
              </span>
            </div>
          </template>
        </UiVirtualList>
      </div>
      <template #footer>
        <div class="vpage__stats">数据 <b>50,000</b> 条 · 只渲染视口内约 <b>20~30</b> 个 DOM</div>
      </template>
    </UiCard>

    <UiCard class="vpage__card">
      <template #header>
        <div class="vpage__cardhead">
          <strong>普通列表（一次性全渲染，对比）</strong>
          <UiButton size="sm" @click="addPlain">+1000 条（最多 5000）</UiButton>
        </div>
      </template>
      <div class="vpage__plain">
        <div v-for="(item, index) in plainItems" :key="item" class="vrow" :class="{ 'is-alt': index % 2 === 0 }">
          <span class="vrow__idx">{{ index + 1 }}</span>
          <div class="vrow__main">
            <div class="vrow__name">{{ item }}</div>
            <div class="vrow__mail">普通渲染的 DOM 节点</div>
          </div>
        </div>
        <div v-if="plainCount === 0" class="vpage__empty">点击「+1000 条」加载 — 加到几千条你就会明显感到卡顿</div>
      </div>
      <template #footer>
        <div class="vpage__stats">已渲染 <b>{{ plainCount }}</b> 个 DOM（<b>{{ plainCount * 2 }}</b> 节点）· 越滚越卡</div>
      </template>
    </UiCard>

    <!-- 动态行高演示 -->
    <UiCard class="vpage__card">
      <template #header>
        <div class="vpage__cardhead">
          <strong>动态行高（variable · {{ dynCount }} 条，内容长短不一）</strong>
          <span class="vpage__hint">点击行可展开/收起，实时改变该行高度</span>
        </div>
      </template>
      <div class="vpage__vlist">
        <UiVirtualList :items="dynamicRows" variable :estimated-row-height="64" :overscan="4">
          <template #default="{ item, index, measure }">
            <div :ref="measure" :data-index="index" class="drow">
              <button class="drow__head" @click="toggleExpand(item.id)">
                <span class="drow__idx">{{ index + 1 }}</span>
                <span class="drow__title">{{ item.title }} · {{ item.content.length }}字</span>
                <span class="drow__arrow">{{ item.id === dynExpanded ? '▲' : '▼' }}</span>
              </button>
              <div v-if="item.id === dynExpanded" class="drow__body">
                {{ item.content }}（展开后的额外内容，把这行撑得更高，验证动态测量）
              </div>
            </div>
          </template>
        </UiVirtualList>
      </div>
      <template #footer>
        <div class="vpage__stats">每行高度由内容决定（{{ loremFrag.length }} 种长度）· 未滚动到的行按估算高度占位，滚到即实测修正</div>
      </template>
    </UiCard>

    <UiCard class="vpage__card">
      <template #header><strong>原理速览</strong></template>
      <ul class="vpage__tips">
        <li>固定行高：<code>scrollTop ÷ rowHeight</code> O(1) 算起始索引，滚多快都不卡</li>
        <li>动态行高：<code>估算 + 偏移缓存 + 二分查找</code> 定位；每行用 ResizeObserver 实测后修正后续偏移</li>
        <li><code>overscan</code> 上下多渲染几行，快速滚动不露白</li>
        <li>rAF 节流：不每次滚动都改状态，只在该渲染的帧更新</li>
        <li><code>ResizeObserver</code> 自适应容器尺寸变化</li>
      </ul>
    </UiCard>
  </div>
</template>

<style scoped>
.vpage {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 48px;
  color: var(--ui-text-1);
}
.vpage__title {
  margin: 0 0 4px;
  font-size: 24px;
  color: var(--ui-text-1);
}
.vpage__lead {
  margin: 0 0 20px;
  color: var(--ui-text-2);
  line-height: 1.7;
}
.vpage__card {
  margin-bottom: 20px;
}
.vpage__cardhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.vpage__vlist {
  height: 320px;
}
.vpage__plain {
  height: 320px;
  overflow-y: auto;
  border: 1px solid var(--ui-border);
  border-radius: 8px;
}
.vpage__empty {
  padding: 40px;
  text-align: center;
  color: var(--ui-text-3);
}
.vpage__stats {
  color: var(--ui-text-3);
  font-size: 13px;
}
.vpage__hint {
  color: var(--ui-text-3);
  font-size: 12px;
}
.vpage__tips {
  margin: 0;
  padding-left: 18px;
  color: var(--ui-text-2);
  line-height: 2;
}
.vpage__tips code {
  background: var(--ui-bg-soft);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
}

/* 行样式 */
.vrow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  box-sizing: border-box;
}
.vrow.is-alt {
  background: var(--ui-bg-soft);
}
.vrow__idx {
  color: var(--ui-text-3);
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  font-size: 12px;
}
.vrow__main {
  flex: 1;
  min-width: 0;
}
.vrow__name {
  font-weight: 600;
  color: var(--ui-text-1);
}
.vrow__name em {
  color: var(--ui-warning);
  font-style: normal;
}
.vrow__mail {
  color: var(--ui-text-3);
  font-size: 12px;
}
.vrow__score {
  color: var(--ui-text-2);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.vrow__score.lvl0 { color: var(--ui-danger); }
.vrow__score.lvl1 { color: var(--ui-warning); }
.vrow__score.lvl2 { color: var(--ui-success); }

/* 动态行样式 */
.drow {
  box-sizing: border-box;
  padding: 4px;
}
.drow__head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 12px;
  background: var(--ui-bg-soft);
  border: 1px solid var(--ui-border);
  border-radius: 8px;
  color: var(--ui-text-1);
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: border-color .2s, background .2s;
}
.drow__head:hover {
  border-color: var(--ui-primary);
  background: var(--ui-hover);
}
.drow__idx {
  color: var(--ui-text-3);
  font-variant-numeric: tabular-nums;
  min-width: 34px;
  font-size: 11px;
}
.drow__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.drow__arrow {
  color: var(--ui-primary);
  font-size: 10px;
}
.drow__body {
  padding: 8px 12px;
  color: var(--ui-text-2);
  font-size: 12px;
  line-height: 1.7;
  border-left: 3px solid var(--ui-primary);
  margin-top: 4px;
  background: var(--ui-primary-soft);
  border-radius: 0 8px 8px 0;
}
</style>
