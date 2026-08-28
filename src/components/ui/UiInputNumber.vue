<script setup lang="ts">
// UiInputNumber —— 数字输入框（作品㉟）
// 学习重点:
//   1. defineModel<number | null> 数字双向绑定（支持 null 空态）
//   2. min/max/step 约束 + 失焦钳制（blur 回弹到合法范围）
//   3. 步进按钮 +/-：点击步进 + 长按加速（定时器加速）
//   4. 直接输入：数字/小数/负数解析，非法输入回退
//   5. 受控/非受控 + label/error/disabled + 前缀插槽
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    /** 错误信息（非空时显示红框+提示） */
    error?: string
    placeholder?: string
    disabled?: boolean
    /** 最小值（默认 -Infinity） */
    min?: number
    /** 最大值（默认 Infinity） */
    max?: number
    /** 步长（默认 1） */
    step?: number
    /** 是否允许输入小数（默认 false） */
    precision?: number
    /** 是否显示步进按钮（默认 true） */
    showControls?: boolean
  }>(),
  {
    label: '',
    error: '',
    placeholder: '',
    disabled: false,
    min: -Infinity,
    max: Infinity,
    step: 1,
    precision: 0,
    showControls: true,
  },
)

const emit = defineEmits<{
  /** 失焦提交（返回解析后的数字或 null） */
  (e: 'change', value: number | null): void
}>()

const model = defineModel<number | null>({ default: null })

// 文本态：与 model 同步，用户输入时临时持有
const text = ref(model.value === null ? '' : String(model.value))

watch(model, (v) => {
  // 外部变化同步文本（避免覆盖正在输入的半成品 —— 仅在非聚焦时同步）
  if (document.activeElement !== inputRef.value) {
    text.value = v === null ? '' : String(v)
  }
})

const inputRef = ref<HTMLInputElement | null>(null)

/** 把 value 钳制到 [min, max] 并按 precision 四舍五入 */
function clamp(v: number): number {
  let n = v
  if (props.precision > 0) {
    const k = 10 ** props.precision
    n = Math.round(n * k) / k
  }
  if (n < props.min) n = props.min
  if (n > props.max) n = props.max
  return n
}

/** 尝试把当前文本解析成合法数字并更新 model */
function commit() {
  const raw = text.value.trim()
  if (raw === '' || raw === '-' || raw === '.') {
    // 空/半成品 → 置 null
    model.value = null
    text.value = ''
    emit('change', null)
    return
  }
  const n = Number(raw)
  if (Number.isNaN(n)) {
    // 非法输入 → 回退到 model
    text.value = model.value === null ? '' : String(model.value)
    return
  }
  const c = clamp(n)
  model.value = c
  text.value = String(c)
}

function onBlur() {
  commit()
  emit('change', model.value)
}

function onInput(e: Event) {
  const el = e.target as HTMLInputElement
  text.value = el.value
}

// ---- 步进控制 + 长按加速 ----
let stepTimer: ReturnType<typeof setInterval> | null = null
let delayTimer: ReturnType<typeof setTimeout> | null = null
let stepCount = 0

/** 步进一次（dir: +1 / -1） */
function doStep(dir: 1 | -1) {
  const current = model.value ?? 0
  const next = clamp(current + dir * props.step)
  model.value = next
  text.value = String(next)
}

function stepUp() { doStep(1) }
function stepDown() { doStep(-1) }

function setupRepeat(fn: () => void) {
  fn()
  stepCount = 0
  // 首次延迟 400ms，之后每 80ms 一次（加速）
  delayTimer = setTimeout(() => {
    stepTimer = setInterval(() => {
      stepCount++
      // 加速：每 5 次步进多连发一次，最多 x5（整数连发数）
      const bursts = Math.min(Math.floor(stepCount / 5) + 1, 5)
      for (let i = 0; i < bursts; i++) fn()
    }, 80)
  }, 400)
}

function clearRepeat() {
  if (delayTimer) clearTimeout(delayTimer)
  if (stepTimer) clearInterval(stepTimer)
  delayTimer = null
  stepTimer = null
  stepCount = 0
}

const canUp = computed(() => !props.disabled && (model.value === null || model.value < props.max))
const canDown = computed(() => !props.disabled && (model.value === null || model.value > props.min))

// 组件卸载时清理定时器
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(clearRepeat)
</script>

<template>
  <label class="ui-input-number" :class="{ 'has-error': error, 'is-disabled': disabled }">
    <span v-if="label" class="ui-input-number__label">{{ label }}</span>
    <div class="ui-input-number__wrap">
      <span v-if="$slots.prefix" class="ui-input-number__prefix"><slot name="prefix" /></span>
      <input
        ref="inputRef"
        v-model="text"
        :placeholder="placeholder"
        :disabled="disabled"
        inputmode="decimal"
        autocomplete="off"
        class="ui-input-number__field"
        @input="onInput"
        @blur="onBlur"
        @keydown.enter.prevent="commit"
      />
      <div v-if="showControls" class="ui-input-number__controls">
        <button
          type="button"
          class="ui-input-number__btn"
          :disabled="!canUp"
          aria-label="增加"
          @mousedown.prevent="setupRepeat(stepUp)"
          @mouseup.prevent="clearRepeat"
          @mouseleave="clearRepeat"
        >▲</button>
        <button
          type="button"
          class="ui-input-number__btn"
          :disabled="!canDown"
          aria-label="减少"
          @mousedown.prevent="setupRepeat(stepDown)"
          @mouseup.prevent="clearRepeat"
          @mouseleave="clearRepeat"
        >▼</button>
      </div>
    </div>
    <span v-if="error" class="ui-input-number__error">⚠️ {{ error }}</span>
  </label>
</template>

<style scoped>
.ui-input-number { display: flex; flex-direction: column; gap: 6px; }
.ui-input-number__label { font-size: 13px; color: var(--ui-text-2); }
.ui-input-number__wrap { position: relative; display: flex; align-items: center; }
.ui-input-number__prefix { position: absolute; left: 12px; color: var(--ui-text-3); font-size: 14px; pointer-events: none; }
.ui-input-number__field {
  width: 100%; background: var(--ui-bg-soft); border: 1px solid var(--ui-border);
  border-radius: 8px; padding: 10px 12px; color: var(--ui-text-1); font-size: 14px;
  font-family: inherit; transition: border-color .2s;
}
.ui-input-number__prefix + .ui-input-number__field { padding-left: 34px; }
.ui-input-number__field:focus { outline: none; border-color: var(--ui-primary); }
.ui-input-number__field:disabled { opacity: .5; cursor: not-allowed; }
.ui-input-number.has-error .ui-input-number__field { border-color: var(--ui-danger); }
.ui-input-number__error { font-size: 12px; color: var(--ui-danger); }

/* 步进按钮 */
.ui-input-number__controls {
  display: flex; flex-direction: column; margin: 2px 4px 2px 0;
  border-left: 1px solid var(--ui-border); padding-left: 4px;
}
.ui-input-number__btn {
  width: 22px; height: 50%; min-height: 12px; border: none; background: transparent;
  color: var(--ui-text-3); font-size: 9px; cursor: pointer; line-height: 1;
  display: flex; align-items: center; justify-content: center;
  transition: color .15s, background .15s; border-radius: 4px;
}
.ui-input-number__btn:hover:not(:disabled) { color: var(--ui-primary); background: var(--ui-bg-soft); }
.ui-input-number__btn:disabled { opacity: .35; cursor: not-allowed; }
</style>
