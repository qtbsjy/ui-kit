<script setup lang="ts">
// ============================================================
// DirectivesView —— 自定义指令集 Demo（作品㉓）
// ------------------------------------------------------------
// 学习重点:
//   1. vLongPress 长按 —— 按下计时 + 位移取消 + 移动端/桌面通用
//   2. vDebounce 防抖 —— 输入停顿才触发, 避免每次 keystroke 打请求
//   3. vClickOutside 点击外部 —— 捕获阶段监听, 下拉/弹层点外关闭
// ------------------------------------------------------------
import { ref } from 'vue'

// vLongPress 演示
const pressCount = ref(0)
const Pressed = () => {
  pressCount.value++
}

// vDebounce 演示
const searchInput = ref('')
const debouncedLog = ref<Array<{ t: string; v: string }>>([])
function onSearch(e: Event) {
  const v = (e.target as HTMLInputElement)?.value ?? searchInput.value
  debouncedLog.value.unshift({ t: new Date().toLocaleTimeString('zh-CN', { hour12: false }), v })
  if (debouncedLog.value.length > 5) debouncedLog.value.pop()
}

// vClickOutside 演示
const dropdownOpen = ref(false)
const clickLog = ref(0)
function closeDropdown() {
  dropdownOpen.value = false
  clickLog.value++
}
</script>

<template>
  <header class="page-head">
    <h1>🛠️ 自定义指令集 Demo</h1>
    <p class="sub">
      vLongPress 长按 · vDebounce 防抖 · vClickOutside 点击外部 · 作品㉓
    </p>
  </header>

  <!-- ===== 1. vLongPress ===== -->
  <section class="demo-block">
    <h2>⏱️ vLongPress 长按（500ms）</h2>
    <p class="desc">按住按钮 0.5 秒触发。移动超过 10px 视为拖拽自动取消。桌面 + 移动端通用。</p>
    <div class="controls">
      <button class="lp-btn" v-long-press="Pressed">按住我 0.5s</button>
      <UiBadge color="blue">触发次数: {{ pressCount }}</UiBadge>
    </div>
  </section>

  <!-- ===== 2. vDebounce ===== -->
  <section class="demo-block">
    <h2>⚡ vDebounce 防抖（300ms）</h2>
    <p class="desc">连续输入只在停顿 300ms 后触发一次回调 —— 避免每次敲键都触发搜索请求。</p>
    <input
      v-model="searchInput"
      v-debounce="onSearch"
      class="db-input"
      placeholder="输入点什么…(停顿 300ms 后记录)"
    />
    <div class="db-log">
      <p v-if="!debouncedLog.length" class="muted">等待输入…防抖后才会记录</p>
      <p v-for="(item, i) in debouncedLog" :key="i" class="db-item">
        <span class="db-time">{{ item.t }}</span>
        <span>触发: "{{ item.v }}"</span>
      </p>
    </div>
  </section>

  <!-- ===== 3. vClickOutside ===== -->
  <section class="demo-block">
    <h2>🖱️ vClickOutside 点击外部（下拉菜单）</h2>
    <p class="desc">点击框外关闭下拉菜单（捕获阶段监听 document）。已记录关闭次数。</p>
    <div style="position: relative; display: inline-block">
      <UiButton @click="dropdownOpen = !dropdownOpen">菜单 {{ dropdownOpen ? '▲' : '▼' }}</UiButton>
      <div v-if="dropdownOpen" v-click-outside="closeDropdown" class="dd">
        <div class="dd-item">📄 编辑</div>
        <div class="dd-item">📋 复制</div>
        <div class="dd-item danger">🗑️ 删除</div>
      </div>
    </div>
    <UiBadge color="green" style="margin-left: 16px">点外关闭次数: {{ clickLog }}</UiBadge>
  </section>
</template>

<style scoped>
.page-head { margin-bottom: 24px; }
h1 { font-size: 26px; color: var(--ui-text-1); }
.sub { color: var(--ui-text-2); margin-top: 6px; }
.demo-block {
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 14px; padding: 22px 24px; margin-bottom: 18px;
}
.demo-block h2 { font-size: 15px; margin-bottom: 8px; color: var(--ui-text-1); }
.desc { color: var(--ui-text-3); font-size: 12px; margin-bottom: 14px; }
.controls { display: flex; align-items: center; gap: 12px; }

/* 长按按钮 */
.lp-btn {
  padding: 10px 18px; border-radius: 8px; border: 1px solid var(--ui-border-hover);
  background: var(--ui-primary-soft); color: var(--ui-primary); font-size: 14px; cursor: pointer;
  transition: transform .1s, background .2s; user-select: none; -webkit-user-select: none;
}
.lp-btn:active { transform: scale(0.97); background: var(--ui-primary-border); }

/* 防抖输入 */
.db-input {
  width: 100%; max-width: 340px; padding: 9px 12px; border-radius: 8px;
  border: 1px solid var(--ui-border); background: var(--ui-bg-soft); color: var(--ui-text-1);
  font-size: 14px; margin-bottom: 10px;
}
.db-input:focus { outline: 2px solid var(--ui-primary-border); }
.db-log { display: flex; flex-direction: column; gap: 4px; }
.db-item { font-size: 13px; color: var(--ui-text-1); font-family: ui-monospace, monospace; }
.db-time { color: var(--ui-text-3); margin-right: 8px; font-size: 12px; }
.muted { color: var(--ui-text-3); font-size: 13px; }

/* 下拉菜单 */
.dd {
  position: absolute; top: 44px; left: 0; z-index: 20; min-width: 160px;
  background: var(--ui-panel); border: 1px solid var(--ui-border); border-radius: 10px;
  box-shadow: var(--ui-shadow); padding: 4px; animation: dd-in .12s ease;
}
@keyframes dd-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.dd-item {
  padding: 8px 12px; border-radius: 6px; font-size: 13px; color: var(--ui-text-1); cursor: pointer;
}
.dd-item:hover { background: var(--ui-hover); }
.dd-item.danger { color: var(--ui-danger); }
</style>
