<script setup lang="ts">
// UiSpacer —— 间距占位（作品⑭）
// 学习重点:
//   1. 垂直/水平留白，抽象出通用间距 token
//   2. size: 档位(xs/sm/md/lg/xl/xxl)或任意数值(px)，映射到间距 token/变量
//   3. axis: vertical(高=size) / horizontal(宽=size)
//   4. 纯 CSS，用 CSS 变量 --ui-sp 输出尺寸
withDefaults(
  defineProps<{
    /** 间距档位（xs=4/sm=8/md=16/lg=24/xl=32/xxl=48）或任意像素数 */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | number
    /** 方向：vertical(纵向留白)/horizontal(横向留白) */
    axis?: 'vertical' | 'horizontal'
  }>(),
  {
    size: 'md',
    axis: 'vertical',
  },
)
</script>

<template>
  <div
    class="ui-spacer"
    :class="[
      typeof size === 'string' ? `ui-spacer--${size}` : '',
      `ui-spacer--${axis}`,
    ]"
    :style="typeof size === 'number' ? { '--ui-sp': `${size}px` } : undefined"
  ></div>
</template>

<style scoped>
.ui-spacer { display: block; }

/* 纵向留白：高度 = 间距 */
.ui-spacer--vertical {
  width: 100%;
  height: var(--ui-sp, 16px);
  flex: none;
}

/* 横向留白：宽度 = 间距 */
.ui-spacer--horizontal {
  height: 100%;
  width: var(--ui-sp, 16px);
  flex: none;
  display: inline-block;
  vertical-align: middle;
}

/* 档位映射 */
.ui-spacer--xs { --ui-sp: 4px; }
.ui-spacer--sm { --ui-sp: 8px; }
.ui-spacer--md { --ui-sp: 16px; }
.ui-spacer--lg { --ui-sp: 24px; }
.ui-spacer--xl { --ui-sp: 32px; }
.ui-spacer--xxl { --ui-sp: 48px; }
</style>
