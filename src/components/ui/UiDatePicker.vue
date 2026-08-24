<script setup lang="ts">
// UiDatePicker —— 日期选择器（作品㉘）
// 学习重点:
//   1. defineModel 绑定 YYYY-MM-DD 字符串（受控）
//   2. 日历网格算法：年月切换 + 闰年 + 当月天数 + 上月/下月补位
//   3. 弹层面板 + v-click-outside 点外关闭（复用作品㉓ 指令）
//   4. 输入框手动输入 + 日历选择双通道，双向同步
//   5. 快捷选项（今天/昨天）+ 禁用日期 + 今天高亮 + 无障碍
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// ---------- Props ----------
const props = withDefaults(
  defineProps<{
    label?: string
    placeholder?: string
    disabled?: boolean
    error?: string
    /** 允许选择的最早日期 YYYY-MM-DD */
    min?: string
    /** 允许选择的最晚日期 YYYY-MM-DD */
    max?: string
    /** 显示快捷选项（今天/昨天） */
    showShortcuts?: boolean
  }>(),
  {
    label: '',
    placeholder: '选择日期',
    disabled: false,
    error: '',
    min: '',
    max: '',
    showShortcuts: false,
  },
)

const model = defineModel<string>({ default: '' })

// ---------- 日历状态 ----------
const open = ref(false)
// 当前展示的年/月（初始化为 model 的日期或今天）
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth()) // 0-11
// 当前高亮的日期（悬停/键盘），用于取消选中
const hovered = ref<Date | null>(null)

// 当前显示日期的字符串（输入框 / 日历联动）
const displayDate = ref(model.value)

// ---------- 工具函数 ----------
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

/** Date 转 YYYY-MM-DD */
function fmt(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 是否是闰年 */
function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
}

/** 某月天数 */
function daysInMonth(y: number, m: number): number {
  // 2月特殊处理，其余固定
  const dm = [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  return dm[m]!  // noUncheckedIndexedAccess: 数组索引返回 number|undefined, 但 m∈[0,11] 恒合法
}

/** 解析 YYYY-MM-DD 为 Date（本地时区，避免 UTC 偏移） */
function parse(s: string): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = +m[1]!, mo = +m[2]! - 1, d = +m[3]!
  const dt = new Date(y, mo, d)
  // 校验是否合法日期（如 2024-02-31 会溢出）
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null
  return dt
}

/** 比较两个日期字符串，返回 -1/0/1 */
function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

// ---------- 日历网格 ----------
// 返回 42 个格子（6 行 × 7 列），每格为 Date 或 null（补位）
const calendarCells = computed<(Date | null)[]>(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  // 当月第一天是星期几（0=周日）
  const startWeekday = first.getDay()
  const total = daysInMonth(viewYear.value, viewMonth.value)
  const cells: (Date | null)[] = []
  // 上月补位
  const prevTotal = daysInMonth(viewYear.value, viewMonth.value - 1 < 0 ? 11 : viewMonth.value - 1)
  const prevYear = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value
  const prevMonth = (viewMonth.value + 11) % 12
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push(new Date(prevYear, prevMonth, prevTotal - i))
  }
  // 当月
  for (let d = 1; d <= total; d++) {
    cells.push(new Date(viewYear.value, viewMonth.value, d))
  }
  // 下月补位（补到 42 格）
  const nextYear = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value
  const nextMonth = (viewMonth.value + 1) % 12
  let remaining = 42 - cells.length
  for (let i = 1; i <= remaining; i++) {
    cells.push(new Date(nextYear, nextMonth, i))
  }
  return cells
})

// ---------- 日期判断 ----------
const todayStr = computed(() => fmt(new Date()))
const isToday = (d: Date) => fmt(d) === todayStr.value
const isSelected = (d: Date) => !!model.value && fmt(d) === model.value
const isHovered = (d: Date) => !!hovered.value && fmt(d) === fmt(hovered.value)
// 是否在日历某一格里（当前 view 月）
const inMonth = (d: Date) => d.getFullYear() === viewYear.value && d.getMonth() === viewMonth.value
// 禁用判断
function isDisabled(d: Date): boolean {
  const s = fmt(d)
  if (props.min && cmp(s, props.min) < 0) return true
  if (props.max && cmp(s, props.max) > 0) return true
  return false
}

// 修正：需要访问 props —— 用 defineProps 返回值
// ---------- 选择逻辑 ----------
function select(d: Date) {
  if (isDisabled(d)) return
  model.value = fmt(d)
  displayDate.value = fmt(d)
  open.value = false
  hovered.value = null
}

function selectString(s: string) {
  // 输入框手动输入，无非法才更新
  const dt = parse(s)
  // 合法则更新 model；非法保留输入框文字但不污染 model（由 error 呈现）
  if (dt && !isDisabled(dt)) model.value = s
}

// 快捷选项
function quick(t: 'today' | 'yesterday') {
  const d = new Date()
  if (t === 'yesterday') d.setDate(d.getDate() - 1)
  select(d)
}

// 年月切换
function prevMonth() {
  viewMonth.value--
  if (viewMonth.value < 0) { viewMonth.value = 11; viewYear.value-- }
}
function nextMonth() {
  viewMonth.value++
  if (viewMonth.value > 11) { viewMonth.value = 0; viewYear.value++ }
}
function goToday() {
  const t = new Date()
  viewYear.value = t.getFullYear()
  viewMonth.value = t.getMonth()
}

// 打开时把视图定位到 model 日期
function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    const dt = parse(model.value) ?? new Date()
    viewYear.value = dt.getFullYear()
    viewMonth.value = dt.getMonth()
  }
}

// model 外部变化同步显示
watch(model, (v) => { displayDate.value = v })

defineExpose({ open, close: () => (open.value = false) })
</script>

