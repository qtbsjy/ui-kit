<script setup lang="ts">
// 主题系统 Demo 页（作品⑮）
// 学习重点:
//   1. useTheme() 组合式函数: theme/preference/isDark/isSystem + toggle/setTheme/resetToSystem
//   2. 直接操作主题偏好（light/dark/system 三选）
//   3. 一套组件在浅/深色下自动换肤（token 驱动），这里全部用 UiKit 组件展示
import { useTheme } from '../composables/useTheme'

const { theme, preference, isDark, isSystem, setTheme, toggle, resetToSystem, withTransition } = useTheme()

// 带平滑过渡的切换
function switchTheme(t: 'light' | 'dark' | 'system') {
  withTransition(() => setTheme(t))
}

// 演示用状态
import { ref } from 'vue'
const showModal = ref(false)
const progress = ref(45)
const inputVal = ref('')
const switchVal = ref(true)
</script>

<template>
  <header class="page-head">
    <h1>🎨 主题系统 Demo</h1>
    <p class="sub">
      Design Tokens（tokens.css）+ useTheme 组合式函数 · 作品⑮
    </p>
  </header>

  <!-- ===== 1. 主题切换控制 ===== -->
  <section class="demo-block">
    <h2>🌗 主题切换</h2>
    <div class="controls">
      <UiButton
        :variant="preference === 'light' ? 'primary' : 'secondary'"
        @click="switchTheme('light')"
      >☀️ 浅色</UiButton>
      <UiButton
        :variant="preference === 'dark' ? 'primary' : 'secondary'"
        @click="switchTheme('dark')"
      >🌙 深色</UiButton>
      <UiButton
        :variant="preference === 'system' ? 'primary' : 'secondary'"
        @click="switchTheme('system')"
      >🖥️ 跟随系统</UiButton>
      <UiButton variant="ghost" icon="🔄" @click="withTransition(() => toggle())">{{ isDark ? '切到浅色' : '切到深色' }}</UiButton>
    </div>

    <div class="status">
      <UiBadge :color="isDark ? 'blue' : 'orange'" dot pulse />
      <span>当前生效: <b>{{ theme }}</b> · 用户偏好: <b>{{ preference }}</b></span>
      <span v-if="isSystem" class="hint">（跟随系统，未手动指定）</span>
    </div>

    <p class="note">
      偏好持久化到 localStorage（ui-kit-theme），刷新不丢 · 手动选择后覆盖系统偏好 · 切换带 0.3s 平滑过渡
    </p>
  </section>

  <!-- ===== 2. 表面层级 ===== -->
  <section class="demo-block">
    <h2>🧱 表面层级（bg / bg-soft / panel / border）</h2>
    <div class="surface-grid">
      <div class="swatch" style="background: var(--ui-bg)"><span>--ui-bg</span><code>页面背景</code></div>
      <div class="swatch" style="background: var(--ui-bg-soft)"><span>--ui-bg-soft</span><code>输入框底色</code></div>
      <div class="swatch" style="background: var(--ui-panel); border:1px solid var(--ui-border)"><span>--ui-panel</span><code>卡片表面</code></div>
      <div class="swatch" style="background: var(--ui-panel); border:1px solid var(--ui-border-hover)"><span>--ui-border-hover</span><code>悬浮边框</code></div>
    </div>
  </section>

  <!-- ===== 3. 文字层级 ===== -->
  <section class="demo-block">
    <h2>🔤 文字层级</h2>
    <p style="color: var(--ui-text-1); font-size: 16px">--ui-text-1 · 主文本，标题和正文</p>
    <p style="color: var(--ui-text-2); font-size: 14px">--ui-text-2 · 次级文本，描述/说明</p>
    <p style="color: var(--ui-text-3); font-size: 13px">--ui-text-3 · 弱化文本，占位/辅助</p>
  </section>

  <!-- ===== 4. 全组件换肤演示 ===== -->
  <section class="demo-block">
    <h2>🧩 组件自动换肤（同一套 token）</h2>

    <div class="comp-row">
      <UiButton>主要</UiButton>
      <UiButton variant="secondary">次要</UiButton>
      <UiButton variant="danger">危险</UiButton>
      <UiButton variant="ghost">幽灵</UiButton>
      <UiButton loading>加载</UiButton>
      <UiButton disabled>禁用</UiButton>
    </div>

    <div class="comp-row">
      <UiBadge color="blue">蓝色</UiBadge>
      <UiBadge color="green">绿色</UiBadge>
      <UiBadge color="orange">橙色</UiBadge>
      <UiBadge color="red" dot pulse />
      <UiBadge color="gray">灰色</UiBadge>
    </div>

    <div class="comp-grid">
      <UiCard title="卡片标题" subtitle="副标题" hover>
        卡片表面用 <code>--ui-panel</code>，边框 <code>--ui-border</code>，
        标题 <code>--ui-text-1</code>。hover 时上浮 + 主色描边。
      </UiCard>
      <div class="form-col">
        <UiInput v-model="inputVal" label="用户名" placeholder="试试输入" />
        <UiSelect
          label="优先级"
          :options="[
            { label: '低', value: 'low' },
            { label: '中', value: 'medium' },
            { label: '高', value: 'high' },
          ]"
        />
        <UiSwitch v-model="switchVal" label="通知" active-text="开" inactive-text="关" />
        <UiTextarea label="备注" :rows="2" placeholder="多行文本" show-count :maxlength="30" />
      </div>
    </div>

    <div class="comp-row" style="margin-top: 16px">
      <UiProgress :value="progress" show-text style="flex:1; max-width: 320px" />
      <UiButton size="sm" @click="progress = (progress + 20) % 101">进度+</UiButton>
      <UiButton variant="secondary" size="sm" @click="showModal = true">打开弹窗</UiButton>
    </div>
  </section>

  <!-- 模态框（Teleport 到 body，同样能换肤） -->
  <UiModal v-model="showModal" title="主题下的模态框" width="420px">
    <p>模态框 Teleport 到 <code>body</code>，但样式用 token，所以跟着主题走。</p>
    <p style="margin-top: 8px">深色/浅色都协调，这就是语义化设计令牌的好处。</p>
    <template #footer>
      <UiButton variant="ghost" @click="showModal = false">关闭</UiButton>
    </template>
  </UiModal>
</template>

<style scoped>
.page-head { margin-bottom: 24px; }
h1 { font-size: 26px; color: var(--ui-text-1); }
.sub { color: var(--ui-text-2); margin-top: 6px; }
.demo-block {
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 14px; padding: 22px 24px; margin-bottom: 18px;
}
.demo-block h2 { font-size: 15px; margin-bottom: 14px; color: var(--ui-text-1); }
.controls { display: flex; flex-wrap: wrap; gap: 10px; }
.status { display: flex; align-items: center; gap: 10px; margin-top: 16px; color: var(--ui-text-2); font-size: 14px; }
.status b { color: var(--ui-text-1); }
.status .hint { color: var(--ui-text-3); font-size: 12px; }
.note { color: var(--ui-text-3); font-size: 12px; margin-top: 14px; font-family: ui-monospace, monospace; }

/* 表面层级色板 */
.surface-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.swatch { border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
.swatch span { font-weight: 700; font-size: 12px; color: var(--ui-text-1); }
.swatch code { font-size: 11px; color: var(--ui-text-2); }

/* 组件行/栅格 */
.comp-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 14px; }
.comp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-col { display: flex; flex-direction: column; gap: 12px; }
@media (max-width: 640px) { .comp-grid { grid-template-columns: 1fr; } }
</style>
