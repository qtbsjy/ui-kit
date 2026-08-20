<script setup lang="ts">
// 组件总览页：一页看完所有组件的核心用法
import { ref } from 'vue'

// 给 MessageBox 演示用的状态
const showMsg = ref(false)

// UiProgress 演示
const progress = ref(30)
function tick() {
  progress.value += 20
  if (progress.value > 100) progress.value = 0
}

// Toast 演示: 通过 getCurrentInstance().proxy 拿全局 $toast
import { getCurrentInstance } from 'vue'
const current = getCurrentInstance()
function toast(type: 'success' | 'error' | 'info', msg: string) {
  ;(current as any)?.proxy?.$toast?.[type]?.(msg)
}
</script>

<template>
  <header class="page-head">
    <h1>🎨 UiKit 组件库</h1>
    <p class="sub">布鲁的第一个 TypeScript Vue 组件库 · 15 个通用组件</p>
    <div style="margin-top:16px">
      <UiButton size="lg" icon="📚" @click="$router.push('/doc/button')">进入组件文档站</UiButton>
    </div>
  </header>

  <!-- ===== 1. 按钮 ===== -->
  <section class="demo-block">
    <h2>🔘 按钮 UiButton</h2>
    <div class="row">
      <UiButton>主要按钮</UiButton>
      <UiButton variant="secondary">次要按钮</UiButton>
      <UiButton variant="danger">危险按钮</UiButton>
      <UiButton variant="ghost">幽灵按钮</UiButton>
      <UiButton size="sm">小号</UiButton>
      <UiButton size="lg">大号</UiButton>
      <UiButton icon="⚙️" loading>加载中</UiButton>
      <UiButton disabled>禁用</UiButton>
    </div>
    <p class="note">
      props: variant(size(sm/md/lg)/disabled/loading/icon · 原生属性透传
    </p>
  </section>

  <!-- ===== 2. 徽标 ===== -->
  <section class="demo-block">
    <h2>🏷️ 徽标 UiBadge</h2>
    <div class="row">
      <UiBadge color="blue">蓝色</UiBadge>
      <UiBadge color="green">绿色</UiBadge>
      <UiBadge color="orange">橙色</UiBadge>
      <UiBadge color="red">红色</UiBadge>
      <UiBadge color="gray">灰色</UiBadge>
      <span style="margin-left: 8px">在线</span>
      <UiBadge color="green" dot pulse />
    </div>
    <p class="note">props: color(blue/green/orange/red/gray) · dot(圆点) · pulse(呼吸)</p>
  </section>

  <!-- ===== 3. 卡片 ===== -->
  <section class="demo-block">
    <h2>🗂️ 卡片 UiCard</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
      <UiCard title="标题卡片" subtitle="副标题说明" hover>
        这是卡片主体内容。可以用 header / footer 插槽自定义头部和底部。
        <template #footer><UiButton size="sm">知道了</UiButton></template>
      </UiCard>
      <UiCard>
        <template #header><strong>纯插槽模式</strong></template>
        <p>不传 title 时用 header 插槽完全自定义头部。</p>
      </UiCard>
    </div>
  </section>

  <!-- ===== 4. 模态框 ===== -->
  <section class="demo-block">
    <h2>🪟 模态框 UiModal（v-model + Teleport + defineExpose）</h2>
    <UiButton @click="showMsg = true">打开模态框</UiButton>
    <UiModal v-model="showMsg" title="示例弹窗" width="420px" @close="toast('info', '模态框已关闭')">
      <p>这是一个用 <code>v-model</code> 控制的模态框，内部用了 <code>&lt;Teleport&gt;</code> 传送到 body。</p>
      <p style="margin-top: 8px">试试点遮罩 / ✕ / Esc 都能关闭。</p>
      <template #footer>
        <UiButton variant="ghost" @click="showMsg = false">取消</UiButton>
        <UiButton @click="showMsg = false; toast('success', '已确认！')">确认</UiButton>
      </template>
    </UiModal>
  </section>

  <!-- ===== 5. 进度条 ===== -->
  <section class="demo-block">
    <h2>📊 进度条 UiProgress</h2>
    <div style="display: flex; flex-direction: column; gap: 14px; max-width: 420px">
      <UiProgress :value="progress" show-text />
      <UiProgress :value="55" color="#22c55e" :height="12" />
      <UiProgress :value="80" color="#f59e0b" show-text />
    </div>
    <UiButton size="sm" style="margin-top: 12px" @click="tick">+20% 进度</UiButton>
  </section>

  <!-- ===== 6. Toast ===== -->
  <section class="demo-block">
    <h2>🍞 消息提示 UiToast（命令式 $toast）</h2>
    <div class="row">
      <UiButton variant="secondary" @click="toast('success', '操作成功！')">成功提示</UiButton>
      <UiButton variant="danger" @click="toast('error', '出错了，请重试')">错误提示</UiButton>
      <UiButton @click="toast('info', '这是一条普通信息')">信息提示</UiButton>
    </div>
  </section>

  <!-- ===== 7. 表单组件（新） ===== -->
  <section class="demo-block">
    <h2>✍️ 表单组件（新增: Input/Textarea/Select/Switch）</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div style="display:flex;flex-direction:column;gap:16px">
        <UiInput label="用户名" placeholder="请输入" />
        <UiInput label="密码" type="password" placeholder="••••••" />
        <UiInput label="邮箱" error="邮箱格式不正确" placeholder="you@example.com" />
        <UiTextarea label="备注" :rows="3" placeholder="补充说明" show-count :maxlength="50" />
      </div>
      <div style="display:flex;flex-direction:column;gap:16px">
        <UiSelect label="优先级" :options="[{label:'低',value:'low'},{label:'中',value:'medium'},{label:'高',value:'high'}]" />
        <UiSwitch label="开启通知" active-text="开" inactive-text="关" />
        <UiSwitch label="深色模式" active-text="深色" inactive-text="浅色" />
        <div style="padding-top:8px">
          <UiButton variant="secondary" size="sm" icon="🧪">这些组件都有单测(26 个)</UiButton>
        </div>
      </div>
    </div>
    <p class="note">新组件: UiInput / UiTextarea / UiSelect / UiSwitch · 全部支持 v-model + Vitest 单测</p>
  </section>

  <!-- ===== 8. 表单校验（作品⑬, zod） ===== -->
  <section class="demo-block">
    <h2>✅ 表单校验 useFormValidator（作品⑬ · zod schema 驱动）</h2>
    <p style="color:var(--ui-text-2);font-size:14px;margin-bottom:12px">
      基于 <code>zod</code> 的轻量表单校验组合式函数：定义 schema 即得类型推导 + 校验规则，
      已集成到 UiKit（<code>useFormValidator</code>），配合表单组件使用。
    </p>
    <UiButton icon="🧾" @click="$router.push('/form')">查看注册表单 Demo →</UiButton>
  </section>

  <!-- ===== 9. 布局组件（作品⑭） ===== -->
  <section class="demo-block">
    <h2>📐 布局组件（作品⑭ · UiGrid/UiGridItem/UiContainer/UiSpacer）</h2>
    <p style="color:var(--ui-text-2);font-size:14px;margin-bottom:12px">
      12 栏响应式栅格 + 内容容器 + 间距占位：<code>UiGrid</code> 提供栅格骨架，
      <code>UiGridItem</code> 用 <code>span/md/lg/xl</code> 控制跨列与断点响应式，纯 CSS 实现。
    </p>
    <UiButton variant="secondary" icon="📐" @click="$router.push('/layout')">查看布局 Demo →</UiButton>
  </section>

  <!-- ===== 10. 主题系统（作品⑮） ===== -->
  <section class="demo-block">
    <h2>🎨 主题系统（作品⑮ · Design Tokens + useTheme）</h2>
    <p style="color:var(--ui-text-2);font-size:14px;margin-bottom:12px">
      语义化设计令牌（<code>tokens.css</code>）驱动浅色/深色两套主题，组件零改动自动换肤；
      <code>useTheme</code> 组合式函数持久化偏好 + 跟随系统 + 平滑过渡。
    </p>
    <UiButton icon="🌗" @click="$router.push('/theme')">体验主题切换 →</UiButton>
  </section>
</template>

<style scoped>
.page-head { margin-bottom: 30px; }
h1 { font-size: 30px; color: var(--ui-text-1); }
.sub { color: var(--ui-text-2); margin-top: 8px; }
.demo-block { background: var(--ui-panel); border: 1px solid var(--ui-border); border-radius: 16px; padding: 24px 26px; margin-bottom: 20px; }
.demo-block h2 { font-size: 16px; margin-bottom: 16px; color: var(--ui-text-1); }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.note { color: var(--ui-text-3); font-size: 12px; margin-top: 14px; font-family: ui-monospace, monospace; }
code { background: var(--ui-hover); padding: 2px 6px; border-radius: 4px; font-size: 13px; color: var(--ui-text-2); }
</style>
