// ============================================================
// useAsyncData —— 异步数据加载封装（作品㉒ · Suspense/加载态）
// ------------------------------------------------------------
// 用法:
//   const { data, loading, error, run, retry, ready } = useAsyncData(fetchUsers)
//   await ready          // 供 Suspense 等待
//   run()                // 手动触发(重跑)
//   retry()              // 出错后重试
// ------------------------------------------------------------
// 学习重点:
//   1. 封装 loading/error/data 三态 —— 配合骨架屏(UiSkeleton)和错误重试
//   2. ready() 返回 promise —— 供 <Suspense> 在 setup 里 await,
//      让父组件的 Suspense 在数据就绪前显示 #fallback
//   3. 请求竞态处理(race) —— 只有"最后一次请求"能写入状态, 防旧响应覆盖新响应
//   4. 错误捕获 + retry —— 结构化错误处理
// ============================================================
import { ref, shallowRef, type Ref } from 'vue'

export interface AsyncState<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<Error | null>
  /** 再次执行(带竞态保护) */
  run: () => Promise<T | null>
  /** 出错后重试(等价 run) */
  retry: () => Promise<T | null>
  /** 供 Suspense await 的 promise: 首次加载完成即 resolve */
  ready: Promise<void>
}

export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncState<T> {
  const data = shallowRef<T | null>(null) as Ref<T | null>
  const loading = ref(false)
  const error = ref<Error | null>(null)

  // 竞态序号: 每次 run 自增, 回调里只认最新一次
  let seq = 0

  // 首次加载完成的 promise(供 Suspense await)
  let resolveReady: () => void
  const ready = new Promise<void>((res) => {
    resolveReady = res
  })

  async function run(): Promise<T | null> {
    const mySeq = ++seq
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      if (mySeq !== seq) return null // 已被更新的请求取代, 丢弃
      data.value = result
      return result
    } catch (e) {
      if (mySeq !== seq) return null
      error.value = e instanceof Error ? e : new Error(String(e))
      return null
    } finally {
      if (mySeq === seq) loading.value = false
    }
  }

  // 立即触发首次加载
  run().finally(() => resolveReady())

  return { data, loading, error, run, retry: run, ready }
}
