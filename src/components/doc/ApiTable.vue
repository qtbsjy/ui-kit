<script setup lang="ts">
// ApiTable —— 通用组件 API 表格（作品⑱）
// 按 Props / Slots / Events 分组渲染表格，数据来自 docsData。
import { groupApi } from '../../docs/docsData'
import type { ComponentDoc } from '../../docs/docsData'
import { computed } from 'vue'

const props = defineProps<{ doc: ComponentDoc }>()

const groups = computed(() => groupApi(props.doc.api))

const KIND_TITLE: Record<string, { label: string; color: string }> = {
  props: { label: 'Props (属性)', color: 'var(--ui-primary)' },
  slots: { label: 'Slots (插槽)', color: 'var(--ui-success, #22c55e)' },
  events: { label: 'Events (事件)', color: 'var(--ui-warning, #f59e0b)' },
}

function kindStyle(kind: string) {
  const m = KIND_TITLE[kind]
  return m ? { background: m.color + '22', color: m.color } : {}
}
function kindLabel(kind: string) {
  return KIND_TITLE[kind]?.label ?? kind
}
</script>

<template>
  <div class="api-block" v-for="(rows, kind) in groups" :key="kind">
    <h4 v-if="rows.length" class="api-head">
      <span class="api-tag" :style="kindStyle(kind)">
        {{ kindLabel(kind) }}
      </span>
    </h4>
    <table v-if="rows.length" class="api-table">
      <thead>
        <tr>
          <th style="width: 22%">名称</th>
          <th style="width: 30%">类型</th>
          <th style="width: 15%">默认值</th>
          <th>说明</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="kind + row.name">
          <td><code class="name">{{ row.name }}</code></td>
          <td><code class="type">{{ row.type }}</code></td>
          <td><code class="def">{{ row.default }}</code></td>
          <td class="desc">{{ row.desc }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.api-block { margin-bottom: 20px; }
.api-head { margin-bottom: 10px; }
.api-tag {
  display: inline-block; padding: 4px 10px; border-radius: 6px;
  font-size: 13px; font-weight: 600;
}
.api-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
  border: 1px solid var(--ui-border); border-radius: 10px; overflow: hidden;
}
.api-table th {
  text-align: left; padding: 10px 14px; background: var(--ui-bg-soft);
  color: var(--ui-text-2); font-weight: 600; border-bottom: 1px solid var(--ui-border);
}
.api-table td { padding: 10px 14px; border-bottom: 1px solid var(--ui-border); color: var(--ui-text-1); vertical-align: top; }
.api-table tr:last-child td { border-bottom: none; }
.api-table tr:hover td { background: var(--ui-hover); }
.api-table .name { color: var(--ui-primary); font-weight: 600; }
.api-table .type { color: var(--ui-text-2); }
.api-table .def { color: var(--ui-text-3); }
.api-table .desc { color: var(--ui-text-2); line-height: 1.5; }
code {
  background: var(--ui-hover); padding: 2px 6px; border-radius: 4px;
  font-size: 12px; font-family: ui-monospace, 'Cascadia Code', monospace;
}
</style>
