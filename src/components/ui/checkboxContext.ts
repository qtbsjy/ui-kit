// UiCheckbox / UiCheckboxGroup 共享的组上下文类型与 InjectionKey
// 抽出到独立 .ts：<script setup> 不允许运行时 export，Key 必须给 Group 组件 provide
import type { InjectionKey, Ref } from 'vue'

export interface CheckboxGroupContext {
  modelValue: Ref<(string | number | boolean)[]>
  toggleValue: (v: string | number | boolean) => void
  isChecked: (v: string | number | boolean) => boolean
  disabled?: boolean
}
export const CheckboxGroupKey: InjectionKey<CheckboxGroupContext> = Symbol('UiCheckboxGroup')
