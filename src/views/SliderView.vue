<script setup lang="ts">
// SliderView —— UiSlider 滑条演示页
import { ref } from 'vue'
import UiSlider from '../components/ui/UiSlider.vue'

const volume = ref(60)
const brightness = ref(42)
const price = ref<[number, number]>([30, 120])
const range2 = ref<[number, number]>([10, 90])

const disabled = ref(50)
</script>

<template>
  <div class="page">
    <h1>🎚️ UiSlider 滑条</h1>
    <p class="sub">单值 / 双端 range，基于原生 input，键盘+无障碍白拿（作品㉞）</p>

    <h2>基础单值</h2>
    <div class="card">
      <UiSlider v-model="volume" label="音量" :min="0" :max="100" show-value />
      <p class="hint">volume: {{ volume }}</p>
    </div>

    <h2>步长 + 值域</h2>
    <div class="card">
      <UiSlider v-model="brightness" label="亮度" :min="0" :max="100" :step="5" show-value />
      <p class="hint">step=5, brightness: {{ brightness }}</p>
    </div>

    <h2>双端 range（价格区间）</h2>
    <div class="card">
      <UiSlider v-model="price" label="价格范围" :min="0" :max="200" :step="10" range show-value />
      <p class="hint">选中的区间: {{ price[0] }} ~ {{ price[1] }} 元</p>
    </div>

    <h2>双端 range（百分比）</h2>
    <div class="card">
      <UiSlider v-model="range2" range show-value />
      <p class="hint">range: {{ range2[0] }}% - {{ range2[1] }}%</p>
    </div>

    <h2>禁用</h2>
    <div class="card">
      <UiSlider v-model="disabled" label="锁定值" disabled show-value />
    </div>

    <div class="hint-block">
      💡 轨道填充用独立 div 渲染（淡底 + 主色区），规避 webkit/moz 引擎差异；双端 = 两个原生 range 叠加，动态限制下/上限防交叉，键盘方向键由浏览器原生支持。
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
  padding: 20px; margin-bottom: 8px;
}
.hint { font-size: 12px; color: var(--ui-text-3); margin: 10px 0 0; font-family: monospace; }
.hint-block { font-size: 13px; color: var(--ui-text-3); margin-top: 20px; line-height: 1.8; }
</style>
