<script setup lang="ts">
// ============================================================
// UiSkeleton —— 骨架屏加载占位组件（作品㉒ · Suspense/加载态）
// ------------------------------------------------------------
// 用法:
//   <UiSkeleton :rows="3" />                                  ← 3 行文本条
//   <UiSkeleton variant="circle" />                           ← 圆形(头像)
//   <UiSkeleton width="60%" />                                ← 指定宽度
//   <UiSkeleton :rows="2" :avatar="true" />                   ← 头像 + 2 行
// ------------------------------------------------------------
// 学习重点:
//   1. 骨架屏 = 真实内容加载前的"低保真占位", 给用户减少感知等待
//   2. 用 CSS 动画(呼吸光晕)模拟加载中, 配合 Suspense 的 pending 态
//   3. 纯展示组件: 不关心数据从哪来, 只负责占位视觉
//   4. props 驱动布局(变体/行列/宽度), 灵活组合成各种区块骨架
// ============================================================
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 变体: rect 矩形 / circle 圆形(头像) / text 文本条 */
    variant?: 'rect' | 'circle' | 'text'
    /** 文本/矩形条数 */
    rows?: number
    /** 每行高度 px */
    height?: number
    /** 宽度(数 px / 百分比字符串) */
    width?: string | number
    /** 是否显示头像圆(左上角) */
    avatar?: boolean
    /** 是否显示标题条(第一行加粗) */
    title?: boolean
  }>(),
  {
    variant: 'text',
    rows: 3,
    height: 14,
    avatar: false,
    title: false,
  },
)

// 行数(含 title 占一行)
const lineCount = computed(() => (props.title ? props.rows + 1 : props.rows))

// 根 class: 用确定的字符串拼, 避免模板里 ${variant} 的 union 推断问题
const baseClass = computed<string>(() => `ui-skeleton ui-skeleton--${props.variant}`)

// 每行宽度: 标题 100%, 其余交错变化更像真实文本
function rowWidth(i: number): string {
  if (props.title && i === 0) return '100%'
  const widths = ['100%', '92%', '85%', '78%', '70%', '60%'] as const
  // as const 后索引仍可能是 undefined(noUncheckedIndexedAccess), 显式断言为 string
  return widths[i % widths.length] as string
}
</script>

<template>
  <div :class="baseClass" role="status" aria-label="加载中">
    <span class="sr-only">加载中…</span>
    <div v-if="avatar" class="ui-skeleton__avatar"></div>
    <div class="ui-skeleton__body">
      <div
        v-for="i in lineCount"
        :key="i"
        class="ui-skeleton__line"
        :style="{
          height: height + 'px',
          width: variant === 'circle' ? 'auto' : rowWidth(i - 1),
        }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.ui-skeleton {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.ui-skeleton--circle {
  display: inline-flex;
}
/* 呼吸光晕动画 */
.ui-skeleton__line,
.ui-skeleton__avatar {
  background: linear-gradient(
    90deg,
    var(--ui-bg-soft) 25%,
    var(--ui-hover) 37%,
    var(--ui-bg-soft) 63%
  );
  background-size: 400% 100%;
  animation: ui-skeleton-shimmer 1.4s ease infinite;
  border-radius: 6px;
}
.ui-skeleton__line {
  margin-bottom: 10px;
}
.ui-skeleton__line:last-child {
  margin-bottom: 0;
}
.ui-skeleton__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ui-skeleton--circle .ui-skeleton__line {
  border-radius: 50%;
}
/* 无障碍: 视觉隐藏, 供屏幕阅读器 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@keyframes ui-skeleton-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
</style>
