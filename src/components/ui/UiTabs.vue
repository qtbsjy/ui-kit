<script setup lang="ts">
// UiTabs —— 标签页（作品㉙ · UiKit 第21个组件）
// ------------------------------------------------------------
// 核心设计：
//   1. 双通道激活态 —— v-model 受控（modelValue + update:modelValue）
//      + defaultActive 非受控初始值（内部 ref 兜底）
//   2. 标签 vs 面板解耦 —— Tabs 只管 tabs 数组 + 标签条渲染；
//      面板 UiTabPanel 用 inject 拿到 active 自动联动显隐
//   3. 键盘无障碍 —— role=tablist/tab/tabpanel + 方向键切换 +
//      Home/End 到头尾 + aria-selected + 激活自动获得焦点(tabindex)
//   4. 两种风格 —— line(下划线滑动指示器) / card(卡片)
//   5. 懒挂载 + 动画 —— panel 可 lazy，切换带淡入淡出过渡
import { computed, nextTick, provide, ref, watch } from 'vue'
import { tabsContextKey, type TabsContext } from './useTabsContext'

export interface UiTabItem {
  label: string
  value: string | number
  disabled?: boolean
  /** 单个 tab 是否可关闭（优先于全局 closable） */
  closable?: boolean
}

const props = withDefaults(
  defineProps<{
    /** tabs 数据驱动 */
    tabs: UiTabItem[]
    /** v-model 当前激活 value（受控） */
    modelValue?: string | number
    /** 非受控：初始激活的 value（不传 modelValue 时生效） */
    defaultActive?: string | number
    /** 样式变体 */
    type?: 'line' | 'card'
    /** 面板切换动画开关 */
    animated?: boolean
    /** 是否显示关闭按钮（可配合单 tab closable 字段） */
    closable?: boolean
  }>(),
  {
    modelValue: undefined,
    defaultActive: undefined,
    type: 'line',
    animated: true,
    closable: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
  /** 点击 tab 关闭按钮时触发（父组件负责删掉该 tab） */
  (e: 'close', value: string | number): void
}>()

// —— 激活态：受控优先，否则用内部 ref ——
const internalActive = ref<string | number | undefined>(props.defaultActive ?? props.tabs[0]?.value)
const isControlled = computed(() => props.modelValue !== undefined)
const active = computed<string | number | undefined>(() =>
  isControlled.value ? (props.modelValue as string | number) : internalActive.value,
)

function select(name: string | number) {
  const tab = props.tabs.find((t) => t.value === name)
  if (tab?.disabled) return
  if (isControlled.value) {
    emit('update:modelValue', name)
    emit('change', name)
  } else {
    internalActive.value = name
    emit('change', name)
  }
}

// —— 关闭 tab：仅 emit close（删 tab 由父组件负责，保持数据单向）
// 若关闭的是当前激活项，自动切到相邻 tab（右优先，否则靠左）
function handleClose(name: string | number) {
  const idx = props.tabs.findIndex((t) => t.value === name)
  // 关闭的是当前激活项 → 先切到相邻项，避免激活一个已不存在的 tab
  if (active.value === name) {
    const next =
      props.tabs[idx + 1] ?? props.tabs[idx - 1]
    if (next && !next.disabled) select(next.value)
    else {
      // 相邻项都没有，找任意一个非禁用
      const any = props.tabs.find((t) => !t.disabled && t.value !== name)
      if (any) select(any.value)
      else if (!isControlled.value) internalActive.value = undefined
    }
  }
  emit('close', name)
}

// —— 动态增删校准：tabs 变化后若当前 active 已不存在，回退到第一个可用 tab
watch(
  () => props.tabs.map((t) => t.value).join('|'),
  () => {
    const exists = props.tabs.some((t) => t.value === active.value)
    if (!exists) {
      const first = props.tabs.find((t) => !t.disabled)
      if (first) select(first.value)
      else if (!isControlled.value) internalActive.value = undefined
    }
  },
)

// —— provide 给 UiTabPanel ——
const ctx: TabsContext = {
  active,
  setActive: select,
  animated: computed(() => !!props.animated),
  onChange: (name) => emit('change', name),
}
provide(tabsContextKey, ctx)

// —— 键盘导航：方向键切换、Home/End 到头尾、焦点跟随 ——
function onKeydown(e: KeyboardEvent, index: number) {
  const len = props.tabs.length
  let next = -1
  if (e.key === 'ArrowRight') next = (index + 1) % len
  else if (e.key === 'ArrowLeft') next = (index - 1 + len) % len
  else if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = len - 1
  if (next === -1) return

  e.preventDefault()
  // 跳过禁用的 tab（环形找下一个可用）
  let i = next
  let guard = 0
  while (props.tabs[i]?.disabled && guard < len) {
    i = (i + 1) % len
    guard++
  }
  const target = props.tabs[i]
  if (target) {
    select(target.value)
    // 焦点跟随：等布局重渲染后，直接按 aria-selected 定位激活 tab
    nextTick(() => {
      barEl.value
        ?.querySelector<HTMLElement>('.ui-tabs__tab[aria-selected="true"]')
        ?.focus()
    })
  }
}

// —— line 风格下划线指示器：跟踪激活 tab 的位置 ——
const barEl = ref<HTMLElement | null>(null)
const indicator = ref({ left: 0, width: 0, visible: false })

function updateIndicator() {
  const bar = barEl.value
  if (!bar || props.type !== 'line') return
  const el = bar.querySelector<HTMLElement>('.ui-tabs__tab.is-active')
  if (!el) return
  indicator.value = {
    left: el.offsetLeft,
    width: el.offsetWidth,
    visible: true,
  }
}

// 激活项变化后，等 DOM 布局完成再测位置
watch(
  active,
  () => nextTick(updateIndicator),
  { immediate: true },
)
// 挂载后 / 尺寸变化时刷新（matchMedia 断点会改宽度）
watch([barEl], () => nextTick(updateIndicator))

// 受控时 defaultActive 变化也同步（供 wrapper 重置）
watch(
  () => props.defaultActive,
  (v) => {
    if (v !== undefined) internalActive.value = v
  },
)
</script>

<template>
  <div class="ui-tabs" :class="{ 'is-card': type === 'card' }">
    <div ref="barEl" class="ui-tabs__bar" role="tablist" aria-label="tabs">
      <button
        v-for="(tab, i) in tabs"
        :id="`ui-tab-${String(tab.value)}`"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="active === tab.value"
        :aria-controls="`ui-tabpanel-${String(tab.value)}`"
        :tabindex="active === tab.value ? 0 : -1"
        class="ui-tabs__tab"
        :class="{
          'is-active': active === tab.value,
          'is-disabled': tab.disabled,
          'is-closable': closable || tab.closable,
        }"
        :disabled="tab.disabled"
        @click="select(tab.value)"
        @keydown="onKeydown($event, i)"
      >
        {{ tab.label }}
        <!-- 关闭按钮：仅 closable 时显示，点击停止冒泡避免误切 tab -->
        <span
          v-if="closable || tab.closable"
          class="ui-tabs__close"
          role="button"
          :aria-label="`关闭 ${tab.label}`"
          :tabindex="active === tab.value ? 0 : -1"
          @click.stop="handleClose(tab.value)"
          @keydown.enter.stop.prevent="handleClose(tab.value)"
          @keydown.space.stop.prevent="handleClose(tab.value)"
          >✕</span
        >
      </button>
      <!-- line 风格：滑动下划线指示器 -->
      <span
        v-if="type === 'line'"
        class="ui-tabs__indicator"
        :class="{ 'is-visible': indicator.visible }"
        :style="{
          transform: `translateX(${indicator.left}px)`,
          width: `${indicator.width}px`,
        }"
      ></span>
    </div>

    <!-- 面板区：默认插槽放 UiTabPanel -->
    <div class="ui-tabs__panels">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.ui-tabs {
  --ui-space: 16px;
  width: 100%;
}

