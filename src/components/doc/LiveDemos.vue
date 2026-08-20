<script setup lang="ts">
// LiveDemos —— 组件现场演示（作品⑱ · 数据驱动文档站）
// 根据组件 id 渲染对应组件的真实可交互演示（非静态截图）。
// 这是文档站的"灵魂"：每个组件都能当场试玩。
import { ref, reactive, getCurrentInstance } from 'vue'
import { useFormValidator } from '../../composables/useFormValidator'
import { z } from 'zod'

const props = defineProps<{ id: string }>()

// 拿全局 $toast（类型上不识别，手动收敛）
const proxy = getCurrentInstance()?.proxy as any
const toast = (type: 'success' | 'error' | 'info', msg: string) => proxy?.$toast?.[type]?.(msg)

// ---------- 模态框演示状态 ----------
const showModal = ref(false)
const toastMsg = ref('')

// ---------- 进度条演示 ----------
const progress = ref(30)
function tick() {
  progress.value += 20
  if (progress.value > 100) progress.value = 0
}

// ---------- 表单演示（Input 实时校验 + 提交） ----------
const f = reactive({ username: '', email: '' })
const { errors: fErrors, validateField, validateAll } = useFormValidator(
  z.object({
    username: z.string().min(2, '用户名至少 2 个字符'),
    email: z.string().email('邮箱格式不正确'),
  }),
)
const submitted = ref(false)
function submitForm() {
  if (validateAll(f)) {
    submitted.value = true
    toast('success', '表单校验通过！')
    setTimeout(() => (submitted.value = false), 2500)
  }
}

// ---------- 开关演示 ----------
const notifOn = ref(true)
const darkPref = ref(false)

// ---------- 虚拟列表演示 ----------
const virtualItems = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  title: `第 ${i} 条记录`,
  text: ['短文案', '中等长度的一段说明文字', '很长的内容，用来演示动态行高的自适应测量与偏移缓存二分查找定位逻辑', '又一段'].join('') + ` · #${i}`,
}))
</script>

