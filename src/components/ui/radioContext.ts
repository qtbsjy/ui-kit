// UiRadio / UiRadioGroup 共享的组上下文类型与 InjectionKey
// 抽出到独立 .ts：<script setup> 不允许运行时 export，Key 必须给 Group 组件 provide
import type { InjectionKey, Ref } from 'vue'

export interface RadioGroupContext {
  modelValue: Ref<string | number | boolean>
  selectValue: (v: string | number | boolean) => void
  disabled?: boolean
  name?: string
}
export const RadioGroupKey: InjectionKey<RadioGroupContext> = Symbol('UiRadioGroup')
