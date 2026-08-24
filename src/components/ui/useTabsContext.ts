// ============================================================
// UiTabs / UiTabPanel 共享上下文（作品㉙）
// ------------------------------------------------------------
// provide/inject 类型安全的契约：
//   UiTabs.provide()  →  子树 UiTabPanel.inject()
// 用 InjectionKey<symbol> 保证类型安全，避免字符串 key 拼错。
// 面板通过 active 是否等于自己的 name 决定显隐，
// 这样面板内容和标签彻底解耦——面板不需要知道 tabs 数组。
// ============================================================
import type { InjectionKey, Ref } from 'vue'

export interface TabsContext {
  /** 当前激活面板的 name */
  active: Ref<string | number | undefined>
  /** v-model 双向绑定更新（父组件可通过 @update:modelValue 拿到） */
  setActive: (name: string | number) => void
  /** 动画开关 */
  animated: Ref<boolean>
  /** 面板切换时同步触发（供 UiTabs emit change) */
  onChange: (name: string | number) => void
}

export const tabsContextKey: InjectionKey<TabsContext> = Symbol('ui-tabs')
