// ============================================================
// vAutoFocus —— 自动聚焦自定义指令（作品㉑ 进阶特性：自定义指令）
// ------------------------------------------------------------
// 用法:
//   <input v-auto-focus />                    ← 挂载后自动聚焦
//   <input v-auto-focus="false" />            ← 传 false 关闭
// ------------------------------------------------------------
// 学习重点:
//   1. mounted 生命周期里调用 el.focus() —— 元素已插入 DOM
//   2. nextTick —— 等当前渲染批次完成后再聚焦（配合 v-if/弹窗打开时机）
//   3. binding.value —— 支持条件化: 传 false 则不聚焦
//   4. 增强版: 聚焦时高亮选中(select), 常用于输入框自动全选
// ============================================================
import { nextTick, type Directive } from 'vue'

export const vAutoFocus: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, binding) {
    // value 为 false 时不聚焦
    if (binding.value === false) return
    // 等 DOM 完成更新（若元素是 v-if 刚渲染的，需等一帧）
    nextTick(() => {
      if (typeof el.focus === 'function') {
        el.focus()
        // 对文本输入类元素, 自动全选内容（提升重复输入体验）
        if (binding.modifiers.select && 'select' in el) {
          ;(el as HTMLInputElement).select()
        }
      }
    })
  },
  updated(el, binding) {
    // 值从 false → true/undefined 时重新聚焦
    if (binding.value === true && el !== document.activeElement) {
      nextTick(() => el.focus())
    }
  },
}

export default vAutoFocus
