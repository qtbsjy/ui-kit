// ============================================================
// useTheme —— 主题切换组合式函数（作品⑮ 深色/浅色主题系统）
// ------------------------------------------------------------
// 学习重点:
//   1. 单例状态（模块级 ref + 导出的单例函数）—— 多处调用共享同一主题
//   2. 持久化到 localStorage，刷新不丢
//   3. 手动选择后覆盖系统偏好；未手动选择时跟随 prefers-color-scheme
//   4. 在 <html> 上切换 data-theme 属性，配合 tokens.css 换肤
//   5. matchMedia('(prefers-color-scheme: dark)') 监听系统主题实时变化
// ============================================================
import { ref, computed } from 'vue'

type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'ui-kit-theme'

// 是否已注入过 DOM（<html> 属性 + 监听）—— 单例守卫
let installed = false

// 安全访问 localStorage（SSR / 隐私模式 / 测试环境可能不可用，一律兜底）
const storage = {
  get(key: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    } catch {
      return null
    }
  },
  set(key: string, val: string) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, val)
    } catch {
      /* 忽略：拿不到存储就不持久化 */
    }
  },
}

function loadPreference(): Theme {
  const saved = storage.get(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

/** 当前生效的实际主题（light | dark，不含 system） */
const current = ref<Exclude<Theme, 'system'>>('light')

/** 用户偏好（含 system） */
const preference = ref<Theme>(loadPreference())

/** 系统当前是否为深色（jsdom/老环境可能没有 matchMedia，安全兜底） */
const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null

/** 根据偏好解析出生效主题 */
function resolve(pref: Theme): Exclude<Theme, 'system'> {
  if (pref === 'system') return media?.matches ? 'dark' : 'light'
  return pref
}

/** 把主题写进 <html data-theme> */
function apply(theme: Exclude<Theme, 'system'>) {
  current.value = theme
  const root = document.documentElement
  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')
}

function install() {
  if (installed || typeof window === 'undefined') return
  installed = true
  // 首次应用
  apply(resolve(preference.value))
  // 跟进系统偏好变化（仅当用户未手动指定时才有实际影响）
  media?.addEventListener('change', () => {
    if (preference.value === 'system') apply(resolve('system'))
  })
}

// 提供给组件模板使用的响应式状态
const isDark = computed(() => current.value === 'dark')
const isSystem = computed(() => preference.value === 'system')

/** 切换主题（light ↔ dark，若当前 system 则以系统当前为准切到反方向） */
function toggle() {
  const next: Exclude<Theme, 'system'> = current.value === 'dark' ? 'light' : 'dark'
  setTheme(next)
}

/** 设置主题偏好 */
function setTheme(t: Theme) {
  // 防呆：只接受合法三值，非法回 system
  if (t !== 'light' && t !== 'dark' && t !== 'system') t = 'system'
  preference.value = t
  storage.set(STORAGE_KEY, t)
  apply(resolve(t))
}

/** 清除手动偏好，恢复跟随系统 */
function resetToSystem() {
  setTheme('system')
}

/** 主题切换时加平滑过渡 class（瞬切体验优化，可传 false 关闭） */
function withTransition(fn: () => void, smooth = true) {
  if (!smooth) return fn()
  const root = document.documentElement
  root.classList.add('theme-transition')
  fn()
  // 过渡结束移除（避免影响后续渲染）
  setTimeout(() => root.classList.remove('theme-transition'), 350)
}

// 单例 composable —— 模块加载即注入（保证任何组件调用都是同一份状态）
install()

export function useTheme() {
  return {
    /** 当前生效主题（light | dark） */
    theme: current,
    /** 用户偏好（light | dark | system） */
    preference,
    /** 当前是否深色 */
    isDark,
    /** 是否跟随系统 */
    isSystem,
    toggle,
    setTheme,
    resetToSystem,
    withTransition,
  }
}

export type { Theme }
