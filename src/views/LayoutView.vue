<script setup lang="ts">
// 布局组件 Demo —— 作品⑭
// 展示 UiContainer / UiGrid + UiGridItem / UiSpacer 的用法
import { ref } from 'vue'

// 响应式断点演示：控制三列在不同断点的跨度
const cols = ref([
  { span: 12, md: 6, lg: 4, label: 'A' },
  { span: 12, md: 6, lg: 4, label: 'B' },
  { span: 12, md: 12, lg: 4, label: 'C' },
])
</script>

<template>
  <section class="layout-demo">
    <h1>📐 布局组件</h1>
    <p class="sub">UiContainer 容器 · UiGrid 栅格 · UiGridItem 栅格单元 · UiSpacer 间距</p>

    <!-- ===== 1. 容器 + 栅格 ===== -->
    <UiContainer width="md">
      <h2 class="sec">1️⃣ UiContainer（限制宽度居中）</h2>
      <p class="desc">外层是 <code>UiContainer</code>（md 档位 → 最大 768px 居中），内部用 <code>UiGrid</code> 放 3 个 <code>UiGridItem</code>。</p>
      <UiGrid :gap="16">
        <UiGridItem v-for="c in cols" :key="c.label" :span="c.span" :md="c.md" :lg="c.lg">
          <div class="box">span={{ c.span }}<br>md={{ c.md }} · lg={{ c.lg }}</div>
        </UiGridItem>
      </UiGrid>
    </UiContainer>

    <UiSpacer size="xl" />

    <!-- ===== 2. 12 列栅格 ===== -->
    <h2 class="sec">2️⃣ 12 列栅格（UiGridItem span）</h2>
    <p class="desc"><code>UiGrid</code> 默认 12 列，<code>UiGridItem</code> 用 <code>span</code> 控制每格跨几列。</p>
    <UiGrid :gap="12" align="stretch">
      <UiGridItem :span="6"><div class="box dark">span 6</div></UiGridItem>
      <UiGridItem :span="6"><div class="box dark">span 6</div></UiGridItem>
      <UiGridItem :span="4"><div class="box dark">span 4</div></UiGridItem>
      <UiGridItem :span="4"><div class="box dark">span 4</div></UiGridItem>
      <UiGridItem :span="4"><div class="box dark">span 4</div></UiGridItem>
      <UiGridItem :span="3"><div class="box dark">span 3</div></UiGridItem>
      <UiGridItem :span="9"><div class="box dark">span 9</div></UiGridItem>
    </UiGrid>

    <UiSpacer size="xl" />

    <!-- ===== 3. 响应式：不同断点不同跨度 ===== -->
    <h2 class="sec">3️⃣ 响应式跨列（拖宽浏览器看变化）</h2>
    <p class="desc">移动端每项占满(span 12) → ≥768px 两列(md 6) → ≥1024px 三列(lg 4)。纯 CSS 媒体查询实现。</p>
    <UiGrid :gap="12">
      <UiGridItem :span="12" :md="6" :lg="4" v-for="i in 3" :key="i">
        <div class="box accent">卡片 {{ i }}<br><small>12 → 6 → 4</small></div>
      </UiGridItem>
    </UiGrid>

    <UiSpacer size="xl" />

    <!-- ===== 4. 间距 ===== -->
    <h2 class="sec">4️⃣ UiSpacer（间距占位）</h2>
    <p class="desc">纵向留白用 <code>axis="vertical"</code>，横向用 <code>axis="horizontal"</code>；尺寸可以是档位(xs~xxl)或任意 px。</p>
    <div style="display: flex; align-items: center; gap: 0; background: #1e293b; border-radius: 10px; padding: 12px">
      <span class="pill">A</span>
      <UiSpacer size="sm" axis="horizontal" />
      <span class="pill">B</span>
      <UiSpacer size="lg" axis="horizontal" />
      <span class="pill">C</span>
      <UiSpacer size="sm" axis="horizontal" />
      <span class="pill">D</span>
    </div>
    <div class="stack">
      <span class="pill">上</span>
      <UiSpacer size="md" />
      <span class="pill">中</span>
      <UiSpacer size="md" />
      <span class="pill">下</span>
    </div>
  </section>
</template>

<style scoped>
.layout-demo { padding: 8px 0 48px; }
h1 { font-size: 24px; margin: 0 0 4px; }
.sub { color: var(--muted, #94a3b8); font-family: monospace; font-size: 13px; margin: 0 0 28px; }
.sec { font-size: 17px; margin: 0 0 8px; color: #e2e8f0; }
.desc { color: #94a3b8; font-size: 13px; margin: 0 0 16px; line-height: 1.6; }
code { background: rgba(255,255,255,.08); padding: 2px 6px; border-radius: 4px; font-size: 12.5px; }

.box {
  background: #273449; border: 1px solid rgba(255,255,255,.08);
  border-radius: 8px; padding: 18px 12px; text-align: center;
  font-size: 13px; color: #cbd5e1; min-height: 56px;
  display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 4px;
}
.box.dark { background: #1e293b; }
.box.accent { background: rgba(79,140,255,.12); border-color: rgba(79,140,255,.4); }
.box small { color: #64748b; font-size: 11px; }
.desc + .box, .box + .box { margin-top: 0; }

.pill {
  background: #334155; border-radius: 6px; padding: 8px 14px; font-size: 13px; color: #e2e8f0;
}
.stack { margin-top: 16px; display: flex; flex-direction: column; }
</style>
