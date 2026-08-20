<script setup lang="ts">
/**
 * 表单校验 Demo —— 作品⑬核心展示页
 * 用 zod 定义注册表单校验规则 + useFormValidator 驱动 + UiKit 组件渲染
 */
import { reactive, ref } from 'vue'
import { z } from 'zod'
import {
  UiInput,
  UiSelect,
  UiTextarea,
  UiButton,
} from '../components'
import { useFormValidator } from '../composables/useFormValidator'

// —— 1. zod 定义校验规则（schema 即类型，天然 TS 推导）——
const schema = z
  .object({
    username: z
      .string()
      .min(3, '用户名至少 3 个字符')
      .max(20, '用户名最多 20 个字符')
      .regex(/^[\w\u4e00-\u9fa5]+$/, '只能包含字母、数字、下划线或中文'),
    email: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
    password: z
      .string()
      .min(6, '密码至少 6 位')
      .regex(/[A-Za-z]/, '需包含字母')
      .regex(/\d/, '需包含数字'),
    confirm: z.string(),
    age: z.coerce.number().int('年龄须为整数').min(12, '年龄至少 12 岁').max(120, '年龄最多 120 岁'),
    city: z.string().min(1, '请选择城市'),
    bio: z.string().max(100, '简介最多 100 字').optional(),
  })
  // 跨字段校验：确认密码要等于密码
  .refine((data) => data.password === data.confirm, {
    message: '两次输入的密码不一致',
    path: ['confirm'],
  })

// —— 2. 表单状态 ——
// form.age 用 string 绑定（UiInput 是文本输入），提交时 zod coerce 转数字校验
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirm: '',
  age: '',
  city: '',
  bio: '',
})

// —— 3. 校验器 ——
const { errors, validateField, validateAll, clearErrors } = useFormValidator(schema)

// —— 4. 提交 ——
const submitted = ref(false)
const submitting = ref(false)

async function onSubmit() {
  if (validateAll(form)) {
    submitting.value = true
    // 模拟提交
    await new Promise((r) => setTimeout(r, 600))
    submitting.value = false
    submitted.value = true
    clearErrors()
  }
}

const cityOptions = [
  { label: '北京', value: 'beijing' },
  { label: '上海', value: 'shanghai' },
  { label: '广州', value: 'guangzhou' },
  { label: '深圳', value: 'shenzhen' },
  { label: '成都', value: 'chengdu' },
]
</script>

<template>
  <section class="form-demo">
    <h1>注册表单 · zod 校验</h1>
    <p class="sub">zod schema 驱动 · useFormValidator · UiKit 组件</p>

    <!-- 提交成功提示 -->
    <Transition name="pop">
      <div v-if="submitted" class="success">
        ✅ 注册成功！用户名：{{ form.username }}，城市：{{ form.city }}
      </div>
    </Transition>

    <form class="form-card" @submit.prevent="onSubmit">
      <UiInput
        v-model="form.username"
        label="用户名"
        placeholder="3-20 位，字母/数字/下划线/中文"
        :error="errors.username"
      />

      <UiInput
        v-model="form.email"
        label="邮箱"
        type="email"
        placeholder="you@example.com"
        :error="errors.email"
      />

      <div class="grid-2">
        <UiInput
          v-model="form.password"
          label="密码"
          type="password"
          placeholder="至少 6 位，含字母和数字"
          :error="errors.password"
        />
        <UiInput
          v-model="form.confirm"
          label="确认密码"
          type="password"
          placeholder="再次输入密码"
          :error="errors.confirm"
        />
      </div>

      <div class="grid-2">
        <UiInput
          v-model="form.age"
          label="年龄"
          type="number"
          placeholder="12-120"
          :error="errors.age"
        />
        <UiSelect
          v-model="form.city"
          label="所在城市"
          :options="cityOptions"
          placeholder="请选择"
          :error="errors.city"
        />
      </div>

      <UiTextarea
        v-model="form.bio"
        label="个人简介（可选）"
        placeholder="最多 100 字"
        :maxlength="100"
        :error="errors.bio"
      />

      <div class="actions">
        <UiButton type="submit" :loading="submitting">立即注册</UiButton>
        <UiButton variant="ghost" type="button" @click="clearErrors">清空提示</UiButton>
      </div>
    </form>

    <div class="hint">
      <p>💡 失焦 / 输入时自动校验单字段，提交时校验全部；跨字段规则（确认密码 = 密码）用 zod 的 <code>refine</code> 实现。</p>
    </div>
  </section>
</template>

<style scoped>
.form-demo { max-width: 560px; margin: 0 auto; padding: 24px 16px 48px; }
h1 { font-size: 22px; margin: 0 0 4px; color: #e2e8f0; }
.sub { color: #94a3b8; font-family: monospace; margin: 0 0 20px; font-size: 13px; }
.form-card {
  background: #1e293b; border: 1px solid rgba(255,255,255,.08);
  border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 16px;
}
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 480px) { .grid-2 { grid-template-columns: 1fr; } }
.actions { display: flex; gap: 10px; margin-top: 4px; }
.success {
  background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.4);
  color: #4ade80; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 14px;
}
.hint { color: #64748b; font-size: 13px; margin-top: 16px; line-height: 1.7; }
.hint code { background: #273449; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
.pop-enter-active, .pop-leave-active { transition: all .3s; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