<template>
  <!-- ============ 按钮 ============ -->
  <div v-if="id === 'button'" class="demo-col">
    <div class="row">
      <UiButton>主要按钮</UiButton>
      <UiButton variant="secondary">次要按钮</UiButton>
      <UiButton variant="danger">危险按钮</UiButton>
      <UiButton variant="ghost">幽灵按钮</UiButton>
    </div>
    <div class="row">
      <UiButton size="sm">小号</UiButton>
      <UiButton size="md">中号</UiButton>
      <UiButton size="lg">大号</UiButton>
      <UiButton icon="⚙️" loading>加载中</UiButton>
      <UiButton disabled>禁用</UiButton>
    </div>
    <p class="hint">试试 hover / 点击 / 不同主题下的外观</p>
  </div>

  <!-- ============ 徽标 ============ -->
  <div v-else-if="id === 'badge'" class="demo-col">
    <div class="row">
      <UiBadge color="blue">蓝色</UiBadge>
      <UiBadge color="green">绿色</UiBadge>
      <UiBadge color="orange">橙色</UiBadge>
      <UiBadge color="red">红色</UiBadge>
      <UiBadge color="gray">灰色</UiBadge>
    </div>
    <div class="row">
      <span>在线</span><UiBadge color="green" dot pulse />
      <span>离线</span><UiBadge color="gray" dot />
      <span>异常</span><UiBadge color="red" dot />
    </div>
  </div>

  <!-- ============ 卡片 ============ -->
  <div v-else-if="id === 'card'" class="demo-col">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <UiCard title="标题卡片" subtitle="副标题说明" hover>
        标准卡片模式，hover 有上浮效果。
        <template #footer><UiButton size="sm">知道了</UiButton></template>
      </UiCard>
      <UiCard>
        <template #header><strong>纯插槽</strong></template>
        <p>不传 title 时用 header 插槽完全自定义头部。</p>
      </UiCard>
    </div>
  </div>

  <!-- ============ 模态框 ============ -->
  <div v-else-if="id === 'modal'" class="demo-col">
    <div class="row">
      <UiButton @click="showModal = true">打开模态框</UiButton>
      <UiButton variant="secondary" @click="toast('info', '试试右边的弹窗')">提示</UiButton>
    </div>
    <UiModal v-model="showModal" title="现场演示弹窗" width="420px" @close="toastMsg = '已关闭'">
      <p>试试点遮罩、✕ 或按 Esc 关闭。这个弹窗用 <code>v-model</code> 控制开合。</p>
      <p style="margin-top:8px">内部用 <code>&lt;Teleport&gt;</code> 传送到 body 顶层。</p>
      <template #footer>
        <UiButton variant="ghost" @click="showModal = false">取消</UiButton>
        <UiButton @click="showModal = false; toast('success', '已确认！')">确认</UiButton>
      </template>
    </UiModal>
  </div>

  <!-- ============ 消息提示 ============ -->
  <div v-else-if="id === 'toast'" class="demo-col">
    <div class="row">
      <UiButton variant="secondary" @click="toast('success', '操作成功！')">成功提示</UiButton>
      <UiButton variant="danger" @click="toast('error', '出错了，请重试')">错误提示</UiButton>
      <UiButton @click="toast('info', '这是一条普通信息')">信息提示</UiButton>
    </div>
    <p class="hint">右下角弹出现场 Toast，自动消失</p>
  </div>

  <!-- ============ 进度条 ============ -->
  <div v-else-if="id === 'progress'" class="demo-col">
    <div style="display:flex;flex-direction:column;gap:14px;max-width:420px">
      <UiProgress :value="progress" show-text />
      <UiProgress :value="55" color="#22c55e" :height="12" />
      <UiProgress :value="80" color="#f59e0b" show-text />
    </div>
    <UiButton size="sm" style="margin-top:14px" @click="tick">+20% 进度</UiButton>
  </div>

  <!-- ============ 输入框 ============ -->
  <div v-else-if="id === 'input'" class="demo-col">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
      <UiInput label="用户名" placeholder="至少 2 个字符（失焦校验）" v-model="f.username" @blur="validateField('username', f.username)" :error="fErrors.username" />
      <UiInput label="邮箱" type="email" placeholder="you@example.com（失焦校验）" v-model="f.email" @blur="validateField('email', f.email)" :error="fErrors.email" />
      <div class="row">
        <UiButton size="sm" @click="submitForm">提交（校验全部）</UiButton>
      </div>
      <Transition name="fade">
        <p v-if="submitted" style="color:var(--ui-success,#22c55e);font-size:13px;margin:0">✅ 校验通过！用户名：{{ f.username }}</p>
      </Transition>
      <p class="hint">用 zod + useFormValidator 做实时校验（作品⑬）</p>
    </div>
  </div>

  <!-- ============ 多行文本 ============ -->
  <div v-else-if="id === 'textarea'" class="demo-col">
    <div style="max-width:360px">
      <UiTextarea label="备注" :rows="4" placeholder="补充说明…" show-count :maxlength="50" />
    </div>
  </div>

  <!-- ============ 下拉选择 ============ -->
  <div v-else-if="id === 'select'" class="demo-col">
    <div style="max-width:300px">
      <UiSelect
        label="优先级"
        :options="[
          { label: '低', value: 'low' },
          { label: '中', value: 'medium' },
          { label: '高', value: 'high' },
        ]"
      />
    </div>
  </div>

  <!-- ============ 开关 ============ -->
  <div v-else-if="id === 'switch'" class="demo-col">
    <div style="display:flex;flex-direction:column;gap:16px">
      <UiSwitch v-model="notifOn" label="开启通知" active-text="开" inactive-text="关" />
      <UiSwitch v-model="darkPref" label="偏好（演示仅做展示）" active-text="是" inactive-text="否" />
      <UiSwitch label="禁用状态" disabled />
    </div>
  </div>

  <!-- ============ 容器 ============ -->
  <div v-else-if="id === 'container'" class="demo-col">
    <UiContainer width="md" padding="12" style="border:1px dashed var(--ui-border);border-radius:8px">
      <p style="margin:0">md 档位，水平内边距 12px，最大宽度 768px 居中</p>
    </UiContainer>
    <UiContainer width="lg" padding="16" style="border:1px dashed var(--ui-border);border-radius:8px">
      <p style="margin:0">lg 档位，最大宽度 1024px</p>
    </UiContainer>
  </div>

  <!-- ============ 栅格 ============ -->
  <div v-else-if="id === 'grid'" class="demo-col">
    <UiGrid :gap="12">
      <UiGridItem :span="12" :md="6" :lg="3"><div class="cell">span 12/6/3</div></UiGridItem>
      <UiGridItem :span="12" :md="6" :lg="3"><div class="cell">span 12/6/3</div></UiGridItem>
      <UiGridItem :span="12" :md="6" :lg="3"><div class="cell">span 12/6/3</div></UiGridItem>
      <UiGridItem :span="12" :md="6" :lg="3"><div class="cell">span 12/6/3</div></UiGridItem>
    </UiGrid>
    <p class="hint">拖宽/缩窄窗口，观察 md / lg 断点下的响应式变化</p>
  </div>

  <!-- ============ 间距 ============ -->
  <div v-else-if="id === 'spacer'" class="demo-col">
    <div class="row">
      <UiButton size="sm">A</UiButton>
    </div>
    <UiSpacer size="lg" />
    <div class="row">
      <UiButton size="sm">B（间隔 24px）</UiButton>
      <UiSpacer axis="horizontal" size="sm" />
      <UiButton size="sm">C</UiButton>
      <UiSpacer axis="horizontal" size="lg" />
      <UiButton size="sm">D（间隔 24px）</UiButton>
    </div>
  </div>

  <!-- ============ 虚拟列表 ============ -->
  <div v-else-if="id === 'virtual'" class="demo-col">
    <UiVirtualList
      :items="virtualItems" variable :estimated-row-height="48" :overscan="3"
      style="height: 340px; border: 1px solid var(--ui-border); border-radius: 10px"
    >
      <template #default="{ item, index, measure }">
        <div :ref="measure" class="vrow">
          <span class="vidx">#{{ index }}</span>
          <span class="vtext">{{ item.text }}</span>
        </div>
      </template>
    </UiVirtualList>
    <p class="hint">5,000 条动态行高数据，只渲染视口内的行；滚动丝滑</p>
  </div>
</template>

<style scoped>
.demo-col { display: flex; flex-direction: column; gap: 16px; }
.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.hint { color: var(--ui-text-3); font-size: 12px; margin: 0; }
.cell {
  background: var(--ui-primary-soft); color: var(--ui-primary);
  border-radius: 8px; padding: 14px; text-align: center; font-size: 13px; font-weight: 600;
}
.vrow {
  display: flex; gap: 10px; align-items: center; padding: 9px 14px;
  border-bottom: 1px solid var(--ui-border); font-size: 13px;
}
.vidx { color: var(--ui-text-3); font-weight: 600; flex-shrink: 0; }
.vtext { color: var(--ui-text-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
code { background: var(--ui-hover); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
.fade-enter-active, .fade-leave-active { transition: opacity .3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
