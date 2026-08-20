# 🎨 UiKit —— 布鲁的 TypeScript Vue 组件库

布鲁的**第六个 Vue 作品** + **第一次用 TypeScript 写 Vue**。
一套可复用的通用 UI 组件，配一个文档展示站。

## 技术栈

- Vue 3（Composition API + `<script setup lang="ts">`）
- **TypeScript**（vue-tsc 类型检查）⚠️ 本次核心新学
- Vite 8 + Vue Router（懒加载路由）

## 组件清单（10 个）

| 组件 | 说明 | 关键技术点 |
|------|------|-----------|
| UiButton | 按钮 | props 校验、$attrs 透传原生属性、loading |
| UiBadge | 徽标 | 自定义 validator 限制颜色、圆点/呼吸 |
| UiCard | 卡片 | 具名插槽 header/footer、插槽回退 |
| UiModal | 模态框 | **Teleport**、**v-model**、**defineExpose**、Transition |
| UiProgress | 进度条 | computed 样式绑定、数值钳制 |
| UiToast | 消息提示 | **命令式 $toast**、TransitionGroup、全局挂载 |
| **UiInput** | 输入框 | **defineModel**、label/错误、透传、前缀插槽 |
| **UiTextarea** | 文本域 | defineModel、行数、字符计数、maxlength |
| **UiSelect** | 下拉选择 | defineModel、options 数据驱动 |
| **UiSwitch** | 开关 | defineModel&lt;boolean&gt;、aria、过渡动画 |

## 本作品新学到（重点）

### 1. TypeScript 版本 Vue（首秀）⚠️
- `<script setup lang="ts">` + `defineProps<{...}>()` **类型化props**（用泛型，不用运行时写法）
- `withDefaults()` 给类型化 props 加默认值
- `npm run type-check`（vue-tsc）**编译期静态类型检查**，能抓出运行时才发现的 bug
- 本次实际抓到一个：UiModal 的 `modelValue` 声明为必填，但命令式 `ref.open()` 场景不需要传 → 改成可选+默认 false 修复

### 2. `<Teleport>`（UiModal 核心）
```html
<Teleport to="body">...</Teleport>
```
把弹层**传送到 body 顶层**，脱离父级样式/定位/overflow 上下文，避免被裁切或遮挡。

### 3. v-model 组件内部实现
```ts
defineProps<{ modelValue?: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()
// 关闭时 emit('update:modelValue', false)
```
父组件 `<UiModal v-model="show">`，实现真正的双向绑定。

### 4. defineExpose 命令式调用
```ts
defineExpose({ open: () => emit('update:modelValue', true), close })
```
父组件 `ref` 拿实例直接调 `modal.open()/close()`，不需要 v-model。

### 5. $attrs 透传（UiButton）
`inheritAttrs` 默认 true，原生属性（type/title/disabled/data-*）自动落到根元素 `<button>` 上。

### 6. 组件库注册机制
```ts
const UiKit = { install(app) { /* app.component 逐个注册 */ } }
app.use(UiKit)  // 全局可用 <UiButton> 等，无需 import
```

### 7. 全局命令式 Toast
install 时挂一个**隐藏的 Toast 根实例**（独立 createApp）+ `createApp(h(UiToast))`，拿到实例后把 `$toast.success/error/info` 挂到 `app.config.globalProperties`。

## 打包成 npm 包（vite lib 模式，新增）

UiKit 现在**可以作为一个 npm 包安装使用**，不再需要复制源码。

```bash
npm run build:lib   # 打包到 dist/lib/
```

产出：
- `dist/lib/ui-kit.mjs`（ESM）
- `dist/lib/ui-kit.umd.js`（UMD）
- `dist/lib/ui-kit.css`（样式）
- `dist/lib/index.d.ts` + 各组件 `.vue.d.ts`（类型声明）

使用方安装后：
```ts
import 'ui-kit/style.css'        // 引入样式
import UiKit from 'ui-kit'        // 默认导出 install
app.use(UiKit)                     // 全局注册 + $toast
// 或按需: import { UiButton } from 'ui-kit'
```

### lib 打包要点
- 独立配置 `vite.lib.config.ts`（避免和 app 构建/测试冲突）
- `vue` 作为 **external/peerDependency**，不打进包里
- `vite-plugin-dts` 生成类型声明
- package.json 的 `exports` 暴露 `.`（JS）和 `./style.css`（样式）两个子路径
- `formats: ['es','umd']` + `output.exports:'named'`（避免 MIXED_EXPORTS 警告）
- `publicDir: false`（lib 打包不需要 public 资源）
- 本地测试安装: 在 task-manager 里 `npm install ../ui-kit`（file: 协议），已验证 imports 正常

## 单元测试（Vitest，新增）

首次给组件写单元测试，用 Vitest + @vue/test-utils + jsdom。

