// ============================================================
// usePWA —— 渐进式 Web App 组合式函数（作品㉔）
// ------------------------------------------------------------
// 在组件库层面封装 PWA 运行时能力，让演示站可安装 + 离线可用，
// 同时把"安装提示 / 在线状态 / 更新检测"封装成可复用 composable。
//
// 学习重点:
//   1. 单例状态（模块级 ref + 导出的单例函数）—— 多处调用共享同一份 PWA 状态
//   2. beforeinstallprompt —— 浏览器"可安装"事件，拦截后可用 installApp() 触发原生安装弹窗
//   3. online/offline 事件 —— 实时监听网络状态，离线时提示"仍可浏览"
//   4. display-mode: standalone —— 判断"已安装为独立应用"（区别于浏览器标签页）
//   5. 不依赖 vite-plugin-pwa 的 virtual 虚拟模块 —— injectRegister:'auto' 不提供它，
//      所以自己监听 ServiceWorker 的 message/controllerchange 完成更新检测
// ============================================================
import { ref, computed, shallowRef } from 'vue'

// 是否已注入过 DOM 监听 —— 单例守卫
let installed = false

// ---------- 响应式状态 ----------
/** 是否已安装为独立应用（PWA 窗口，区别于浏览器标签） */
const isStandalone = ref(false)

/** 当前是否在线（navigator.onLine） */
const isOnline = ref(true)

/** 是否可安装（浏览器弹过 beforeinstallprompt，说明满足安装条件） */
const canInstall = ref(false)

/** 是否有新版本可用（SW 检测到更新） */
const updateAvailable = ref(false)

/** 已注册的 ServiceWorker 实例（用于手动触发 skipWaiting） */
const registration = shallowRef<ServiceWorkerRegistration | null>(null)

// 拦截的安装事件（保存供 installApp() 使用）
let deferredPrompt: any = null

// ---------- 内部逻辑 ----------
function updateStandalone() {
  // display-mode: standalone —— PWA 以独立窗口运行（已安装）
  // 安全兜底: jsdom/老环境可能没有 matchMedia
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    isStandalone.value = false
    return
  }
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches
}

function updateOnline() {
  isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true
}

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true

  // 1. 初始状态
  updateStandalone()
  updateOnline()

  // 2. 在线/离线监听
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)

  // 3. 安装提示（可安装时触发）
  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止浏览器默认的最小安装条，改用自定义提示
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  })

  // 4. 已安装触发（浏览器自动安装完成）
  window.addEventListener('appinstalled', () => {
    canInstall.value = false
    isStandalone.value = true
  })

  // 5. ServiceWorker 更新检测
  //    注意：这里不依赖 vite-plugin-pwa 的 virtual:pwa-register 虚拟模块
  //    （injectRegister:'auto' 时不提供它），而是自己监听 SW 事件。
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      registration.value = reg
      // SW 每次激活后广播"已更新"（见下方 receiveMessage 约定）
    })
    // 监听 SW 发来的消息（约定: { type: 'SW_UPDATED' }）
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        updateAvailable.value = true
      }
    })
  }
}

// 模块加载即注入（确保任何组件调用共享同一份状态）
install()

// ---------- 对外 API ----------
/**
 * 触发原生"安装应用"弹窗。
 * 仅当 canInstall 为 true（浏览器已触发过 beforeinstallprompt）时有效。
 * 返回是否成功唤起安装。
 */
async function installApp(): Promise<boolean> {
  if (!deferredPrompt) return false
  try {
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    // 无论接受/拒绝，这个事件只能用一次
    deferredPrompt = null
    canInstall.value = false
    return true
  } catch {
    return false
  }
}

/**
 * 手动检查并应用 SW 更新。
 * VitePWA registerType:'autoUpdate' 下 SW 会自动接管，
 * 此方法用于手动触发 skipWaiting 强制立即应用新版。
 */
async function updateSW(): Promise<boolean> {
  try {
    if (registration.value && registration.value.waiting) {
      // 让等待中的 SW 立即接管页面
      registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
      updateAvailable.value = false
      return true
    }
    // 有更新但无 waiting → 重新注册尝试获取
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.register('/sw.js')
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        updateAvailable.value = false
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

// 是否支持 PWA（当前环境有 serviceWorker 可用）
const isSupported = computed(() => typeof window !== 'undefined' && 'serviceWorker' in navigator)

// 单例 composable
export function usePWA() {
  return {
    /** 是否已安装为独立应用 */
    isStandalone,
    /** 当前是否在线 */
    isOnline,
    /** 是否可安装（满足安装条件，可调 installApp） */
    canInstall,
    /** 是否有新版可用 */
    updateAvailable,
    /** 当前环境是否支持 PWA */
    isSupported,
    installApp,
    updateSW,
  }
}

// 供 SW 脚本约定的消息类型
export type PWAInstallResult = boolean