<template>
  <div class="ui-datepicker" v-click-outside="() => (open = false)">
    <label class="ui-datepicker__label" v-if="label">
      <span>{{ label }}</span>
    </label>
    <!-- 输入框（可手动输入） + 日历图标 -->
    <div class="ui-datepicker__wrap" :class="{ 'has-error': error }">
      <input
        class="ui-datepicker__input"
        :value="displayDate"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="selectString(($event.target as HTMLInputElement).value)"
        @focus="() => { if (!disabled) open = true }"
      />
      <span class="ui-datepicker__icon" @click="toggleOpen" role="button" aria-label="打开日期选择">📅</span>
    </div>
    <span v-if="error" class="ui-datepicker__error">⚠️ {{ error }}</span>

    <!-- 日历弹层 -->
    <transition name="dp">
      <div v-if="open" class="ui-datepicker__panel">
        <!-- header: 年月切换 -->
        <div class="dp-header">
          <button class="dp-nav" type="button" @click="prevMonth" aria-label="上个月">‹</button>
          <span class="dp-title">{{ viewYear }}年{{ viewMonth + 1 }}月</span>
          <button class="dp-nav" type="button" @click="nextMonth" aria-label="下个月">›</button>
        </div>

        <!-- 星期表头 -->
        <div class="dp-week">
          <span v-for="w in WEEKDAYS" :key="w" class="dp-week__cell">{{ w }}</span>
        </div>

        <!-- 日期网格: 42 格 -->
        <div class="dp-grid">
          <button
            v-for="(cell, i) in calendarCells"
            :key="i"
            type="button"
            class="dp-cell"
            :class="{
              'is-out': !cell || !inMonth(cell),
              'is-today': cell && isToday(cell),
              'is-selected': cell && isSelected(cell),
              'is-hovered': cell && isHovered(cell),
              'is-disabled': cell && isDisabled(cell),
            }"
            :disabled="!cell || isDisabled(cell)"
            @click="cell && select(cell)"
            @mouseenter="cell && (hovered = cell)"
            @mouseleave="hovered = null"
          >
            {{ cell?.getDate() }}
          </button>
        </div>

        <!-- footer: 今天 + 快捷 -->
        <div class="dp-footer">
          <button class="dp-today" type="button" @click="goToday(); select(new Date())">今天</button>
          <div v-if="showShortcuts" class="dp-shortcuts">
            <button type="button" @click="quick('yesterday')">昨天</button>
          </div>
          <button class="dp-clear" type="button" @click="model = ''; displayDate = ''; open = false">清空</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.ui-datepicker { position: relative; display: flex; flex-direction: column; gap: 6px; }
.ui-datepicker__label { font-size: 13px; color: var(--ui-text-2); }
.ui-datepicker__wrap { position: relative; display: flex; align-items: center; }
.ui-datepicker__input {
  width: 100%; background: var(--ui-bg-soft); border: 1px solid var(--ui-border);
  border-radius: 8px; padding: 10px 38px 10px 12px; color: var(--ui-text-1); font-size: 14px;
  font-family: inherit; transition: border-color .2s;
}
.ui-datepicker__input:focus { outline: none; border-color: var(--ui-primary); }
.ui-datepicker__input:disabled { opacity: .5; cursor: not-allowed; }
.ui-datepicker__icon {
  position: absolute; right: 10px; cursor: pointer; font-size: 16px; line-height: 1;
  user-select: none;
}
.ui-datepicker__error { font-size: 12px; color: var(--ui-danger); }
.ui-datepicker.has-error .ui-datepicker__input { border-color: var(--ui-danger); }

/* 弹层 */
.ui-datepicker__panel {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 20;
  width: 288px; padding: 12px; background: var(--ui-panel);
  border: 1px solid var(--ui-border); border-radius: 10px; box-shadow: var(--ui-shadow-lg);
}
.dp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.dp-title { font-size: 14px; font-weight: 600; color: var(--ui-text-1); }
.dp-nav {
  width: 26px; height: 26px; border: none; border-radius: 6px; background: var(--ui-hover);
  color: var(--ui-text-1); cursor: pointer; font-size: 16px; line-height: 1;
}
.dp-nav:hover { background: var(--ui-primary-soft); }
.dp-week { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px; }
.dp-week__cell { text-align: center; font-size: 12px; color: var(--ui-text-3); padding: 4px 0; }
.dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
.dp-cell {
  height: 30px; border: none; border-radius: 6px; background: transparent;
  font-size: 13px; color: var(--ui-text-1); cursor: pointer; transition: background .15s, color .15s;
}
.dp-cell:hover:not(:disabled) { background: var(--ui-hover); }
.dp-cell.is-out { color: var(--ui-text-3); opacity: .6; }
.dp-cell.is-today { font-weight: 700; color: var(--ui-primary); }
.dp-cell.is-selected { background: var(--ui-primary); color: #fff; font-weight: 600; }
.dp-cell.is-selected:hover { background: var(--ui-primary-hover); }
.dp-cell.is-hovered:not(.is-selected) { background: var(--ui-primary-soft); }
.dp-cell.is-disabled { opacity: .4; cursor: not-allowed; }
.dp-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--ui-divider); }
.dp-today, .dp-clear, .dp-shortcuts button {
  border: none; background: none; color: var(--ui-primary); font-size: 12px; cursor: pointer; padding: 2px 6px; border-radius: 4px;
}
.dp-today:hover, .dp-clear:hover, .dp-shortcuts button:hover { background: var(--ui-primary-soft); }
.dp-clear { color: var(--ui-danger); }

/* 过渡动画 */
.dp-enter-active, .dp-leave-active { transition: opacity .15s, transform .15s; }
.dp-enter-from, .dp-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
