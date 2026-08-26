<script setup lang="ts">
// UiSlider —— 滑条（单值 / 双端 range）
// 学习重点:
//   1. defineModel<number> 单值; range 模式用 [number, number] 双端值
//   2. 基于【原生 input[type=range]】—— 键盘方向键/无障碍/触摸拖动白拿, 只做 CSS 美化和双 thumb 联动
//   3. 双端 range = 两个原生 range 叠加在同一轨道, 动态限制下/上限防交叉
//   4. 轨道填充用【独立 div】渲染（淡底 + 主色区）, 规避引擎差异（webkit runnable-track / moz 不同）
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 字段标签 */
    label?: string
    /** 最小值 */
    min?: number
    /** 最大值 */
    max?: number
    /** 步长 */
    step?: number
    /** 禁用 */
    disabled?: boolean
    /** 双端 range 模式（v-model:[number,number]） */
    range?: boolean
    /** 显示当前值 */
    showValue?: boolean
  }>(),
  {
    label: '',
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    range: false,
    showValue: false,
  },
)

// 受控双通道：range=false 用 number 单值；range=true 用双端数组
const model = defineModel<number | [number, number]>({ default: 0 })

const total = computed(() => props.max - props.min || 1)

// —— 内部双 thumb 状态（range 模式）——
const toArray = (): [number, number] =>
  typeof model.value === 'number'
    ? [model.value, model.value]
    : (model.value ?? [props.min, props.max]) as [number, number]
const [seedLo, seedHi] = toArray()
const lowerRef = ref(Number.isFinite(seedLo) ? seedLo : props.min)
const upperRef = ref(Number.isFinite(seedHi) ? seedHi : props.max)

// 外部分配 model 变化 → 同步内部 thumb（受控）
watch(
  () => model.value,
  (v) => {
    if (props.range && Array.isArray(v)) {
      lowerRef.value = v[0]
      upperRef.value = v[1]
    } else if (!props.range && typeof v === 'number') {
      lowerRef.value = v
    }
  },
)

// —— 单值输入 ——
function onSingleInput(e: Event) {
  model.value = Number((e.target as HTMLInputElement).value)
}

// —— 双端输入：动态限制不能越界（lower ≤ upper - step）——
function onLowerInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  lowerRef.value = Math.min(v, upperRef.value - nonZeroStep())
  emitRange()
}
function onUpperInput(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  upperRef.value = Math.max(v, lowerRef.value + nonZeroStep())
  emitRange()
}
function nonZeroStep() {
  return Math.max(props.step, 1)
}
function emitRange() {
  model.value = [lowerRef.value, upperRef.value] as [number, number]
}

// —— 展示值 ——
const displayValue = computed(() => {
  if (props.range) return `${lowerRef.value} - ${upperRef.value}`
  return String(lowerRef.value)
})

// —— 填充区几何（px 百分比）——
const singlePct = computed(() => {
  const v = Math.min(Math.max(lowerRef.value, props.min), props.max)
  return ((v - props.min) / total.value) * 100
})
const rangeLeft = computed(() => ((lowerRef.value - props.min) / total.value) * 100)
const rangeWidth = computed(() => ((upperRef.value - lowerRef.value) / total.value) * 100)
</script>

<template>
  <div class="ui-slider" :class="{ 'is-disabled': disabled }">
    <div v-if="label || showValue" class="ui-slider__head">
      <span v-if="label" class="ui-slider__label">{{ label }}</span>
      <span v-if="showValue" class="ui-slider__value">{{ displayValue }}</span>
    </div>

    <div class="ui-slider__track">
      <!-- 轨道底色 + 填充色（独立 div, 引擎无关） -->
      <div class="ui-slider__bar" />
      <div
        class="ui-slider__fill"
        :style="range
          ? { left: rangeLeft + '%', width: rangeWidth + '%' }
          : { left: 0, width: singlePct + '%' }"
      />

      <!-- 单值模式 -->
      <input
        v-if="!range"
        class="ui-slider__input"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :value="lowerRef"
        @input="onSingleInput"
      />

      <!-- 双端 range 模式：两个原生 range 叠加, 动态限制防交叉 -->
      <template v-else>
        <input
          class="ui-slider__input is-lower"
          type="range"
          :min="min"
          :max="upperRef"
          :step="step"
          :disabled="disabled"
          :value="lowerRef"
          :style="{ zIndex: 2 }"
          @input="onLowerInput"
        />
        <input
          class="ui-slider__input is-upper"
          type="range"
          :min="lowerRef"
          :max="max"
          :step="step"
          :disabled="disabled"
          :value="upperRef"
          :style="{ zIndex: 1 }"
          @input="onUpperInput"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.ui-slider { display: flex; flex-direction: column; gap: 8px; }
.ui-slider__head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ui-slider__label { font-size: 13px; color: var(--ui-text-2); }
.ui-slider__value { font-size: 12px; font-family: monospace; color: var(--ui-primary); background: var(--ui-primary-soft); padding: 2px 8px; border-radius: 6px; white-space: nowrap; }

.ui-slider__track { position: relative; height: 24px; display: flex; align-items: center; }
/* 轨道底（淡色） + 填充（主色） */
.ui-slider__bar { position: absolute; left: 0; right: 0; height: 6px; border-radius: 3px; background: var(--ui-border); }
.ui-slider__fill { position: absolute; height: 6px; border-radius: 3px; background: var(--ui-primary); pointer-events: none; }

/* 原生 range 基础重置（webkit + moz 双引擎） */
.ui-slider__input { -webkit-appearance: none; appearance: none; position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; background: transparent; cursor: pointer; }
.ui-slider__input:focus { outline: none; }
.ui-slider.is-disabled .ui-slider__input { cursor: not-allowed; opacity: .5; }
/* 关掉原生轨道（我们自绘 bar/fill） */
.ui-slider__input::-webkit-slider-runnable-track { height: 6px; background: transparent; }
.ui-slider__input::-moz-range-track { height: 6px; background: transparent; }
.ui-slider__input::-moz-range-progress { background: transparent; }

/* thumb —— 关键: 必须与 -webkit-slider-runnable-track 配合, 用 margin-top 垂直居中 */
.ui-slider__input::-webkit-slider-thumb {
  -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%;
  background: var(--ui-primary); border: 3px solid var(--ui-panel);
  box-shadow: 0 1px 4px rgba(0,0,0,.3); margin-top: -6px; transition: transform .15s, box-shadow .15s;
}
.ui-slider__input::-webkit-slider-thumb:hover { transform: scale(1.12); }
.ui-slider__input::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: var(--ui-primary); border: 3px solid var(--ui-panel); box-shadow: 0 1px 4px rgba(0,0,0,.3); transition: transform .15s; }
.ui-slider__input::-moz-range-thumb:hover { transform: scale(1.12); }
.ui-slider__input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--ui-primary-soft); }
.ui-slider__input:focus-visible::-moz-range-thumb { box-shadow: 0 0 0 3px var(--ui-primary-soft); }
</style>