```bash
npm test          # 跑一次
npm run test:watch # 监听模式
```

**26 个测试全通过**，覆盖：
- UiButton: 变体/尺寸类、禁用、loading spinner、属性透传、点击事件
- UiBadge: 插槽文字、dot 模式、颜色
- UiProgress: 条宽、数值钳制(0-100)、百分比文字
- UiInput: v-model 双向、错误态、透传、disabled
- UiSwitch: aria 状态、点击切换/disabled、active/inactive 文本
- UiSelect: options 渲染、选择 emit、label/错误

### 测试踩坑
- vite.config.ts 的 `test` 配置需从 `vitest/config` 导入 `defineConfig`（不是 `vite`），否则 TS 报 test 属性不存在

## 展示文档站

| 路由 | 页面 |
|------|------|
| `/` | 组件总览（一页看完全部） |
| `/button` | 按钮详细文档 |
| `/modal` | 模态框详细文档（v-model/Teleport/命令式/嵌套） |
| `/toast` | Toast 命令式用法 |

路由全部懒加载，build 产物各自独立 chunk。

## 工程组织

```
ui-kit/
├── index.html / vite.config.ts / package.json / verify-dev.mjs
└── src/
    ├── main.ts            # app.use(router) + app.use(UiKit)
    ├── App.vue            # 顶栏导航 + RouterView
    ├── assets/main.css    # 深色主题
    ├── router/index.ts    # 懒加载路由
    ├── components/
    │   ├── index.ts       # 统一出口：具名导出 + install 全局注册 + $toast
    │   └── ui/            # 6 个组件
    └── views/             # Home / Button / Modal / Toast
```

## 验证

- ✅ `npm run type-check`（vue-tsc）通过
- ✅ `npm run build` 生产构建通过（57 modules，懒加载拆分正确）
- ✅ `node verify-dev.mjs`：4 路由 + 14 模块全部 200

## 运行

```bash
npm install
npm run dev        # 开发
npm run type-check # TS 类型检查
npm run build      # 生产构建
```

---

## 主题系统（作品⑮）🎨

UiKit 从「写死颜色」升级为**语义化 Design Tokens** 驱动的深浅色主题系统，组件零改动自动换肤。

### Design Tokens（`src/theme/tokens.css`）

把散落各组件的硬编码颜色，收敛为一组**语义化 CSS 变量**（token），组件只引用 `var(--ui-*)`，不再写死颜色：

| 令牌 | 用途 | 浅色值 | 深色值 |
|------|------|--------|--------|
| `--ui-bg` / `--ui-bg-soft` | 页面背景 | `#f8fafc` / `#f1f5f9` | `#0f172a` / `#0b1120` |
| `--ui-panel` / `--ui-panel-hover` | 卡片/面板 | `#fff` / `#f8fafc` | `#1e293b` / `#263449` |
| `--ui-border` / `--ui-border-hover` | 边框/分隔 | `#0f172a1a` / `#0f172a33` | `#fff1a` / `#fff3` |
| `--ui-text-1/2/3` | 文字层级 | `#0f172a`/`#475569`/`#94a3b8` | `#e2e8f0`/`#94a3b8`/`#64748b` |
| `--ui-primary(-hover/-soft/-border)` | 品牌色 | 蓝系 |（同值不变） |
| `--ui-success/warning/danger/info` | 状态色 | 语义色（不变） |
| `--ui-hover` / `--ui-overlay` | 悬停/遮罩 | 微黑 / `#0f172a80` | 微白 / `#0008c` |
| `--ui-shadow` / `--ui-shadow-lg` | 阴影 | | 更重的黑影 |

三层定义，优先级从低到高：
1. `:root` —— 浅色默认值
2. `[data-theme='dark']` —— 手动深色（覆盖浅色）
3. `@media (prefers-color-scheme: dark) { :root:not([data-theme]) }` —— 跟随系统（用户未手动选择时）

> 关键：**只要用户手动设了 `data-theme`，就不再响应系统媒体查询** —— 手动选择优先于系统偏好。

### useTheme 组合式函数（`src/composables/useTheme.ts`）

**模块级单例**，`install()` 在导入时执行（不用在组件里 onMounted），保证任何组件拿到同一份状态：

```ts
const { theme, preference, isDark, isSystem, toggle, setTheme, resetToSystem, withTransition } = useTheme()
```

- `theme`：当前生效主题（`light` | `dark`，不含 system）
- `preference`：用户偏好（`light` | `dark` | `system`）
- `isDark` / `isSystem`：派生布尔
- `setTheme('light'|'dark'|'system')`：设偏好 + 写 localStorage + 应用到 `<html data-theme>`
- `toggle()`：light ↔ dark 切换
- `resetToSystem()`：清除手动偏好，恢复跟随系统
- `withTransition(fn)`：切换时加 `.theme-transition` 平滑过渡

