// ============================================================
// usePWA 单测（作品㉔ · PWA composable）
// ------------------------------------------------------------
// 覆盖:
//   1. 单例返回同一状态对象
//   2. isSupported / isOnline 初始值
//   3. installApp 无可安装事件时防呆返回 false
//   4. 状态响应式（isOnline 跟随事件变化）
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePWA } from '../composables/usePWA'

// 注意: usePWA 是模块级单例, install() 在 import 时已执行。
// jsdom 环境下 serviceWorker 通常不存在 → isSupported=false 合理。

describe('usePWA', () => {
  const originalOnLine = navigator.onLine

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('返回单例: 两次调用是同一个状态引用', () => {
    const a = usePWA()
    const b = usePWA()
    expect(a.isSupported).toBe(b.isSupported)
    expect(a.isOnline).toBe(b.isOnline)
    expect(a.canInstall).toBe(b.canInstall)
  })

  it('暴露 PWA 状态字段', () => {
    const { isSupported, isOnline, isStandalone, canInstall, updateAvailable } = usePWA()
    // 字段都是 Ref
    expect(typeof isSupported.value).toBe('boolean')
    expect(typeof isOnline.value).toBe('boolean')
    expect(typeof isStandalone.value).toBe('boolean')
    expect(typeof canInstall.value).toBe('boolean')
    expect(typeof updateAvailable.value).toBe('boolean')
  })

  it('isOnline 跟随在线/离线事件变化', () => {
    const { isOnline } = usePWA()
    // 初始 = navigator.onLine
    expect(isOnline.value).toBe(originalOnLine)

    // 模拟离线
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
    window.dispatchEvent(new Event('offline'))
    expect(isOnline.value).toBe(false)

    // 模拟上线
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    window.dispatchEvent(new Event('online'))
    expect(isOnline.value).toBe(true)
  })

  it('installApp 在无安装事件时返回 false(防呆)', async () => {
    const { installApp } = usePWA()
    const result = await installApp()
    expect(result).toBe(false)
  })

  it('installApp 在有 deferred prompt 时成功并重置状态', async () => {
    // 重新触发 beforeinstallprompt(手动注入 deferredPrompt)
    const promptFn = vi.fn().mockResolvedValue({ outcome: 'accepted' })
    const event = new Event('beforeinstallprompt')
    ;(event as any).prompt = promptFn
    ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
    // 拦截 preventDefault
    const pd = vi.fn()
    ;(event as any).preventDefault = pd

    const { canInstall, installApp } = usePWA()
    window.dispatchEvent(event)
    expect(pd).toHaveBeenCalled()
    expect(canInstall.value).toBe(true)

    const ok = await installApp()
    expect(ok).toBe(true)
    expect(promptFn).toHaveBeenCalled()
    expect(canInstall.value).toBe(false)
  })
})
