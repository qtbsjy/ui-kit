<script setup lang="ts">
/**
 * TabsView —— 作品㉙ 标签页 演示页
 *
 * 展示 UiTabs + UiTabPanel：
 *   1. 基础标签页（非受控 defaultActive + 面板联动）
 *   2. v-model 受控切换（用按钮外部控制）
 *   3. 禁用项
 *   4. card 卡片风格 + 懒挂载 lazy
 */
import { ref } from 'vue'
import { UiTabs, UiTabPanel, UiButton, UiCard, UiBadge } from '../components'

// —— 基础示例：非受控 ——
const baseTabs = [
  { label: '简介', value: 'about' },
  { label: '成员', value: 'team' },
  { label: '设置', value: 'settings' },
]

// —— 受控示例：外部按钮切换 ——
const active = ref('one')
const ctrlTabs = [
  { label: '标签一', value: 'one' },
  { label: '标签二', value: 'two' },
  { label: '标签三', value: 'three' },
]

// —— 卡片 + 懒挂载示例 ——
const cardTabs = [
  { label: '概览', value: 'overview' },
  { label: '数据分析', value: 'analytics', disabled: true },
  { label: '报告', value: 'report' },
]

// —— 可关闭标签（作品㉚ 进阶）——
const closableTabs = ref([
  { label: '首页', value: 'home' },
  { label: '文档', value: 'docs' },
  { label: '设置', value: 'settings', closable: false },
])
function closeTab(value: string | number) {
  closableTabs.value = closableTabs.value.filter((t) => t.value !== value)
}
// 动态新增标签
const addCounter = ref(1)
const dynTabs = ref([
  { label: `标签 1`, value: 'tab-1' },
])
const dynActive = ref('tab-1')
function addTab() {
  addCounter.value++
  const value = `tab-${addCounter.value}`
  dynTabs.value = [...dynTabs.value, { label: `标签 ${addCounter.value}`, value }]
}
function closeDynamic(value: string | number) {
  dynTabs.value = dynTabs.value.filter((t) => t.value !== value)
}
</script>

<template>
  <div class="tabs-view">
    <h1>UiTabs 标签页</h1>
    <p class="lead">
      数据驱动标签条 + UiTabPanel 面板联动（provide/inject 解耦），键盘无障碍 + 滑动指示器。
    </p>

    <UiCard title="基础标签页（非受控）" style="max-width: 720px">
      <UiTabs :tabs="baseTabs" default-active="team">
        <UiTabPanel name="about">
          <p>🚀 这是「简介」面板。默认激活了「成员」（defaultActive），点标签可切换。</p>
          <p>面板和标签完全解耦：面板不知道 tabs 数组，只靠 name 关联。</p>
        </UiTabPanel>
        <UiTabPanel name="team">
          <div class="team">
            <UiBadge color="blue">前端</UiBadge>
            <UiBadge color="green">后端</UiBadge>
            <UiBadge color="orange">设计</UiBadge>
            <span style="margin-left: 8px">切换带淡入淡出动画</span>
          </div>
        </UiTabPanel>
        <UiTabPanel name="settings">
          <p>⚙️ 设置面板内容：可放任意组件或表单。</p>
        </UiTabPanel>
      </UiTabs>
    </UiCard>

    <UiCard title="v-model 受控 + 外部按钮切换" style="max-width: 720px">
      <div style="margin-bottom: 16px">
        <UiButton
          v-for="t in ctrlTabs"
          :key="t.value"
          :variant="active === t.value ? 'primary' : 'ghost'"
          size="sm"
          style="margin-right: 8px"
          @click="active = t.value"
        >
          {{ t.label }}
        </UiButton>
      </div>
      <UiTabs v-model="active" :tabs="ctrlTabs">
        <UiTabPanel name="one"><p>一：受控模式下，激活态完全由 <code>active</code> 决定。</p></UiTabPanel>
        <UiTabPanel name="two"><p>二：外部按钮和标签点击都能改 v-model。</p></UiTabPanel>
        <UiTabPanel name="three"><p>三：这是第三个面板。</p></UiTabPanel>
      </UiTabs>
    </UiCard>

    <UiCard title="卡片风格 + 禁用项 + 懒挂载(lazy)" style="max-width: 720px">
      <UiTabs :tabs="cardTabs" type="card" default-active="report">
        <UiTabPanel name="overview"><p>📊 概览面板（已即时挂载）。</p></UiTabPanel>
        <UiTabPanel name="analytics"><p>这一项被 disabled，点不到。</p></UiTabPanel>
        <UiTabPanel name="report" lazy>
          <p>📄 报告面板用了 <code>lazy</code>：首次被激活前不渲染内容（这里默认激活它就是它先挂载）。</p>
        </UiTabPanel>
      </UiTabs>
    </UiCard>

    <UiCard title="可关闭标签（作品㉚ 进阶）" style="max-width: 720px">
      <UiTabs :tabs="closableTabs" closable default-active="home">
        <UiTabPanel name="home"><p>🏠 首页。点其他标签的 ✕ 可关闭（设置项 closable:false 关不掉）。</p></UiTabPanel>
        <UiTabPanel name="docs"><p>📚 文档页。</p></UiTabPanel>
        <UiTabPanel name="settings"><p>⚙️ 设置页——这个被设为不可关闭。</p></UiTabPanel>
      </UiTabs>
      <p style="margin-top: 12px; color: var(--ui-text-2)">关闭当前激活项会自动切到相邻标签。</p>
    </UiCard>

    <UiCard title="动态新增/删除标签（v-model + 自动校准）" style="max-width: 720px">
      <div style="margin-bottom: 16px">
        <UiButton size="sm" @click="addTab">＋ 新增标签</UiButton>
      </div>
      <UiTabs v-model="dynActive" :tabs="dynTabs" closable type="card" @close="closeDynamic">
        <UiTabPanel v-for="t in dynTabs" :key="t.value" :name="t.value">
          <p>📑 这是 <code>{{ t.label }}</code> 的动态面板内容。</p>
        </UiTabPanel>
      </UiTabs>
      <p style="margin-top: 12px; color: var(--ui-text-2)">v-model 受控 + 动态增删：删除当前激活项时 active 自动校准到剩余标签。</p>
    </UiCard>
  </div>
</template>

<style scoped>
.tabs-view { padding: 24px; }
h1 { margin: 0 0 8px; color: var(--ui-text-1); }
.lead { color: var(--ui-text-2); margin: 0 0 24px; }
.team { display: flex; align-items: center; gap: 8px; }
code { background: var(--ui-border); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
</style>
