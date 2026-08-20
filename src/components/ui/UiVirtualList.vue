<script setup lang="ts" generic="T">
/**
 * UiVirtualList —— 虚拟滚动列表（固定行高 + 动态行高双模式）
 *
 * 只渲染可视区域内的行，长列表（数千/数万条）也能流畅滚动。
 * 原理：外层一个定高可滚动容器；内部用占位撑起总高度，中间只放「视口内的行」。
 *
 * 两种模式：
 * - 固定行高（默认，rowHeight=固定值）→ O(1) 偏移算法，滚多快都不卡
 * - 动态行高（variable=true）→ 行高不固定时用「估算 + 缓存偏移 + 二分查找」
 *
 * 用法（固定）：
 *   <UiVirtualList :items="list" :row-height="48" class="h-[300px]">
 *     <template #default="{ item, index }">…</template>
 *   </UiVirtualList>
 *
 * 用法（动态）：
 *   <UiVirtualList :items="list" variable :estimated-row-height="80" class="h-[300px]">
 *     <template #default="{ item, index, measure }">
 *       <!-- 动态行必须在根节点 ref 绑到 measure，让组件读真实高度 -->
 *       <div :ref="measure">…变高内容…</div>
 *     </template>
 *   </UiVirtualList>
 *
 * 特性：
 * - overscan：上下多渲染 N 行，快速滚动不露白
 * - rAF 节流滚动驱动
 * - ResizeObserver 自适应容器尺寸 + 监听每个动态行实际高度
 * - 泛型组件：T 让 slot 的 item 有完整类型推导
 * - 适配深浅色主题（用 --ui-* 令牌）
 */
import { ref, computed, onMounted, onBeforeUnmount, useSlots, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 数据源数组 */
    items: T[]
    /** 固定模式：每行固定高度(px) */
    rowHeight?: number
    /** 动态模式：未测量行的估算高度(px)，用于起始滚动定位 */
    estimatedRowHeight?: number
    /** 动态模式开关：false=固定行高，true=动态行高 */
    variable?: boolean
    /** 视口上下额外多渲染的行数，防快速滚动露白 */
    overscan?: number
    /** 是否允许鼠标/触屏滚动 */
    scrollable?: boolean
  }>(),
  {
    rowHeight: 48,
    estimatedRowHeight: 64,
    variable: false,
    overscan: 3,
    scrollable: true,
  },
)

// ---------- 容器 & 滚动状态 ----------
const container = ref<HTMLElement | null>(null)
const viewportH = ref(0)
const scrollTop = ref(0)

// ---------- 动态行高：偏移缓存 ----------
// offsets[i] = 第 i 行的「顶部偏移」。offsets 比行数多 1，末项 = 总高度。
// 未测量的行用估算高度占位，测量后写入 heights 缓存并修正偏移。
let offsets: number[] = []
// 已实测行的真实高度缓存 index -> height
const heights = new Map<number, number>()

// 依据 heights（实测）+ 估算值重建偏移数组
function buildOffsets() {
  const est = props.estimatedRowHeight
  offsets = new Array(props.items.length + 1)
  offsets[0] = 0
  for (let i = 0; i < props.items.length; i++) {
    const h = heights.get(i) ?? est
    offsets[i + 1] = (offsets[i] ?? 0) + h
  }
}

// 首次初始化
buildOffsets()

/** 某行上报其真实渲染高度（通过 slot 的 measure ref 回调调用） */
function setActualHeight(index: number, height: number) {
  if (height <= 0 || index >= props.items.length) return
  const cur = heights.get(index) ?? props.estimatedRowHeight
  const delta = height - cur
  if (Math.abs(delta) < 0.5) {
    // 高度近似未变，但确保已入缓存
    if (!heights.has(index)) heights.set(index, height)
    return
  }
  heights.set(index, height)
  // 从 index 起修正后续偏移（该行 + 后面的行都平移 delta）
  for (let i = index; i < offsets.length; i++) {
    offsets[i] = (offsets[i] ?? 0) + delta
  }
  // 让组件重新计算
  bump.value++
}

// 数据变更时重建偏移缓存
watch(
  () => props.items,
  () => {
    heights.clear()
    buildOffsets()
    bump.value++
  },
)

// 触发重算的响应式计数
const bump = ref(0)

/** 总高度 = 动态模式读偏移缓存末项，固定模式读 items×rowHeight */
const totalH = computed(() => {
  // 依赖 bump：动态模式下 offsets 是普通数组，靠 bump 计数触发重算
  void bump.value
  return props.variable ? (offsets[props.items.length] ?? 0) : props.items.length * props.rowHeight
})

/** 二分查找：滚动位置 scrollTop 落在哪一行 */
function findIndex(scrollTop: number): number {
  if (offsets.length === 0) return 0
  // 二分找第一个 offsets[i] > scrollTop 的 i
  let lo = 0
  let hi = offsets.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((offsets[mid] ?? 0) <= scrollTop) lo = mid + 1
    else hi = mid
  }
  return Math.max(0, lo - 1)
}

/** 固定模式：O(1) 起始索引 */
const fixedStart = computed(() =>
  Math.max(0, Math.floor(scrollTop.value / props.rowHeight) - props.overscan),
)
/** 动态模式：二分起始索引 */
const varStart = computed(() => Math.max(0, findIndex(scrollTop.value) - props.overscan))

