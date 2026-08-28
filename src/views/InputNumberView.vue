<script setup lang="ts">
// InputNumberView —— UiInputNumber 数字输入框演示页
import { ref } from 'vue'
import UiInputNumber from '../components/ui/UiInputNumber.vue'

const count = ref<number | null>(3)
const stock = ref<number | null>(0)
const price = ref<number | null>(19.9)
const percent = ref<number | null>(50)
const locked = ref<number | null>(7)
const noCtrl = ref<number | null>(12)
</script>

<template>
  <div class="page">
    <h1>🔢 UiInputNumber 数字输入框</h1>
    <p class="sub">步进按钮 + 长按加速 + min/max 约束 + 失焦钳制（作品㉟）</p>

    <h2>基础数量</h2>
    <div class="card">
      <UiInputNumber v-model="count" label="数量" :min="0" :max="99" />
      <p class="hint">count: {{ count }}</p>
    </div>

    <h2>库存：下限 0 + 步长 5</h2>
    <div class="card">
      <UiInputNumber v-model="stock" label="库存" :min="0" :max="200" :step="5" />
      <p class="hint">step=5, min=0, stock: {{ stock }}</p>
    </div>

    <h2>价格：精确两位小数</h2>
    <div class="card">
      <UiInputNumber v-model="price" label="金额（元）" :min="0" :step="0.5" :precision="2" />
      <p class="hint">precision=2, step=0.5, price: {{ price }}</p>
    </div>

    <h2>百分比：0-100</h2>
    <div class="card">
      <UiInputNumber v-model="percent" label="完成度" :min="0" :max="100" />
      <p class="hint">percent: {{ percent }}%</p>
    </div>

    <h2>禁用 + 错误态</h2>
    <div class="card">
      <UiInputNumber v-model="locked" label="锁定值" disabled />
      <UiInputNumber v-model="price" label="金额" error="金额不能为负" :min="0" />
    </div>

    <h2>隐藏步进按钮（纯输入）</h2>
    <div class="card">
      <UiInputNumber v-model="noCtrl" label="直接输入" :show-controls="false" />
      <p class="hint">show-controls=false, noCtrl: {{ noCtrl }}</p>
    </div>

    <div class="hint-block">
      💡 步进按钮支持<b>长按加速</b>：按住 400ms 后开始连发，随步数递增（最多 ×5）。失焦时自动把值钳制回 [min, max] 并按住 precision 四舍五入；非法输入自动回退到上次合法值；留空置 null。
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 640px; margin: 0 auto; padding: 24px 16px 48px; }
.page h1 { font-size: 26px; margin: 0 0 4px; }
.page h2 { font-size: 17px; margin: 26px 0 12px; color: var(--ui-text-2); }
.sub { color: var(--ui-text-3); margin: 0 0 8px; }
.card {
  border: 1px solid var(--ui-border); background: var(--ui-bg-soft); border-radius: 12px;
  padding: 20px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 8px; max-width: 320px;
}
.hint { font-size: 12px; color: var(--ui-text-3); margin: 0; font-family: monospace; }
.hint-block { font-size: 13px; color: var(--ui-text-3); margin-top: 20px; line-height: 1.8; max-width: 640px; }
</style>