/* ---- 标签条 ---- */
.ui-tabs__bar {
  position: relative;
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--ui-border);
}
.ui-tabs__tab {
  position: relative;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--ui-text-2);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  transition: color .18s ease, background .18s ease;
  font-family: inherit;
}
.ui-tabs__tab:hover:not(.is-disabled) { color: var(--ui-text-1); }
.ui-tabs__tab.is-active { color: var(--ui-primary); }
.ui-tabs__tab.is-disabled { color: var(--ui-border); cursor: not-allowed; }
.ui-tabs__tab:focus-visible {
  box-shadow: 0 0 0 2px var(--ui-primary);
  border-radius: 6px;
}

/* ---- 关闭按钮 ---- */
.ui-tabs__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 6px;
  border-radius: 50%;
  font-size: 11px;
  line-height: 1;
  color: var(--ui-text-3);
  cursor: pointer;
  transition: background .15s ease, color .15s ease;
  vertical-align: middle;
}
.ui-tabs__close:hover {
  background: var(--ui-hover);
  color: var(--ui-text-1);
}
.ui-tabs__close:focus-visible {
  box-shadow: 0 0 0 2px var(--ui-primary);
}
.ui-tabs__tab.is-closable { padding-right: 10px; }

/* ---- line 下划线指示器 ---- */
.ui-tabs__indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--ui-primary);
  opacity: 0;
  transition: transform .22s cubic-bezier(.4,0,.2,1),
              width .22s cubic-bezier(.4,0,.2,1),
              opacity .18s ease;
  border-radius: 2px 2px 0 0;
}
.ui-tabs__indicator.is-visible { opacity: 1; }

/* ---- card 卡片风格 ---- */
.ui-tabs.is-card .ui-tabs__bar {
  border-bottom: none;
  gap: 6px;
}
.ui-tabs.is-card .ui-tabs__tab {
  border: 1px solid var(--ui-border);
  border-radius: 8px 8px 0 0;
  background: transparent;
}
.ui-tabs.is-card .ui-tabs__tab.is-active {
  background: var(--ui-bg);
  border-color: var(--ui-border);
  border-bottom-color: var(--ui-bg);
  color: var(--ui-primary);
  margin-bottom: -1px;
}

/* ---- 面板区 ---- */
.ui-tabs__panels {
  padding-top: 4px;
}
</style>
