// ============================================================
// UiSkeleton + useAsyncData 单元测试（作品㉒ · Suspense/加载态）
// ------------------------------------------------------------
// 覆盖:
//   1. UiSkeleton —— 行数 / 变体 / avatar / title / width
//   2. useAsyncData —— 加载态→数据 / 错误 / 重试 / 竞态丢弃
// ============================================================
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import UiSkeleton from '../components/ui/UiSkeleton.vue'
import { useAsyncData } from '../composables/useAsyncData'

// ---------- UiSkeleton ----------
describe('UiSkeleton', () => {
  it('默认渲染 3 行文本条', () => {
    const wrapper = mount(UiSkeleton)
    expect(wrapper.findAll('.ui-skeleton__line')).toHaveLength(3)
  })

  it('rows 控制行数', () => {
    const wrapper = mount(UiSkeleton, { props: { rows: 5 } })
    expect(wrapper.findAll('.ui-skeleton__line')).toHaveLength(5)
  })

  it('title=true 多渲染一行标题条', () => {
    const wrapper = mount(UiSkeleton, { props: { rows: 2, title: true } })
    // 2 行 + 1 行标题 = 3 个 line
    expect(wrapper.findAll('.ui-skeleton__line')).toHaveLength(3)
  })

  it('avatar=true 渲染头像占位', () => {
    const wrapper = mount(UiSkeleton, { props: { avatar: true } })
    expect(wrapper.find('.ui-skeleton__avatar').exists()).toBe(true)
  })

  it('avatar=false 不渲染头像', () => {
    const wrapper = mount(UiSkeleton)
    expect(wrapper.find('.ui-skeleton__avatar').exists()).toBe(false)
  })

  it('variant=circle 应用圆形 class', () => {
    const wrapper = mount(UiSkeleton, { props: { variant: 'circle' } })
    expect(wrapper.classes()).toContain('ui-skeleton--circle')
  })

  it('带无障碍 status 角色', () => {
    const wrapper = mount(UiSkeleton)
    expect(wrapper.attributes('role')).toBe('status')
    expect(wrapper.attributes('aria-label')).toBe('加载中')
  })
})

// ---------- useAsyncData ----------
describe('useAsyncData', () => {
  afterEach(() => vi.restoreAllMocks())

  it('加载完成后填充 data', async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: 1, name: '布鲁' })
    const { data, loading, error, ready } = useAsyncData(fetcher)
    expect(loading.value).toBe(true)
    await ready
    expect(data.value).toEqual({ id: 1, name: '布鲁' })
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
  })

  it('失败时填充 error 且 data 为 null', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'))
    const { data, error, ready } = useAsyncData(fetcher)
    await ready
    expect(error.value?.message).toBe('boom')
    expect(data.value).toBeNull()
  })

  it('retry 重新执行并成功', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('第一次失败'))
      .mockResolvedValueOnce({ ok: true })
    const { data, error, retry } = useAsyncData(fetcher)
    await new Promise((r) => setTimeout(r, 10))
    expect(error.value?.message).toBe('第一次失败')
    const result = await retry()
    expect(result).toEqual({ ok: true })
    expect(data.value).toEqual({ ok: true })
    expect(error.value).toBeNull()
  })

  it('竞态: 旧请求结果被丢弃, 只保留最新', async () => {
    // 用受控 promise 验证 seq 竞态保护。注意: useAsyncData 构造时已自动触发第 1 次 run()
    // 所以这里额外调用 run() 会依次消耗 fetcher 的第 2、3 次返回值
    const pendings: Array<(v: string) => void> = []
    const fetcher = vi.fn().mockImplementation(
      () => new Promise<string>((res) => pendings.push(res)),
    )

    const { data, run } = useAsyncData(fetcher)
    // 构造已消费 pendings[0]
    // 再发起两次手动请求: p1 先发(旧), p2 后发(新)
    const p1 = run()
    const p2 = run()
    // 先 resolve 旧请求(pendings[1]) —— 应被丢弃
    pendings[1]('OLD')
    await p1
    expect(data.value).toBeNull() // OLD 没写入
    // 再 resolve 新请求(pendings[2])
    pendings[2]('NEW')
    await p2
    expect(data.value).toBe('NEW')
  })
})
