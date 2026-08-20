// Vite lib 模式配置 —— 把 UiKit 打包成可发布的 npm 包
// 产出: dist/lib/ 下 ESM + UMD + .css + .d.ts 类型声明
// vue 作为外部依赖（peer），不打进包里
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  // lib 模式不需要 public 目录资源
  publicDir: false,
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.app.json',
      // 生成的 .d.ts 放在 dist/lib/types（与打包产物分开，避免被 outDir 清理干扰）
      outDir: 'dist/lib/types',
      entryRoot: 'src',
      include: ['src/components/**/*.ts', 'src/components/**/*.vue', 'src/composables/**/*.ts', 'src/directives/**/*.ts', 'src/vite-env.d.ts'],
      insertTypesEntry: true,
      copyDtsFiles: true,
      rollupTypes: false,
    }),
  ],
  build: {
    outDir: 'dist/lib',
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/components/index.ts'),
      name: 'UiKit',
      formats: ['es', 'umd'],
      fileName: (format) => `ui-kit.${format === 'es' ? 'mjs' : 'umd.js'}`,
    },
    rollupOptions: {
      external: ['vue', 'zod'],
      output: {
        exports: 'named',
        globals: { vue: 'Vue', zod: 'zod' },
      },
    },
  },
})
