<script setup lang="ts">
// ComponentDoc —— 组件文档页（作品⑱ · 数据驱动）
// 通用渲染器：读 docsData 中对应组件文档，按统一布局输出
//   1. 头部（名称 / 中文名 / 分类 / tagline / 描述）
//   2. 现场演示（根据组件 id 渲染真实可交互示例）
//   3. 学习点（作品进化轨迹）
//   4. API 表格（Props / Slots / Events）
//   5. 代码示例（CodeBlock 高亮 + 复制）
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { docs, categories, getDoc } from '../docs/docsData'
import ApiTable from '../components/doc/ApiTable.vue'
import CodeBlock from '../components/doc/CodeBlock.vue'
import LiveDemos from '../components/doc/LiveDemos.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => String(route.params.id || 'button'))
const doc = computed(() => getDoc(id.value))

function go(nid: string) {
  router.push({ name: 'doc', params: { id: nid } })
}
</script>

<template>
  <div v-if="doc" class="doc">
    <!-- ===== 头部 ===== -->
    <header class="doc-head">
      <div class="head-meta">
        <span class="cat">{{ doc.category }}</span>
        <h1>{{ doc.name }}</h1>
        <span class="cn">{{ doc.cn }}</span>
      </div>
      <p class="tagline">{{ doc.tagline }}</p>
    </header>

    <!-- ===== 描述 ===== -->
    <section class="block">
      <h3>📖 介绍</h3>
      <p v-for="(p, i) in doc.desc" :key="i" class="intro-p">{{ p }}</p>
    </section>

    <!-- ===== 现场演示（真实可交互） ===== -->
    <section class="block">
      <h3>🧪 现场演示</h3>
      <div class="live" :key="doc.id">
        <LiveDemos :id="doc.id" />
      </div>
    </section>

    <!-- ===== 学习点 ===== -->
    <section class="block">
      <h3>🎓 本组件用到的技术点</h3>
      <ul class="learned">
        <li v-for="(l, i) in doc.learned" :key="i">{{ l }}</li>
      </ul>
    </section>

    <!-- ===== API ===== -->
    <section class="block">
      <h3>🧾 API</h3>
      <ApiTable :doc="doc" />
    </section>

    <!-- ===== 代码示例 ===== -->
    <section class="block">
      <h3>💻 示例代码</h3>
      <div v-for="(ex, i) in doc.examples" :key="i" class="ex">
        <h4>{{ ex.title }}</h4>
        <p class="ex-desc">{{ ex.desc }}</p>
        <CodeBlock :code="ex.code" />
      </div>
    </section>

    <!-- ===== 分类快捷导航 ===== -->
    <nav class="doc-nav">
      <template v-for="cat in categories" :key="cat">
        <span class="nav-cat">{{ cat }}</span>
        <button
          v-for="c in docs.filter((d) => d.category === cat)"
          :key="c.id"
          class="nav-btn"
          :class="{ active: c.id === doc.id }"
          @click="go(c.id)"
        >
          {{ c.cn }}
        </button>
      </template>
    </nav>
  </div>

  <div v-else class="missing">
    <h2>未找到组件 {{ id }}</h2>
    <UiButton @click="go('button')">返回按钮文档</UiButton>
  </div>
</template>

<style scoped>
.doc { display: flex; flex-direction: column; gap: 24px; }
.doc-head { border-bottom: 1px solid var(--ui-border); padding-bottom: 20px; }
.head-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
h1 { font-size: 30px; color: var(--ui-text-1); margin: 0; }
.cn { font-size: 16px; color: var(--ui-text-2); }
.cat {
  background: var(--ui-primary-soft); color: var(--ui-primary);
  padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 600;
}
.tagline { margin-top: 12px; color: var(--ui-text-2); font-size: 15px; }
.block {
  background: var(--ui-panel); border: 1px solid var(--ui-border);
  border-radius: 16px; padding: 22px 26px;
}
.block h3 { font-size: 17px; margin-bottom: 14px; color: var(--ui-text-1); }
.intro-p { color: var(--ui-text-2); font-size: 14px; line-height: 1.8; margin: 0 0 8px; }
.intro-p:last-child { margin-bottom: 0; }
.learned { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.learned li { color: var(--ui-text-1); font-size: 14px; }
.live { }
.ex { margin-bottom: 20px; }
.ex:last-child { margin-bottom: 0; }
.ex h4 { font-size: 15px; margin-bottom: 6px; color: var(--ui-text-1); }
.ex-desc { color: var(--ui-text-2); font-size: 13px; margin: 0 0 12px; }
.doc-nav {
  display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center;
  padding-top: 8px; border-top: 1px solid var(--ui-border);
}
.nav-cat { font-size: 13px; font-weight: 600; color: var(--ui-text-3); margin-right: 2px; }
.nav-btn {
  border: 1px solid var(--ui-border); background: var(--ui-bg-soft); color: var(--ui-text-2);
  border-radius: 8px; padding: 5px 12px; font-size: 13px; cursor: pointer; transition: all .15s;
}
.nav-btn:hover { color: var(--ui-text-1); border-color: var(--ui-primary); }
.nav-btn.active { background: var(--ui-primary); color: #fff; border-color: var(--ui-primary); }
.missing { text-align: center; padding: 60px 0; color: var(--ui-text-2); }
.missing h2 { margin-bottom: 20px; }
</style>
