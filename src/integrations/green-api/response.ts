import type { ZodType } from 'zod'

export function parseResponse<T>(
  schema: ZodType<T>,
  value: unknown,
  error = 'GREEN-API вернул неожиданный ответ. Попробуйте подключиться снова.',
): T {
  const result = schema.safeParse(value)
  if (!result.success)
    throw new Error(error)
  return result.data
}
