<script setup lang="ts">
// 模态框组件详细文档页
import { ref } from 'vue'
import UiModal from '../components/ui/UiModal.vue'

const show1 = ref(false)
const show2 = ref(false)
const show3 = ref(false)

// 用 ref 调用 defineExpose 暴露的 open()/close()
const modalRef = ref<InstanceType<typeof UiModal> | null>(null)
</script>

<template>
  <h1>🪟 UiModal 模态框</h1>
  <p class="lead">
    居中弹层。核心：<code>&lt;Teleport&gt;</code> 传送到 body、<code>v-model</code> 控制开合、
    <code>defineExpose</code> 暴露 open/close、Transition 动画、Esc/遮罩关闭、body 滚动锁定。
  </p>

  <section class="block">
    <h2>v-model 双向绑定</h2>
    <UiButton @click="show1 = true">标准模态框</UiButton>
    <UiModal v-model="show1" title="标准模态框" @close="console.log('closed')">
      <p>这是最常见的用法：<code>v-model</code> 控制 <code>show1</code>。</p>
      <p>内部 emit('update:modelValue') 实现双向。</p>
      <template #footer>
        <UiButton variant="ghost" @click="show1 = false">取消</UiButton>
        <UiButton @click="show1 = false">确定</UiButton>
      </template>
    </UiModal>
  </section>

  <section class="block">
    <h2>自定义宽度 + 不可遮罩关闭</h2>
    <UiButton @click="show2 = true">宽 600px · 禁止点遮罩关</UiButton>
    <UiModal v-model="show2" title="宽弹窗" width="600px" :mask-closable="false">
      <p>这个宽度 600px，且 <code>mask-closable=false</code>，点遮罩不会关闭，只能点 ✕ 或 Esc。</p>
    </UiModal>
  </section>

  <section class="block">
    <h2>命令式调用（defineExpose）</h2>
    <UiButton @click="modalRef?.open()">用 ref 调 open()</UiButton>
    <UiModal ref="modalRef" title="命令式打开">
      <p>父组件用 <code>ref</code> 拿到实例，直接调 <code>modal.open() / close()</code>。</p>
    </UiModal>
  </section>

  <section class="block">
    <h2>嵌套内容</h2>
    <UiButton @click="show3 = true">带丰富内容</UiButton>
    <UiModal v-model="show3" title="内容丰富的弹窗">
      <UiCard title="内嵌卡片" hover>
        <p>模态框里可以放任何东西，包括其他组件。</p>
        <template #footer><UiBadge color="green">嵌套 OK</UiBadge></template>
      </UiCard>
    </UiModal>
  </section>
</template>

<style scoped>
h1 { font-size: 28px; }
.lead { color: var(--muted); margin: 10px 0 24px; }
.block { background: var(--panel); border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; }
.block h2 { font-size: 15px; margin-bottom: 14px; }
code { background: rgba(255,255,255,.08); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
</style>
