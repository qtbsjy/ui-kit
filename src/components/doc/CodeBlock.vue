<script setup lang="ts">
// CodeBlock —— 代码示例展示（作品⑱）
// 简单的代码高亮（基于 token 的极简高亮，不引入额外依赖），带复制按钮。
import { computed, ref } from 'vue'

const props = defineProps<{ code: string; language?: string }>()

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* 剪贴板不可用时静默 */
  }
}

/** 极简 HTML 标签高亮（足够清晰，无需 highlight.js） */
const highlighted = computed(() => {
  const esc = props.code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return esc
    .replace(/(&lt;\/?)([a-zA-Z][\w-]*)/g, '$1<span class="tok-tag">$2</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="tok-comment">$1</span>')
    .replace(/(&quot;[^&]*?&quot;)/g, '<span class="tok-str">$1</span>')
    .replace(/\b(v-model|v-if|v-for|v-show|v-bind|:ref|@click|defineProps|defineModel|defineExpose|generic|template|script|style)\b/g, '<span class="tok-kw">$1</span>')
})
</script>

<template>
  <div class="code-block">
    <div class="code-head">
      <span class="lang">{{ language || 'vue' }}</span>
      <button class="copy-btn" :class="{ copied }" @click="copy">
        {{ copied ? '✓ 已复制' : '⧉ 复制' }}
      </button>
    </div>
    <pre class="code-body"><code v-html="highlighted"></code></pre>
  </div>
</template>

<style scoped>
.code-block {
  border: 1px solid var(--ui-border); border-radius: 12px; overflow: hidden;
  background: #0f172a; /* 深色代码背景，两主题通用 */
}
.code-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px; background: #1e293b; border-bottom: 1px solid #374151;
}
.lang { font-size: 12px; color: #94a3b8; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: .5px; }
.copy-btn {
  font-size: 12px; color: #cbd5e1; background: transparent; border: 1px solid #475569;
  border-radius: 6px; padding: 3px 10px; cursor: pointer; transition: all .15s;
}
.copy-btn:hover { background: #334155; }
.copy-btn.copied { color: #4ade80; border-color: #4ade80; }
.code-body { margin: 0; padding: 16px; overflow-x: auto; }
.code-body code { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 13px; line-height: 1.7; color: #e2e8f0; white-space: pre; }
:deep(.tok-tag) { color: #7dd3fc; }
:deep(.tok-kw) { color: #c084fc; font-weight: 600; }
:deep(.tok-str) { color: #86efac; }
:deep(.tok-comment) { color: #64748b; font-style: italic; }
</style>
