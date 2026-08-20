/**
 * useFormValidator —— 基于 zod 的轻量表单校验组合式函数
 *
 * 作用：把 zod schema 转成 Vue 表单可用的校验逻辑。
 *   - validateField(name, value)  : 校验单个字段（onBlur/onInput 时触发）
 *   - validateAll(values)         : 校验整个表单（提交时）
 *   - errors (reactive)           : 字段名 → 错误信息的映射
 *   - reset()                     : 清空错误
 *
 * 为什么用 zod：
 *   zod 是 TypeScript-first 的模式校验库，schema 即类型。
 *   用 zod 定义规则，天然获得类型推导，且校验逻辑可复用（前后端共享）。
 *
 * 本实现不依赖 vee-validate，用 zod 的 safeParse 手动驱动，
 * 好处是零额外依赖、逻辑透明。schema 用宽松类型（ZodType<unknown>）
 * 以兼容 refine/coerce 等产生的联合类型。
 */
import { reactive } from 'vue'
import type { ZodType } from 'zod'

export type FormValues = Record<string, unknown>
export type FormErrors = Partial<Record<string, string>>

export function useFormValidator(
  schema: ZodType<unknown>,
  opts: { onError?: (errors: FormErrors) => void } = {},
) {
  // 每个字段的错误信息（空串 = 无错误）
  const errors = reactive<FormErrors>({})

  /** 校验单个字段 */
  function validateField(name: string, value: unknown): string {
    // 只在 schema 里声明过的字段才校验（避免校验无关字段）
    const fieldSchema = extractFieldSchema(schema, name)
    if (!fieldSchema) {
      // 没有该字段的 schema，直接放行
      errors[name] = ''
      return ''
    }
    const result = fieldSchema.safeParse(value)
    const msg = result.success ? '' : firstMessage(result.error.issues)
    errors[name] = msg
    return msg
  }

  /** 校验整个表单，返回是否通过 */
  function validateAll(values: FormValues): boolean {
    const result = schema.safeParse(values)
    if (result.success) {
      clearErrors()
      return true
    }
    // 把 zod 的错误拍平进 errors
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string
      if (field && !errors[field]) {
        errors[field] = issue.message
      }
    }
    opts.onError?.(errors)
    return false
  }

  /** 清空所有错误 */
  function clearErrors() {
    for (const key of Object.keys(errors)) errors[key] = ''
  }

  /** 是否有错误（用于提交按钮禁用等） */
  function hasErrors(): boolean {
    return Object.values(errors).some((e) => Boolean(e))
  }

  return { errors, validateField, validateAll, clearErrors, hasErrors }
}

/* ---------- 内部工具 ---------- */

/** 从 zod 对象 schema 里提取单个字段的 schema（ZodObject shape） */
function extractFieldSchema(schema: ZodType<unknown>, field: string): ZodType<unknown> | null {
  // zod 对象类型的内部结构：_def.shape
  const def = (schema as any)._def
  const shape = def?.shape
  if (!shape) return null
  return shape[field] ?? null
}

/** 取第一个错误信息 */
function firstMessage(issues: { message: string }[]): string {
  return issues[0]?.message ?? '格式不正确'
}
