<script setup lang="ts">
// UiSteps —— 步骤条（作品㊴）
// 学习重点：
//   1. 状态机：当前步骤之前的都是「已完成」，当前步骤「进行中」，之后「等待」；任意步骤可被强制标成 error
//   2. 横向连接线用 CSS 伪元素 + 百分比定位，不依赖 flex-gap 计算（避免最后一个不画线的问题）
//   3. 纵向布局用独立结构（左侧竖线 + 内容区），不强行复用横向的 flex 布局
//   4. 可访问性：role=tablist? 不——步骤条用 ol/li 语义 + aria-current
import { computed, ref } from 'vue'

// ⚠️ <script setup> 不能运行时 export（编译期报错）→ 类型不 export，文档里描述即可。
// 需要类型的调用方可自行声明或在 dts 中生成。
interface StepItem {
  /** 标题 */
  title: string
  /** 描述文字 */
  description?: string
  /** 自定义图标（emoji / 字符），不传则用序号或对勾 */
  icon?: string
  /** 该步骤是否有错误（优先级最高） */
  status?: 'wait' | 'process' | 'finish' | 'error'
  /** 该步骤禁用（不可点击） */
  disabled?: boolean
  /** 该步骤附属文字（如耗时） */
  extra?: string
}

const props = withDefaults(
  defineProps<{
    /** 步骤数据 */
    items: StepItem[]
    /** 当前步骤索引（0 起），受控 */
    active?: number
    /** 非受控模式的初始步骤 */
    defaultActive?: number
    /** 方向 */
    direction?: 'horizontal' | 'vertical'
    /** 是否可点击切换（点击步骤 emit change） */
    clickable?: boolean
    /** 是否启用「点了就跳」的不受控模式 */
    simple?: boolean
    /** 尺寸 */
    size?: 'default' | 'small'
    /** 是否在完成步骤显示对勾 */
    showCheck?: boolean
    /** 已完成步骤的主色（不传用主题主色） */
    finishColor?: string
    /** 错误步骤的颜色 */
    errorColor?: string
  }>(),
  {
    active: undefined,
    defaultActive: 0,
    direction: 'horizontal',
    clickable: false,
    simple: false,
    size: 'default',
    showCheck: true,
    finishColor: undefined,
    errorColor: undefined,
  },
)

const emit = defineEmits<{
  /** 点击步骤（clickable 时）；受控模式下父级据此改 active */
  'change': [index: number, item: StepItem]
  /** 受控 update */
  'update:active': [index: number]
}>()

// ---------- 内部激活索引（受控 / 非受控双模式） ----------
const internalActive = ref(props.defaultActive)

const isControlled = computed(() => props.active !== undefined)
const currentIndex = computed(() => (isControlled.value ? (props.active as number) : internalActive.value))

// ---------- 每个步骤的最终状态 ----------
type StepStatus = 'wait' | 'process' | 'finish' | 'error'

const statuses = computed<StepStatus[]>(() =>
  props.items.map((item, i) => {
    // 显式指定 error > 其它显式指定 > 按位置推算
    if (item.status === 'error') return 'error'
    if (item.status && item.status !== 'wait') return item.status
    if (i < currentIndex.value) return 'finish'
    if (i === currentIndex.value) return 'process'
    return 'wait'
  }),
)

/** 连接线的状态：某步之后的线，在「该步已完成/错误」时点亮 */
const lineFinished = computed<boolean[]>(() =>
  statuses.value.map((s) => s === 'finish' || s === 'error'),
)

// ---------- 点击 ----------
function onStepClick(index: number, item: StepItem) {
  if (!props.clickable || item.disabled) return
  if (index === currentIndex.value) return
  emit('change', index, item)
  emit('update:active', index)
  if (!isControlled.value) {
    // 受控模式下不本地改，等父级回传 active
    internalActive.value = index
  }
}

// ---------- 图标 / 序号渲染 ----------
function stepMarker(status: StepStatus, index: number, item: StepItem): string {
  if (item.icon) return item.icon
  if (status === 'error') return '✕'
  if (status === 'finish' && props.showCheck) return '✓'
  return String(index + 1)
}

const rootClass = computed(() => [
  'ui-steps',
  `ui-steps--${props.direction}`,
  {
    'ui-steps--small': props.size === 'small',
    'ui-steps--clickable': props.clickable,
    'ui-steps--simple': props.simple,
  },
])

// 样式变量
const rootStyle = computed(() => {
  const s: Record<string, string> = {}
  if (props.finishColor) s['--ui-steps-finish'] = props.finishColor
  if (props.errorColor) s['--ui-steps-error'] = props.errorColor
  return s
})
</script>

