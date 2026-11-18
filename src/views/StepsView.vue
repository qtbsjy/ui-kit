<script setup lang="ts">
// StepsView —— UiSteps 步骤条演示页（作品㊴）
import { computed, ref } from 'vue'
import UiSteps from '../components/ui/UiSteps.vue'
import UiButton from '../components/ui/UiButton.vue'

interface StepItem {
  title: string
  description?: string
  icon?: string
  status?: 'wait' | 'process' | 'finish' | 'error'
  disabled?: boolean
  extra?: string
}

// 基础流程
const basic = ref<StepItem[]>([
  { title: '填写信息', description: '企业基础资料' },
  { title: '资质审核', description: '1-3 个工作日' },
  { title: '签署合同', description: '电子签章' },
  { title: '完成入驻', description: '开通账号' },
])

const active = ref(1)

// 可点击跳转
const clickActive = ref(0)

// 带错误态
const errorSteps = ref<StepItem[]>([
  { title: '提交申请', description: '已提交' },
  { title: '资料审核', description: '营业执照已过期', status: 'error' },
  { title: '缴纳费用' },
  { title: '开通服务' },
])

// 竖向 + 自定义图标 + extra
const verticalSteps = ref<StepItem[]>([
  { title: '下单成功', description: '订单号 20261118001', icon: '🛒', extra: '10:02' },
  { title: '商家发货', description: '顺丰快递 SF1234567890', icon: '📦', extra: '10:35' },
  { title: '运输中', description: '预计 11 月 19 日送达', icon: '🚚', extra: '14:20' },
  { title: '待收货', icon: '🏠' },
])

const simpleItems = ref<StepItem[]>([
  { title: '待付款' },
  { title: '待发货' },
  { title: '待收货' },
  { title: '已完成' },
])

const prev = () => {
  if (active.value > 0) active.value--
}
const next = () => {
  if (active.value < basic.value.length - 1) active.value++
}
const reset = () => (active.value = 0)

const progressText = computed(() => `${active.value + 1} / ${basic.value.length}`)
</script>

<template>
  <div class="page">
    <h1>UiSteps 步骤条</h1>
    <p class="sub">引导用户按流程完成任务的导航组件，支持横向 / 纵向、状态机、可点击跳转、错误态。</p>

    <h2>基础用法（受控 active）</h2>
    <div class="card">
      <UiSteps :items="basic" :active="active" />
      <div class="row">
        <UiButton size="sm" :disabled="active === 0" @click="prev">上一步</UiButton>
        <UiButton size="sm" :disabled="active === basic.length - 1" @click="next">下一步</UiButton>
        <UiButton size="sm" variant="ghost" @click="reset">重置</UiButton>
        <span class="hint">当前进度：{{ progressText }}</span>
      </div>
    </div>

    <h2>可点击跳转</h2>
    <div class="card">
      <UiSteps :items="basic" v-model:active="clickActive" clickable />
      <p class="hint">clickable：点击任意步骤跳到该步（受 v-model:active 控制）；disabled 的步骤不可点</p>
    </div>

    <h2>错误状态</h2>
    <div class="card">
      <UiSteps :items="errorSteps" :active="1" />
      <p class="hint">item.status = 'error'：圆点变红显示 ✕，连接线也变错误色，优先级高于位置推算</p>
    </div>

    <h2>竖向布局 + 自定义图标 + 时间戳</h2>
    <div class="card">
      <UiSteps :items="verticalSteps" direction="vertical" :active="2" />
      <p class="hint">direction="vertical"：适合时间线式的长流程；icon 可自定义 emoji，extra 显示附注</p>
    </div>

    <h2>简洁模式 + 小尺寸</h2>
    <div class="card">
      <UiSteps :items="simpleItems" :active="2" simple size="small" />
      <p class="hint">simple 隐藏描述文字，size="small" 缩小圆点与字号</p>
    </div>

    <h2>自定义颜色</h2>
    <div class="card">
      <UiSteps :items="basic" :active="2" finish-color="#10b981" error-color="#f43f5e" />
      <p class="hint">finish-color / error-color 覆盖主题色</p>
    </div>

    <div class="hint-block">
      💡 <b>状态机</b>：当前步骤之前的自动「已完成」，当前「进行中」，之后「等待」；item.status 可强制覆盖。<br>
      💡 <b>连接线</b>：每条线的颜色取决于它左侧步骤是否已完成/错误，不用手写。<br>
      💡 <b>双模式</b>：不传 active 用 defaultActive（内部自管）；传 active 就是受控，点击只 emit 不改状态。<br>
      💡 <b>语义化</b>：根元素用 &lt;ol&gt;/&lt;li&gt;，进行中步骤带 aria-current="step"。
    </div>
  </div>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 24px 16px 48px; }
.page h1 { font-size: 26px; margin: 0 0 4px; }
.page h2 { font-size: 17px; margin: 26px 0 12px; color: var(--ui-text-2); }
.sub { color: var(--ui-text-3); margin: 0 0 8px; }
.card {
  border: 1px solid var(--ui-border); background: var(--ui-bg-soft); border-radius: 12px;
  padding: 20px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 14px;
}
.row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.hint { font-size: 12px; color: var(--ui-text-3); margin: 0; }
.hint-block { font-size: 13px; color: var(--ui-text-3); margin-top: 20px; line-height: 1.8; }
</style>
