// UI 组件库统一出口
// 学习重点:
//   1. 具名导出每个组件（按需引用）
//   2. 默认导出 install 函数 → 支持 app.use(UiKit) 全局安装
//   3. 全局属性挂载 this.$toast（命令式调用）
import '../theme/tokens.css' // 设计令牌（浅色/深色），打进 lib 的 ui-kit.css
import { createApp, h } from 'vue'
import type { App } from 'vue'
import UiButton from './ui/UiButton.vue'
import UiBadge from './ui/UiBadge.vue'
import UiCard from './ui/UiCard.vue'
import UiModal from './ui/UiModal.vue'
import UiProgress from './ui/UiProgress.vue'
import UiToast from './ui/UiToast.vue'
import UiInput from './ui/UiInput.vue'
import UiTextarea from './ui/UiTextarea.vue'
import UiSelect from './ui/UiSelect.vue'
import UiSwitch from './ui/UiSwitch.vue'
import UiGrid from './ui/UiGrid.vue'
import UiGridItem from './ui/UiGridItem.vue'
import UiContainer from './ui/UiContainer.vue'
import UiSpacer from './ui/UiSpacer.vue'
import UiVirtualList from './ui/UiVirtualList.vue'
import UiConfigProvider from './ui/UiConfigProvider.vue'
import UiSkeleton from './ui/UiSkeleton.vue'
import UiInstallPwa from './ui/UiInstallPwa.vue'
import { useFormValidator } from '../composables/useFormValidator'
import { useTheme } from '../composables/useTheme'
import { useUiConfig } from '../composables/useUiConfig'
import { useAsyncData } from '../composables/useAsyncData'
import { usePWA } from '../composables/usePWA'
import UiDirectives, { vTooltip, vAutoFocus, vLongPress, vDebounce, vClickOutside } from '../directives'

// 具名导出：按需 import { UiButton } from '...'
export {
  UiButton,
  UiBadge,
  UiCard,
  UiModal,
  UiProgress,
  UiToast,
  UiInput,
  UiTextarea,
  UiSelect,
  UiSwitch,
  UiGrid,
  UiGridItem,
  UiContainer,
  UiSpacer,
  UiVirtualList,
  UiConfigProvider,
  UiSkeleton,
  UiInstallPwa,
}

// 组合式函数导出：useFormValidator + useTheme + useUiConfig + useAsyncData + usePWA
export { useFormValidator }
export { useTheme }
export { useUiConfig }
export { useAsyncData }
export { usePWA }

// 自定义指令导出：vTooltip / vAutoFocus / vLongPress / vDebounce / vClickOutside
export { vTooltip, vAutoFocus, vLongPress, vDebounce, vClickOutside }

// 全局 Toast 命令式 API（挂在组件实例上, 模板里可用 $toast.success('xx')）
let toastApi: { push: (t: 'success' | 'error' | 'info', m: string, d?: number) => void } | null = null

// install 函数：支持 app.use(UiKit)
const UiKit = {
  install(app: App) {
    // 全局注册每个组件（模板里直接用 <UiButton> 等，无需 import）
    const components = {
      UiButton, UiBadge, UiCard, UiModal, UiProgress, UiToast, UiInput, UiTextarea, UiSelect, UiSwitch,
      UiGrid, UiGridItem, UiContainer, UiSpacer, UiVirtualList, UiConfigProvider, UiSkeleton, UiInstallPwa,
    }
    for (const [name, comp] of Object.entries(components)) {
      app.component(name, comp)
    }
    // 全局注册自定义指令: v-tooltip / v-auto-focus
    app.use(UiDirectives)
    // 挂载隐藏 Toast 宿主, 拿到命令式 API（独立根实例, 不干扰主应用）
    const toastRoot = createApp({
      render: () =>
        h(UiToast, {
          ref: (el: any) => {
            if (el) toastApi = el
          },
        }),
    })
    toastRoot.mount(document.createElement('div'))
    // 全局属性: this.$toast
    app.config.globalProperties.$toast = {
      success: (m: string) => toastApi?.push('success', m),
      error: (m: string) => toastApi?.push('error', m),
      info: (m: string) => toastApi?.push('info', m),
    }
  },
}

export default UiKit
