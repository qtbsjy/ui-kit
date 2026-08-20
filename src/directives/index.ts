// ============================================================
// 自定义指令统一出口（作品㉑ + ㉓ 进阶特性：指令集）
// ------------------------------------------------------------
// 学习重点:
//   1. 具名导出每个指令 —— 按需局部注册: directives: { vTooltip }
//   2. 默认导出 install —— 全局注册: app.use(UiDirectives) 或 app.directive()
//   3. install 里逐个注册, 支持 app.use 一键全装
// ------------------------------------------------------------
import type { App } from 'vue'
import { vAutoFocus } from './vAutoFocus'
import { vTooltip } from './vTooltip'
import { vLongPress } from './vLongPress'
import { vDebounce } from './vDebounce'
import { vClickOutside } from './vClickOutside'

export { vAutoFocus, vTooltip, vLongPress, vDebounce, vClickOutside }

// 默认导出 install —— 支持 app.use(UiDirectives) 全局注册
const UiDirectives = {
  install(app: App) {
    app.directive('tooltip', vTooltip)
    app.directive('auto-focus', vAutoFocus)
    app.directive('long-press', vLongPress)
    app.directive('debounce', vDebounce)
    app.directive('click-outside', vClickOutside)
  },
}

export default UiDirectives