### 防 FOUC（`index.html`）

在 `<head>` 放一段内联脚本，**在 CSS/JS 加载前**按 localStorage 或系统偏好先设好 `data-theme`，避免深色用户首屏闪白：

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem('ui-kit-theme')
      if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    } catch (e) {}
  })()
</script>
```

### 本次新学到（重点）

1. **CSS 自定义属性做设计令牌**：组件只引用 `var(--ui-*)`，一套代码双主题自动换肤，比每个组件写死颜色可维护得多
2. **手动偏好 > 系统偏好**：`data-theme` 一旦设置就不再响应 `prefers-color-scheme`；`@media` 只在 `:root:not([data-theme])` 时生效
3. **模块级单例 composable**：`install()` 在模块顶层执行一次，替代 `onMounted`，测试/任意组件调用都不报生命周期警告
4. **环境兜底**：`localStorage` / `matchMedia` 都要 `try-catch` + 类型检查（SSR / 隐私模式 / jsdom 都可能没有）—— jsdom 默认 `about:blank` 起不来 localStorage，需在 vitest 里配 `environmentOptions.jsdom.url`
5. **防 FOUC 内联脚本**：主题状态要在 CSS 渲染前就位，不能等 JS bundle 加载完
6. **tokens 打进 lib**：`components/index.ts` 里 `import '../theme/tokens.css'`，lib 打包后 `ui-kit.css` 自带主题系统

### 验证

- ✅ `npm run type-check` 通过
- ✅ `npm test`：**64 个测试全通过**（含 7 个 useTheme 测试）
- ✅ `npm run build` 生产构建通过（ThemeView 独立懒加载 chunk）
- ✅ `npm run build:lib`：ui-kit.css 已含设计令牌 + 深色/系统主题

---

## 虚拟滚动列表（作品⑯）⚡

`UiVirtualList` 应对**大数据量渲染**：5 万条数据只渲染视口内约 20~30 个 DOM，丝滑不卡。

### 原理

外层一个定高可滚动容器，内部用 top/bottom 两个占位 div 撑起总高度（滚条比例真实），中间只渲染视口内的行：

```
┌─────────────────────┐  scrollTop
│  top 占位 (startIdx×h) │  ← 把可视内容推到正确位置
│  ┌───────────────┐  │
│  │ 视口内的行     │  │  ← 只切片渲染这些
│  └───────────────┘  │
│  bottom 占位        │
└─────────────────────┘
```

### 用法

```vue
<UiVirtualList :items="rows" :row-height="56" :overscan="5">
  <template #default="{ item, index }">…{{ item.name }}…</template>
</UiVirtualList>
```

Props：`items`（数据）/ `rowHeight`（每行高，默认 48）/ `overscan`（上下多渲染 N 行，默认 3）/ `scrollable`（是否可滚，默认 true）。暴露 `refresh()` 可手动重测容器尺寸。

> 泛型组件 `<script setup generic="T">`：slot 里 `item` 直接是 `T`，类型推导完整，不用手写 index signature。

### 本次新学到（重点）

1. **虚拟滚动核心**：只渲染视口 slice + 占位撑总高，O(1) 算起始索引，滚多快都不卡
2. **泛型组件** `generic="T"`：让 slot 类型完整推导（比固定 `Record<string,unknown>` 强太多）
3. **rAF 节流**：scroll 事件不直接改状态，攒到渲染帧再更新，避免高频抖动
4. **测试 jsdom 技巧**：clientHeight 恒 0 + ResizeObserver 不触发 → mock `Element.prototype` + 构造即回调的 ResizeObserver + `nextTick`
5. **lib dts include**：`vite.env.d.ts` 要加进 `dts({ include })` 才认得 `*.css` 副作用导入（TS2882）

### 验证

- ✅ `npm run type-check` 通过
- ✅ `npm test`：**71 个测试全通过**（原 64 + 7 个 UiVirtualList）
- ✅ `npm run build`：VirtualListView 独立懒加载 chunk
- ✅ `npm run build:lib`：ui-kit.css 13.49kB + UiVirtualList.vue.d.ts 泛型类型齐全

---

## 动态行高虚拟列表（作品⑰）📏

`UiVirtualList` 的 `variable` 模式应对**行高不固定**：内容长短不一、可展开/收起的高动态列表，依然正确滚动与定位。

### 原理（估算 + 偏移缓存 + 二分查找）

固定行高能 O(1) 算偏移，动态行高不行——因为每行高度未知。核心思路：

1. **估算占位**：未测量的行用 `estimatedRowHeight` 估算高度填进偏移数组，滚动条比例先大致正确
2. **实测修正**：每行渲染后用 `ResizeObserver` 实测真实高度，写入 `heights` 缓存，并把**该行及之后所有偏移平移 delta**
3. **二分查找**：滚动时二分 `offsets` 数组，O(log n) 找到起始行（不用遍历）
4. **渐进准确**：滚到哪、测到哪，未滚到的行继续用估算（和 vue-virtual-scroller / TanStack Virtual 一致）

```
offsets[i] = 第 i 行顶部偏移（累计高度）
height 缓存 = { 0: 120, 1: 96, ... }  // 实测过的行
setActualHeight(i, h) → offsets[i+1..] 全部 += (h - 旧高度)
```

### 用法

```vue
<UiVirtualList :items="rows" variable :estimated-row-height="64" :overscan="4">
  <template #default="{ item, index, measure }">
    <!-- 动态行必须在根节点绑 measure ref，让组件读到真实高度 -->
    <div :ref="measure" :data-index="index">…变高内容…</div>
  </template>
