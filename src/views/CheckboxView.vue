<script setup lang="ts">
// CheckboxView —— UiCheckbox / UiCheckboxGroup / UiRadio / UiRadioGroup 演示页
import { ref } from 'vue'
import UiCheckbox from '../components/ui/UiCheckbox.vue'
import UiCheckboxGroup from '../components/ui/UiCheckboxGroup.vue'
import UiRadio from '../components/ui/UiRadio.vue'
import UiRadioGroup from '../components/ui/UiRadioGroup.vue'

// 独立单选框
const agree = ref(false)
const newsletter = ref(true)

// 复选组（多选）
const hobbies = ref<string[]>(['reading'])
const hobbyOptions = [
  { label: '📚 阅读', value: 'reading' },
  { label: '🏃 运动', value: 'sports' },
  { label: '🎵 音乐', value: 'music' },
  { label: '🎮 游戏', value: 'gaming' },
]

// 单选组
const gender = ref('male')
const genderOptions = [
  { label: '👨 男', value: 'male' },
  { label: '👩 女', value: 'female' },
  { label: '⚧ 其它', value: 'other' },
]

// 受控复选组（全选展示）
const fruits = ref<string[]>(['apple'])
const fruitOptions = [
  { label: '🍎 苹果', value: 'apple' },
  { label: '🍌 香蕉', value: 'banana' },
  { label: '🍊 橙子', value: 'orange' },
]
</script>

<template>
  <div class="page">
    <h1>☑️ UiCheckbox / UiRadio 表单家族</h1>
    <p class="sub">复选框 + 复选组 + 单选项 + 单选组，provide/inject 联动（作品㉝）</p>

    <h2>独立复选框</h2>
    <div class="controls">
      <UiCheckbox v-model="agree" label="我同意用户协议" />
      <UiCheckbox v-model="newsletter" label="接收产品更新邮件" />
      <UiCheckbox label="禁用项（不可点）" disabled />
      <span class="hint">agree: {{ agree }} / newsletter: {{ newsletter }}</span>
    </div>

    <h2>复选组（多选 + 全选）</h2>
    <UiCheckboxGroup
      v-model="hobbies"
      :options="hobbyOptions"
      label="兴趣爱好"
      show-check-all
    />
    <p class="hint">已选: {{ hobbies.length ? hobbies.join(', ') : '（空）' }}</p>

    <h2>单选组</h2>
    <UiRadioGroup v-model="gender" :options="genderOptions" label="性别" />
    <p class="hint">当前: {{ gender }}</p>

    <h2>受控复选组（外部控制）</h2>
    <div class="controls">
      <button @click="fruits = fruitOptions.map((o) => o.value)">全选</button>
      <button @click="fruits = []">清空</button>
      <span class="hint">fruits: {{ fruits.join(', ') || '（空）' }}</span>
    </div>
    <UiCheckboxGroup v-model="fruits" :options="fruitOptions" />

    <h2>自定义插槽（非数据驱动）</h2>
    <UiCheckboxGroup v-model="hobbies">
      <UiCheckbox value="reading" label="📚 阅读" />
      <UiCheckbox value="sports" label="🏃 运动" />
      <UiCheckbox value="coding" label="💻 编码" />
    </UiCheckboxGroup>
  </div>
</template>

<style scoped>
.page { max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }
.page h1 { font-size: 26px; margin: 0 0 4px; }
.page h2 { font-size: 18px; margin: 28px 0 12px; color: var(--ui-text-2); }
.sub { color: var(--ui-text-3); margin: 0 0 8px; }
.controls { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
.controls button {
  border: 1px solid var(--ui-border); background: var(--ui-bg-soft); color: var(--ui-text-1);
  border-radius: 8px; padding: 6px 14px; font-size: 13px; cursor: pointer; transition: all .2s;
}
.controls button:hover { border-color: var(--ui-primary); color: var(--ui-primary); }
.hint { font-size: 13px; color: var(--ui-text-3); margin: 8px 0 0; }
</style>
