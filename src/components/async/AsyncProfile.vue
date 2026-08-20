<script setup lang="ts">
// ============================================================
// AsyncProfile —— Suspense 异步子组件（作品㉒ 演示用）
// ------------------------------------------------------------
// 学习重点:
//   1. async setup() —— setup 里 await 一个 promise, <Suspense> 会自动等待它完成
//   2. 顶层 await 期间, 父级 Suspense 显示 #fallback(骨架屏)
//   3. 配合 useAsyncData: 数据加载成功才渲染内容, 失败可重试
//   4. 用顶层 await 触发 Suspense 等待(组件级), 用 useAsyncData 管理数据(内部态)
//      两者配合: Suspense 管"组件挂载", useAsyncData 管"数据三态"
// ============================================================
import { ref } from 'vue'
import { useAsyncData } from '../../composables/useAsyncData'

// 模拟一个远程 API(随机成功/失败, 延迟 1.2s)
interface Profile {
  name: string
  role: string
  bio: string
  stats: { posts: number; followers: number; likes: number }
}
function mockFetchProfile(): Promise<Profile> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 30% 概率失败, 演示错误重试
      if (Math.random() < 0.3) {
        reject(new Error('网络请求失败(模拟): 服务器繁忙, 请重试'))
        return
      }
      resolve({
        name: '布鲁 🐾',
        role: '数字宠物 · Vue 学习者',
        bio: '每天做一个作品, 从工具箱到组件库, 一步步啃 Vue 工程化。',
        stats: { posts: 21, followers: 1024, likes: 7777 },
      })
    }, 1200)
  })
}

// 用 useAsyncData 管理三态(加载/数据/错误), 供 Suspense 等待 + 内部重试
const { data, loading, error, retry, ready } = useAsyncData<Profile>(mockFetchProfile)

// 顶层 await: 让 AsyncProfile 成为异步组件。Suspense 会自动等待本 setup 完成挂载,
// 期间在父级显示 #fallback(骨架屏)。ready 是首次加载完成的 promise,
// await 它 → 数据就绪后组件才渲染真实内容。这是 <script setup> 顶层 await 的标准用法。
await ready
</script>

<template>
  <div class="profile">
    <!-- 加载中(理论: Suspense 已接管, 这里兜底) -->
    <div v-if="loading" class="profile__loading">
      <UiSkeleton :rows="3" :avatar="true" :title="true" />
    </div>

    <!-- 错误态 -->
    <div v-else-if="error" class="profile__error">
      <span class="profile__error-icon">⚠️</span>
      <p>{{ error.message }}</p>
      <UiButton variant="secondary" icon="🔄" @click="retry">重试</UiButton>
    </div>

    <!-- 成功态: 渲染真实数据 -->
    <div v-else class="profile__card">
      <div class="profile__head">
        <div class="profile__avatar">🐶</div>
        <div>
          <h3>{{ data?.name }}</h3>
          <p class="profile__role">{{ data?.role }}</p>
        </div>
      </div>
      <p class="profile__bio">{{ data?.bio }}</p>
      <div class="profile__stats">
        <div class="stat"><b>{{ data?.stats.posts }}</b><span>作品</span></div>
        <div class="stat"><b>{{ data?.stats.followers }}</b><span>关注</span></div>
        <div class="stat"><b>{{ data?.stats.likes }}</b><span>赞</span></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile__loading,
.profile__error,
.profile__card { padding: 4px 0; }
.profile__error { text-align: center; padding: 24px; color: var(--ui-text-2); }
.profile__error-icon { font-size: 28px; display: block; margin-bottom: 8px; }
.profile__error p { margin-bottom: 14px; font-size: 14px; }
.profile__card {}
.profile__head { display: flex; align-items: center; gap: 14px; margin-bottom: 12px; }
.profile__avatar {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--ui-primary-soft), var(--ui-primary-border));
  display: flex; align-items: center; justify-content: center; font-size: 26px;
}
.profile__head h3 { font-size: 18px; color: var(--ui-text-1); }
.profile__role { color: var(--ui-text-2); font-size: 13px; margin-top: 2px; }
.profile__bio { color: var(--ui-text-2); font-size: 14px; line-height: 1.7; margin-bottom: 16px; }
.profile__stats { display: flex; gap: 32px; border-top: 1px solid var(--ui-divider); padding-top: 14px; }
.stat { display: flex; flex-direction: column; }
.stat b { font-size: 20px; color: var(--ui-text-1); }
.stat span { font-size: 12px; color: var(--ui-text-3); }
</style>