const startIndex = computed(() => (props.variable ? varStart.value : fixedStart.value))

/** 动态模式：从 startIndex 往后累加，直到超出可视区+overscan */
const endIndex = computed(() => {
  void bump.value
  if (!props.variable) {
    const count = Math.ceil(viewportH.value / props.rowHeight) + props.overscan * 2
    return Math.min(props.items.length, startIndex.value + count)
  }
  // 动态：从 startIndex 起，按偏移累加高度直到超过视口 + overscan 行
  const limit = scrollTop.value + viewportH.value
  let i = startIndex.value
  const max = props.items.length
  // 至少渲染 overscan 行
  let rendered = 0
  while (i < max && rendered < props.overscan) {
    i++
    rendered++
  }
  while (i < max && (offsets[i] ?? 0) < limit) i++
  return Math.min(max, i + props.overscan)
})

/** 顶占位：动态模式读 offsets[startIndex]，固定模式 startIndex×rowHeight */
const padTop = computed(() => {
  void bump.value
  return props.variable
    ? (offsets[startIndex.value] ?? 0)
    : startIndex.value * props.rowHeight
})
/** 底占位 = 总高 - 已渲染区域高度（padTop + 渲染行累计高度） */
const padBottom = computed(() => {
  void bump.value
  const top = padTop.value
  // 已渲染区域的底部 = endIndex 行的顶部偏移（固定模式 = endIndex×rowHeight）
  const renderedBottom = props.variable
    ? (offsets[endIndex.value] ?? 0)
    : endIndex.value * props.rowHeight
  return Math.max(0, totalH.value - renderedBottom)
})

/** 可视子集 */
const visibleItems = computed(() => {
  void bump.value
  return props.items.slice(startIndex.value, endIndex.value)
})

// ---------- 滚动驱动（rAF 节流） ----------
let ticking = false
function onScroll() {
  if (!container.value || ticking) return
  ticking = true
  requestAnimationFrame(() => {
    scrollTop.value = container.value?.scrollTop ?? 0
    ticking = false
  })
}

// ---------- 尺寸自适应 ----------
let ro: ResizeObserver | null = null
function measure() {
  viewportH.value = container.value?.clientHeight ?? 0
}
function observe() {
  if (container.value && typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => measure())
    ro.observe(container.value)
  }
}

onMounted(() => {
  measure()
  observe()
})
onBeforeUnmount(() => {
  ro?.disconnect()
  rowResizers.clear()
})

// ---------- 动态行高度测量（每个可见行一个 ResizeObserver） ----------
const rowResizers = new Map<number, ResizeObserver>()
// 生成给 slot 用的 measure ref 回调（curried：绑定行号）
// 参数用宽泛的 Vue ref 类型（Element | ComponentPublicInstance | null），兼容模板 :ref 绑定
function makeMeasure(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    // 只处理真实 DOM 元素（空 / 组件实例都不处理）
    if (!(el instanceof HTMLElement)) return
    const node = el as HTMLElement
    // 用 ResizeObserver 监听真实高度（比直接量一次更能响应内容变化）
    let resizer = rowResizers.get(index)
    if (!resizer && typeof ResizeObserver !== 'undefined') {
      resizer = new ResizeObserver(() => {
        setActualHeight(index, node.offsetHeight)
      })
      rowResizers.set(index, resizer)
    }
    resizer?.disconnect()
    resizer?.observe(node)
    // 立即上报一次初始高度
    setActualHeight(index, node.offsetHeight)
  }
}
// 清理：可见窗口变化后，清掉离开视口的行测量器（避免 Map 无限膨胀）
watch([startIndex, endIndex], ([s, e]) => {
  for (const key of [...rowResizers.keys()]) {
    if (key < s || key >= e) {
      rowResizers.get(key)?.disconnect()
      rowResizers.delete(key)
    }
  }
})

// 暴露
defineExpose({ refresh: measure })

// ---------- 插槽 ----------
const slots = useSlots()
const hasEmpty = !!slots.empty
</script>

<template>
  <div
    ref="container"
    class="ui-vlist"
    :class="{ 'is-scrollable': scrollable }"
    @scroll.passive="onScroll"
  >
    <!-- 顶占位 -->
    <div class="ui-vlist__pad" :style="{ height: padTop + 'px' }" aria-hidden="true" />
    <div
      class="ui-vlist__body"
      :style="{ transform: `translateY(${padTop}px)` }"
    >
      <div
        v-for="(item, i) in visibleItems"
        :key="startIndex + i"
        class="ui-vlist__row"
        :class="{ 'is-dynamic': variable }"
        :style="variable ? undefined : { height: rowHeight + 'px' }"
      >
        <!-- 动态模式把 measure ref 回调传给 slot，让用户绑到行根节点 -->
        <slot
          :item="item"
          :index="startIndex + i"
          :measure="variable ? makeMeasure(startIndex + i) : undefined"
        />
      </div>
    </div>
    <div class="ui-vlist__pad" :style="{ height: padBottom + 'px' }" aria-hidden="true" />
  </div>
</template>

<style scoped>
.ui-vlist {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.ui-vlist.is-scrollable {
  overflow-y: auto;
  overscroll-behavior: contain;
}
.ui-vlist__body {
  will-change: transform;
}
.ui-vlist__row {
  box-sizing: border-box;
}
</style>