</UiVirtualList>
```

关键：slot 会额外拿到 `measure`（一个 curried ref 回调），把它绑到行根元素上即可。`variable` 为 false（默认）时走固定行高 O(1) 路径，不受影响。

### 本次新学到（重点）

1. **响应式失效坑**：`offsets` 是普通数组，改它不触发 Vue 重渲染 → 用一个 `bump` ref 计数，computed 里 `void bump.value` 建立依赖
2. **delta 平移**：某行高度变化 = 该行 + 后续所有行偏移一起平移，O(n) 修正（n 是行数，可优化为分段）
3. **二分定位**：`offsets` 单调递增 → 二分找第一个 > scrollTop 的项，起始行 = lo-1
4. **slot ref 类型**：`measure` 回调要兼容 Vue `VNodeRef` 的宽泛类型（`Element | ComponentPublicInstance | null`），内部再 `instanceof HTMLElement` 收敛
5. **jsdom 测 offsetHeight**：jsdom 的 `offsetHeight` 定义在 `HTMLElement.prototype`（不是 `Element.prototype`，后者会被遮蔽）

### 验证

- ✅ `npm run type-check` 通过
- ✅ `npm test`：**77 个测试全通过**（原 71 + 6 个动态行高测试）
- ✅ `npm run build` / `build:lib`（ui-kit.mjs 21.23kB，d.ts 含 variable/measure）

---

## 数据驱动组件文档站（作品⑱）📚

UiKit 从"零散演示页"升级为**系统化组件文档站**：14 个组件条目全覆盖，一个页面渲染所有文档。

### 核心设计：数据驱动
所有文档内容（描述 / Props / Slots / Events / 示例代码 / 学习点）集中存在 `src/docs/docsData.ts` 一份数据里。UI 组件（`ComponentDoc.vue` + `ApiTable.vue` + `CodeBlock.vue` + `LiveDemos.vue`）只负责渲染这份数据。
- **加新组件 = 加一条数据**，页面自动生成，零额外代码
- **API 一致**：每个组件都有 Props/Slots/Events 表格 + 现场试玩 + 示例代码
- **48 处 API 类型与源码逐一核对**，保证文档准确

### 页面组成
1. **头部**：名称 / 中文名 / 分类徽标 / tagline / 分段介绍
2. **现场演示（LiveDemos）**：每个组件真实可交互（输入框实时校验、弹窗开关、虚拟列表滚动…）
3. **学习点**：本组件用到的技术（作品进化轨迹）
4. **API 表格（ApiTable）**：Props / Slots / Events 分组高亮，类型 / 默认值 / 说明
5. **示例代码（CodeBlock）**：极简正则高亮（零三方依赖）+ 一键复制
6. **分类导航**：通用 / 表单 / 反馈 / 布局 / 数据 快捷切换

### 数据规模
- 14 条组件记录（`UiGrid+UiGridItem` 合并为"响应式栅格"）
- 78 条 API 行（props/slots/events）
- 18 个示例代码块

### 路由
`/doc/:id?`（懒加载）→ 每个组件一个文档页，如 `/doc/button`、`/doc/virtual`。

### 本次新学到
1. **数据驱动文档**：文档内容存数据而非页面，组件库持续演进时文档零维护成本
2. **`Record<string,T>` 索引可能 undefined**：`KIND_TITLE[kind]` 提取成 `kindStyle/kindLabel` 安全访问函数
3. **懒加载优化**：`ComponentDoc` 独立 chunk（33kB），主 bundle 从 163kB → 65kB，首屏更快
4. **useFormValidator 正确签名**：接收 `ZodType<unknown>` 单参（`z.object({...})` 整体传入），不是对象 map
5. **命令式 $toast 类型**：`<script setup>` 里 `$toast` 无法识别 → `getCurrentInstance().proxy as any` 收敛

### 验证
- ✅ type-check 通过
- ✅ 77 个测试全通过（无回归）
- ✅ 生产 build：ComponentDoc 独立懒加载 chunk，路由 200
