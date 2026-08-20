<script setup lang="ts">
// 消息提示详细文档页 —— 展示命令式 $toast 的各种用法
import { getCurrentInstance } from 'vue'

const current = getCurrentInstance()
const toast = (type: 'success' | 'error' | 'info', msg: string) =>
  (current as any)?.proxy?.$toast?.[type]?.(msg)
</script>

<template>
  <h1>🍞 UiToast 消息提示</h1>
  <p class="lead">
    全局命令式消息提示，无需在模板里写组件。安装组件库后可用
    <code>$toast.success/error/info(msg)</code> 在任意位置调用，右下角堆叠显示，自动消失。
  </p>

  <section class="block">
    <h2>三种类型</h2>
    <div class="row">
      <UiButton variant="secondary" @click="toast('success', '保存成功')">success</UiButton>
      <UiButton variant="danger" @click="toast('error', '网络错误，请重试')">error</UiButton>
      <UiButton @click="toast('info', '你有 3 条新通知')">info</UiButton>
    </div>
  </section>

  <section class="block">
    <h2>堆叠演示</h2>
    <UiButton @click="toast('success', '第 1 条'); toast('info', '第 2 条'); toast('error', '第 3 条')">
      连发三条（自动堆叠）
    </UiButton>
  </section>

  <section class="block">
    <h2>实现原理</h2>
    <p>组件库 install 时挂载一个隐藏 Toast 根实例，通过 defineExpose 暴露 push()，</p>
    <p>再挂到 <code>app.config.globalProperties.$toast</code>，因此任何组件里都能调。</p>
  </section>
</template>

<style scoped>
h1 { font-size: 28px; }
.lead { color: var(--muted); margin: 10px 0 24px; }
.block { background: var(--panel); border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; }
.block h2 { font-size: 15px; margin-bottom: 14px; }
.block p { color: var(--muted); line-height: 1.8; font-size: 14px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; }
code { background: rgba(255,255,255,.08); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
</style>
