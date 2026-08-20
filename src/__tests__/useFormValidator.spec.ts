// useFormValidator 单元测试 —— 验证 zod schema 驱动的表单校验逻辑
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { useFormValidator } from '../composables/useFormValidator'

// 复用一个注册表单 schema（与 FormView 一致，保证 demo 和测试同步）
const schema = z
  .object({
    username: z.string().min(3, '用户名至少 3 个字符').max(20, '用户名最多 20 个字符'),
    email: z.string().min(1, '邮箱不能为空').email('邮箱格式不正确'),
    password: z.string().min(6, '密码至少 6 位').regex(/\d/, '需包含数字'),
    confirm: z.string(),
    age: z.coerce.number().int('年龄须为整数').min(12, '年龄至少 12 岁').max(120, '年龄最多 120 岁'),
    city: z.string().min(1, '请选择城市'),
  })
  .refine((d) => d.password === d.confirm, {
    message: '两次输入的密码不一致',
    path: ['confirm'],
  })

const validForm = {
  username: '布鲁蓝', // 3 个字符
  email: 'blue@example.com',
  password: 'abc123',
  confirm: 'abc123',
  age: '25', // string，由 coerce 转数字
  city: 'beijing',
}

describe('useFormValidator.validateField', () => {
  it('合法值 → 无错误', () => {
    const { errors, validateField } = useFormValidator(schema)
    const msg = validateField('username', '布鲁蓝')
    expect(msg).toBe('')
    expect(errors.username).toBe('')
  })

  it('非法值 → 返回错误信息并写入 errors', () => {
    const { errors, validateField } = useFormValidator(schema)
    const msg = validateField('username', 'ab')
    expect(msg).toBe('用户名至少 3 个字符')
    expect(errors.username).toBe('用户名至少 3 个字符')
  })

  it('邮箱格式错误', () => {
    const { errors, validateField } = useFormValidator(schema)
    validateField('email', 'not-an-email')
    expect(errors.email).toContain('邮箱格式不正确')
  })

  it('coerce 数字字段：字符串 "25" 也通过 age 校验', () => {
    const { errors, validateField } = useFormValidator(schema)
    validateField('age', '25')
    expect(errors.age).toBe('')
  })

  it('age 小于 12 报错', () => {
    const { validateField } = useFormValidator(schema)
    const msg = validateField('age', '10')
    expect(msg).toContain('至少 12')
  })

  it('未声明的字段直接放行', () => {
    const { validateField } = useFormValidator(schema)
    expect(validateField('nonexistent', 'x')).toBe('')
  })
})

describe('useFormValidator.validateAll', () => {
  it('合法表单 → true 且无错误信息', () => {
    const { errors, validateAll } = useFormValidator(schema)
    expect(validateAll(validForm)).toBe(true)
    expect(errors.email).toBeFalsy()
    expect(errors.username).toBeFalsy()
  })

  it('非法表单 → false 且 errors 含具体信息', () => {
    const { errors, validateAll } = useFormValidator(schema)
    const bad = { ...validForm, email: 'bad', username: 'a' }
    expect(validateAll(bad)).toBe(false)
    expect(errors.email).toContain('邮箱格式不正确')
    expect(errors.username).toContain('至少 3 个字符')
  })

  it('跨字段校验：确认密码 ≠ 密码 → confirm 报错', () => {
    const { errors, validateAll } = useFormValidator(schema)
    const bad = { ...validForm, confirm: 'different' }
    expect(validateAll(bad)).toBe(false)
    expect(errors.confirm).toContain('两次输入的密码不一致')
  })

  it('提交成功时调用 onError 回调', () => {
    const onError = vi.fn()
    const { validateAll } = useFormValidator(schema, { onError })
    validateAll({ ...validForm, password: '1', confirm: '2' })
    expect(onError).toHaveBeenCalled()
  })
})

describe('useFormValidator.clearErrors / hasErrors', () => {
  it('hasErrors 初值无错误', () => {
    const { hasErrors } = useFormValidator(schema)
    expect(hasErrors()).toBe(false)
  })

  it('出现错误后 hasErrors 为 true，clearErrors 后恢复 false', () => {
    const { errors, validateField, clearErrors, hasErrors } = useFormValidator(schema)
    validateField('email', 'bad')
    expect(hasErrors()).toBe(true)
    clearErrors()
    expect(hasErrors()).toBe(false)
    expect(errors.email).toBe('')
  })
})