<template>
  <ol :class="rootClass" :style="rootStyle">
    <li
      v-for="(item, index) in items"
      :key="index"
      class="ui-steps__item"
      :class="[
        `is-${statuses[index]}`,
        { 'is-clickable': clickable && !item.disabled, 'is-disabled': item.disabled },
      ]"
      :aria-current="statuses[index] === 'process' ? 'step' : undefined"
      @click="onStepClick(index, item)"
    >
      <!-- 图标圆点 -->
      <span class="ui-steps__marker" :class="`is-${statuses[index]}`">
        <span class="ui-steps__marker-inner">{{ stepMarker(statuses[index]!, index, item) }}</span>
      </span>

      <!-- 连接线（最后一个不画） -->
      <span
        v-if="index < items.length - 1"
        class="ui-steps__line"
        :class="{ 'is-finish': lineFinished[index] }"
      ></span>

      <!-- 文本区 -->
      <span class="ui-steps__content">
        <span class="ui-steps__title">
          {{ item.title }}
          <span v-if="item.extra" class="ui-steps__extra">{{ item.extra }}</span>
        </span>
        <span v-if="item.description" class="ui-steps__desc">{{ item.description }}</span>
      </span>
    </li>
  </ol>
</template>

<style scoped>
.ui-steps {
  --ui-steps-finish: var(--ui-primary);
  --ui-steps-error: var(--ui-danger, #ef4444);
  --ui-steps-dot: 28px;
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.ui-steps--small {
  --ui-steps-dot: 20px;
}

/* ================= 横向 ================= */
.ui-steps--horizontal .ui-steps__item {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 圆点 */
.ui-steps--horizontal .ui-steps__marker {
  position: relative;
  z-index: 1;
  width: var(--ui-steps-dot);
  height: var(--ui-steps-dot);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  background: var(--ui-bg);
  border: 2px solid var(--ui-border);
  color: var(--ui-text-3);
  transition: all .25s ease;
  flex-shrink: 0;
}

/* 连接线：从圆点右侧一直延伸到下一个圆点左侧 */
.ui-steps--horizontal .ui-steps__line {
  position: absolute;
  top: calc(var(--ui-steps-dot) / 2 - 1px);
  left: calc(var(--ui-steps-dot) + 8px);
  right: 8px;
  height: 2px;
  background: var(--ui-border);
  transition: background .25s ease;
}

.ui-steps--horizontal .ui-steps__content {
  margin-top: 10px;
  padding-right: 12px;
  min-width: 0;
}

/* ================= 纵向 ================= */
.ui-steps--vertical {
  flex-direction: column;
}

.ui-steps--vertical .ui-steps__item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
  min-height: 40px;
}

.ui-steps--vertical .ui-steps__item:last-child {
  padding-bottom: 0;
}

/* 纵向的竖线：从圆点底部延伸到下一个圆点顶部 */
.ui-steps--vertical .ui-steps__line {
  position: absolute;
  left: calc(var(--ui-steps-dot) / 2 - 1px);
  top: calc(var(--ui-steps-dot) + 4px);
  bottom: 4px;
  width: 2px;
  background: var(--ui-border);
  transition: background .25s ease;
}

.ui-steps--vertical .ui-steps__content {
  padding-top: 2px;
  min-width: 0;
}

/* ================= 共用 ================= */
.ui-steps__marker-inner {
  display: block;
  line-height: 1;
}

.ui-steps__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ui-steps__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text-2);
  transition: color .25s ease;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.ui-steps--small .ui-steps__title {
  font-size: 13px;
}

.ui-steps__extra {
  font-size: 12px;
  font-weight: 400;
  color: var(--ui-text-3);
}

.ui-steps__desc {
  font-size: 12px;
  color: var(--ui-text-3);
  line-height: 1.5;
}

/* ---------- 状态：已完成 ---------- */
.ui-steps__item.is-finish .ui-steps__marker {
  border-color: var(--ui-steps-finish);
  background: var(--ui-steps-finish);
  color: #fff;
}

.ui-steps__item.is-finish .ui-steps__line.is-finish {
  background: var(--ui-steps-finish);
}

.ui-steps__item.is-finish .ui-steps__title {
  color: var(--ui-text-1);
}

/* ---------- 状态：进行中 ---------- */
.ui-steps__item.is-process .ui-steps__marker {
  border-color: var(--ui-steps-finish);
  color: var(--ui-steps-finish);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--ui-steps-finish) 15%, transparent);
}

.ui-steps__item.is-process .ui-steps__title {
  color: var(--ui-text-1);
  font-weight: 600;
}

/* ---------- 状态：错误 ---------- */
.ui-steps__item.is-error .ui-steps__marker {
  border-color: var(--ui-steps-error);
  background: var(--ui-steps-error);
  color: #fff;
}

.ui-steps__item.is-error .ui-steps__title {
  color: var(--ui-steps-error);
}

.ui-steps__item.is-error .ui-steps__line.is-finish {
  background: var(--ui-steps-error);
}

/* ---------- 可点击 ---------- */
.ui-steps--clickable .ui-steps__item.is-clickable {
  cursor: pointer;
}

.ui-steps--clickable .ui-steps__item.is-clickable:hover .ui-steps__marker {
  border-color: var(--ui-steps-finish);
  color: var(--ui-steps-finish);
  transform: scale(1.08);
}

.ui-steps--clickable .ui-steps__item.is-clickable:hover .ui-steps__title {
  color: var(--ui-text-1);
}

.ui-steps__item.is-disabled {
  cursor: not-allowed;
  opacity: .5;
}

/* ---------- 简洁模式（simple）：只显示圆点+标题，无描述 ---------- */
.ui-steps--simple .ui-steps__desc {
  display: none;
}
</style>
