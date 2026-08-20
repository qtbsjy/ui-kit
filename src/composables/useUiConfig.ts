// ============================================================
// useUiConfig —— 组件库全局配置（provide/inject 进阶特性）
// ------------------------------------------------------------
// 学习重点:
//   1. provide / inject —— 跨层级传递配置，无需逐层 props 透传
//   2. InjectionKey —— 类型安全的注入键（避免字符串拼错）
//   3. 默认值 + 浅合并 —— 子组件 inject 时提供兜底，未配置也能用
//   4. readonly —— 注入的配置对子组件只读，防止意外修改
//   5. 这与 useTheme 的"模块级单例"不同：useUiConfig 是"每棵组件树一份"，
//      由 <UiConfigProvider> 在局部 provide，支持不同子树不同配置
// ============================================================
import { inject, readonly, reactive, type InjectionKey } from 'vue'

/** 组件库可配置项（全局默认值） */
export interface UiConfig {
  /** tooltip 显示延迟（ms） */
  tooltipDelay: number
  /** tooltip 默认方向：top | bottom | left | right */
  tooltipPlacement: 'top' | 'bottom' | 'left' | 'right'
  /** 是否启用动画过渡 */
  animated: boolean
}

/** 默认配置：任何未提供 provide 的组件树都退回这套值 */
export const defaultUiConfig: UiConfig = {
  tooltipDelay: 300,
  tooltipPlacement: 'top',
  animated: true,
}

/** 类型安全的注入键 —— 组件库内部统一用这个 key 注入/读取 */
export const UiConfigKey: InjectionKey<Readonly<UiConfig>> = Symbol('ui-kit-config')

/** 在组件里读取全局配置（配合 <UiConfigProvider> 或直接给默认值） */
export function useUiConfig(): Readonly<UiConfig> {
  // inject 未命中(没包 Provider)时用默认配置 —— 保证任何地方调用都不报错
  const conf = inject(UiConfigKey, readonly(reactive({ ...defaultUiConfig })))
  return conf
}

/** 创建一个响应式配置实例（供 Provider 使用）—— 未指定用默认 */
export function createUiConfig(overrides: Partial<UiConfig> = {}): Readonly<UiConfig> {
  return readonly(reactive({ ...defaultUiConfig, ...overrides }))
}

