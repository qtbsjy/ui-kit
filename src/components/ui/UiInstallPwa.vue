<script setup lang="ts">
// ============================================================
// UiInstallPwa —— 安装/离线/更新 提示条组件（作品㉔）
// ------------------------------------------------------------
// 学习重点:
//   1. 结合 usePWA composable: 一套状态(可安装/在线/更新)驱动多个提示
//   2. 全屏遮罩一层: 未安装且可安装 → 显示"安装"按钮(触发原生 prompt)
//   3. 底部浮动条: 离线时提示"仍可离线浏览"; 有更新时提示"刷新应用"
//   4. display-mode standalone 判断: 已安装成独立应用后不再提示安装
// ============================================================
import { usePWA } from '../../composables/usePWA'

const { isStandalone, isOnline, canInstall, updateAvailable, installApp, updateSW } = usePWA()

async function onInstall() {
  const ok = await installApp()
  // 安装成功或失败都由 composable 管理状态, 这里无需额外处理
  void ok
}

async function onUpdate() {
  const applied = await updateSW()
  // 已触发 skipWaiting, SW 接管后页面自动刷新(由 SW 端处理)
  void applied
}
</script>

<template>
  <!-- ① 安装提示：未安装成独立应用 且 可安装 -->
  <div v-if="!isStandalone && canInstall" class="ui-pwa-install">
    <div class="ui-pwa-card">
      <span class="ui-pwa-logo">🧩</span>
      <div class="ui-pwa-info">
        <strong>安装 UiKit 组件库</strong>
        <span>添加为独立应用，随时打开、离线可用</span>
      </div>
      <button class="ui-pwa-btn" type="button" @click="onInstall">安装</button>
      <button class="ui-pwa-close" type="button" aria-label="忽略" @click="canInstall = false">✕</button>
    </div>
  </div>

  <!-- ② 离线提示（浏览时无网） -->
  <div v-if="!isOnline" class="ui-pwa-tip ui-pwa-tip--offline">📡 当前离线，仍可浏览已缓存内容</div>

  <!-- ③ 新版可用提示 -->
  <div v-if="updateAvailable" class="ui-pwa-tip ui-pwa-tip--update">
    <span>✨ 有新版本可用</span>
    <button type="button" @click="onUpdate">立即刷新</button>
  </div>
</template>

<style scoped>
.ui-pwa-install {
  position: fixed; inset: 0; z-index: 999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(2px);
}
.ui-pwa-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 16px; padding: 18px 20px; max-width: 420px;
  box-shadow: var(--ui-shadow); animation: pwa-pop .18s ease;
}
.ui-pwa-logo { font-size: 30px; }
.ui-pwa-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.ui-pwa-info strong { color: var(--ui-text-1); font-size: 14px; }
.ui-pwa-info span { color: var(--ui-text-3); font-size: 12px; }
.ui-pwa-btn {
  padding: 8px 18px; border: none; border-radius: 8px; cursor: pointer;
  background: var(--ui-primary); color: #fff; font-size: 13px; font-weight: 600;
}
.ui-pwa-btn:hover { opacity: 0.9; }
.ui-pwa-close {
  border: none; background: none; cursor: pointer; color: var(--ui-text-3);
  font-size: 14px; padding: 4px;
}
.ui-pwa-tip {
  position: fixed; left: 50%; transform: translateX(-50%); z-index: 998;
  display: flex; align-items: center; gap: 10px;
  padding: 9px 16px; border-radius: 999px; font-size: 13px;
  box-shadow: var(--ui-shadow);
}
.ui-pwa-tip--offline { bottom: 20px; background: var(--ui-warning-soft, #fef3c7); color: var(--ui-warning, #92400e); }
.ui-pwa-tip--update { bottom: 20px; background: var(--ui-primary-soft, #eef2ff); color: var(--ui-primary); }
.ui-pwa-tip--update button {
  border: none; background: var(--ui-primary); color: #fff; cursor: pointer;
  padding: 4px 12px; border-radius: 999px; font-size: 12px;
}
@keyframes pwa-pop {
  from { opacity: 0; transform: scale(0.96) translateY(8px); }
  to { opacity: 1; transform: none; }
}
</style>
