<script setup lang="ts">
// TreeView —— UiTree 树形控件演示页
import { ref } from 'vue'
import UiTree from '../components/ui/UiTree.vue'
import type { TreeNode } from '../components/ui/treeContext'

// 基础的组织架构树
const org: TreeNode[] = [
  {
    label: '总部',
    value: 'hq',
    children: [
      {
        label: '研发中心',
        value: 'rd',
        children: [
          { label: '前端组', value: 'fe' },
          { label: '后端组', value: 'be' },
          { label: '测试组', value: 'qa' },
        ],
      },
      { label: '市场部', value: 'mkt' },
      { label: '财务部', value: 'fin' },
    ],
  },
  { label: '华东分公司', value: 'east' },
  { label: '华南分公司', value: 'south' },
]

// 选中联动树（复用 org）
// 懒加载示例：区域 → 动态加载城市
const regions: TreeNode[] = [
  { label: '华东区', value: 'r-east' },
  { label: '华北区', value: 'r-north' },
]

async function loadChildren(node: TreeNode): Promise<TreeNode[]> {
  await new Promise((r) => setTimeout(r, 500))
  const childrenByRegion: Record<string, TreeNode[]> = {
    'r-east': [
      { label: '上海', value: 'sh' },
      { label: '杭州', value: 'hz' },
      { label: '南京', value: 'nj' },
    ],
    'r-north': [
      { label: '北京', value: 'bj' },
      { label: '天津', value: 'tj' },
    ],
  }
  return childrenByRegion[String(node.value)] ?? [{ label: '无数据', value: 'none', isLeaf: true }]
}

const keyword = ref('')
const expanded = ref<(string | number)[]>(['hq'])
const checked = ref<(string | number)[]>([])
</script>

<template>
  <div class="page">
    <h1>🌳 UiTree 树形控件</h1>
    <p class="sub">递归树 + 展开/折叠 + 父子选中联动 + 懒加载 + 过滤（作品㊱）</p>

    <h2>基础树（默认折叠）</h2>
    <div class="card">
      <UiTree :data="org" />
    </div>

    <h2>默认全部展开 + 树形连线</h2>
    <div class="card">
      <UiTree :data="org" default-expand-all show-line />
    </div>

    <h2>父子选中联动（复选框）</h2>
    <div class="card">
      <UiTree :data="org" checkable default-expand-all />
      <p class="hint">勾选父 → 后代全选；子部分勾选 → 父半选</p>
    </div>

    <h2>受控展开 + 受控选中</h2>
    <div class="card">
      <UiTree v-model:expanded-keys="expanded" v-model:checked-keys="checked" :data="org" checkable />
      <p class="hint">expanded: {{ expanded.join(', ') || '无' }}</p>
      <p class="hint">checked: {{ checked.join(', ') || '无' }}</p>
    </div>

    <h2>懒加载</h2>
    <div class="card">
      <UiTree :data="regions" :load="loadChildren" />
      <p class="hint">展开「华东区」/「华北区」会异步加载城市（延迟 500ms）</p>
    </div>

    <h2>过滤</h2>
    <div class="card">
      <input v-model="keyword" placeholder="输入关键字过滤，如「组」「华东」" class="filter" />
      <UiTree :data="org" :filter-text="keyword" default-expand-all />
    </div>

    <div class="hint-block">
      💡 <b>递归渲染</b>：UiTreeNode 自引用 + provide/inject 共享树上下文（展开集 / 选中集 / 半选集 / 回调）。<br>
      💡 <b>选中联动</b>：勾选父 → 后代全选；取消祖先链；子部分勾选 → 父半选（indeterminate）；子全选 → 父自动选。<br>
      💡 <b>懒加载</b>：展开时调 load 变异 node.children，loading 态自动出现；isLeaf 可强制叶节点。<br>
      💡 <b>过滤</b>：命中节点及其祖先强制展开显示，命中 label 高亮。
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
  padding: 20px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 10px;
}
.hint { font-size: 12px; color: var(--ui-text-3); margin: 0; font-family: monospace; }
.hint-block { font-size: 13px; color: var(--ui-text-3); margin-top: 20px; line-height: 1.8; max-width: 640px; }
.filter {
  background: var(--ui-bg); border: 1px solid var(--ui-border); border-radius: 8px;
  padding: 8px 12px; color: var(--ui-text-1); font-size: 14px;
}
.filter:focus { outline: none; border-color: var(--ui-primary); }
</style>
