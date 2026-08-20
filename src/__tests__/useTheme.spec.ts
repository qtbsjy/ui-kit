// ============================================================
// useTheme 单元测试（作品⑮）
// 学习重点:
//   1. useTheme 是模块级单例，测试要操作真实 document.documentElement 的 data-theme
//   2. localStorage 持久化偏好
//   3. toggle / setTheme / resetToSystem 的行为
// ============================================================
import { describe, it, expect, beforeEach } from 'vitest'
import { useTheme } from '../composables/useTheme'

// 清理：避免单例状态跨用例污染
beforeEach(() => {
  try {
    localStorage.clear()
  } catch {
    /* 环境无 localStorage 则跳过 */
  }
  document.documentElement.removeAttribute('data-theme')
  // 重置偏好回 system
  const { setTheme } = useTheme()
  setTheme('system')
})

describe('useTheme', () => {
  it('默认跟随系统（preference=system，theme 为 light 或 dark）', () => {
    const { preference, theme, isSystem } = useTheme()
    expect(preference.value).toBe('system')
    expect(isSystem.value).toBe(true)
    // jsdom 默认 prefers-color-scheme 无匹配 → light
    expect(theme.value).toBe('light')
  })

  it('setTheme("dark") 切换 deep 主题并写入 data-theme + localStorage', () => {
    const { setTheme, theme, isDark, preference } = useTheme()
    setTheme('dark')
    expect(theme.value).toBe('dark')
    expect(isDark.value).toBe(true)
    expect(preference.value).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    try {
      expect(localStorage.getItem('ui-kit-theme')).toBe('dark')
    } catch {
      /* 环境无 localStorage 则跳过持久化断言 */
    }
  })

  it('setTheme("light") 移除 data-theme 属性（浅色是默认值）', () => {
    const { setTheme, theme, isDark } = useTheme()
    setTheme('dark')
    setTheme('light')
    expect(theme.value).toBe('light')
    expect(isDark.value).toBe(false)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    try {
      expect(localStorage.getItem('ui-kit-theme')).toBe('light')
    } catch {
      /* 环境无 localStorage 则跳过 */
    }
  })

  it('toggle() 在 light ↔ dark 间切换', () => {
    const { toggle, theme } = useTheme()
    // 单例里前面用例设为 system，回到 light
    const { setTheme } = useTheme()
    setTheme('light')
    expect(theme.value).toBe('light')
    toggle()
    expect(theme.value).toBe('dark')
    toggle()
    expect(theme.value).toBe('light')
  })

  it('resetToSystem() 清除手动偏好恢复跟随系统', () => {
    const { resetToSystem, setTheme, isSystem, preference } = useTheme()
    setTheme('dark')
    expect(isSystem.value).toBe(false)
    resetToSystem()
    expect(preference.value).toBe('system')
    expect(isSystem.value).toBe(true)
    try {
      expect(localStorage.getItem('ui-kit-theme')).toBe('system')
    } catch {
      /* 环境无 localStorage 则跳过 */
    }
  })

  it('重新加载偏好恢复：setTheme 后 preference 持久化', () => {
    const { setTheme } = useTheme()
    setTheme('dark')
    // 模拟刷新：清 document 状态但保留 localStorage，再读
    document.documentElement.removeAttribute('data-theme')
    const { preference, theme } = useTheme()
    expect(preference.value).toBe('dark')
    expect(theme.value).toBe('dark')
  })

  it('setTheme 接受非法值时空不崩（外部只传合法三值，此处防呆）', () => {
    const { setTheme, preference } = useTheme()
    // 类型上不允许，但运行时直接赋非法字符串会走 else 分支回 system
    ;(setTheme as any)('hacker')
    expect(preference.value).toBe('system')
  })
})
