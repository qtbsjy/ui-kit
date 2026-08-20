import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署时需要子路径 base（作品㉕ 部署到 qtbsjy.github.io/ui-kit/）
  // 本地 dev/preview 保持 '/'；CI 里用 VITE_BASE_URL 环境变量覆盖
  base: process.env.VITE_BASE_URL || '/',
  plugins: [
    vue(),
    vueDevTools(),
    // PWA 支持：离线可用 + 可安装到桌面/手机（作品㉔）
    // 学习重点:
    //   1. registerType 'autoUpdate' → SW 有新版自动更新
    //   2. injectRegister 'auto' → 自动注入 SW 注册脚本(index.html)
    //   3. workbox.globPatterns → 预缓存构建产物, 离线也能开
    //   4. manifest → 名称/图标/主题色, 浏览器据此弹"安装应用"提示
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['pwa-512.svg'],
      manifest: {
        name: 'UiKit 组件库',
        short_name: 'UiKit',
        description: '布鲁的 Vue 组件库演示站 — 15+ 组件 / 5 指令 / 4 composable',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-512.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Vitest 测试配置（使用 jsdom 环境测 Vue 组件）
  test: {
    environment: 'jsdom',
    // jsdom 需要非 opaque origin 才有 localStorage（默认 about:blank 拿不到）
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    globals: true,
    include: ['src/**/*.spec.ts'],
  },
})
