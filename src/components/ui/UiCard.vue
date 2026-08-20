<script setup lang="ts">
// UiCard —— 卡片容器组件
// 学习重点:
//   1. 具名插槽: header / default / footer
//   2. 可选 props: title / subtitle
//   3. 插槽回退（当没有对应插槽时不渲染容器）
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** 是否带 hover 上浮效果 */
    hover?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    hover: false,
  },
)
</script>

<template>
  <section class="ui-card" :class="{ 'is-hover': hover }">
    <!-- 标题区：优先展示 title/subtitle prop，也可用 header 插槽完全自定义 -->
    <header v-if="title || $slots.header" class="ui-card__head">
      <slot name="header">
        <div>
          <h3 v-if="title" class="ui-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="ui-card__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </header>

    <!-- 主体内容：默认插槽 -->
    <div class="ui-card__body">
      <slot />
    </div>

    <!-- 底部：可选 footer 插槽 -->
    <footer v-if="$slots.footer" class="ui-card__foot">
      <slot name="footer" />
    </footer>
  </section>
</template>

<style scoped>
.ui-card {
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 16px; overflow: hidden;
}
.ui-card.is-hover { transition: transform .2s, border-color .2s, box-shadow .2s; }
.ui-card.is-hover:hover { transform: translateY(-4px); border-color: var(--ui-primary); box-shadow: var(--ui-shadow); }
.ui-card__head { padding: 18px 22px 0; }
.ui-card__title { font-size: 17px; color: var(--ui-text-1); margin: 0; }
.ui-card__subtitle { font-size: 13px; color: var(--ui-text-2); margin: 4px 0 0; }
.ui-card__body { padding: 18px 22px; }
.ui-card__foot { padding: 14px 22px; border-top: 1px solid var(--ui-divider); }
</style>
