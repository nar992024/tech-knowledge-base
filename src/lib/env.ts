import { z } from 'zod'

const notionIdSchema = z
  .string()
  .transform(value => value.replaceAll('-', ''))
  .pipe(z.string().length(32, 'Notion 데이터베이스 ID는 32자여야 합니다'))

const envSchema = z
  .object({
    CONTENT_SOURCE: z.enum(['notion', 'seed']).default('notion'),
    NOTION_API_KEY: z.string().optional(),
    NOTION_DATABASE_ID: notionIdSchema.optional(),
    NOTION_COURSE_DATABASE_ID: notionIdSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.CONTENT_SOURCE !== 'notion') return

    const requiredKeys = [
      'NOTION_API_KEY',
      'NOTION_DATABASE_ID',
      'NOTION_COURSE_DATABASE_ID',
    ] as const

    for (const key of requiredKeys) {
      if (!value[key]) {
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key}는 필수입니다`,
        })
      }
    }
  })

export type Env = z.infer<typeof envSchema>

// 빌드 시점이 아니라 콘텐츠를 조회할 때 환경 변수를 검증한다
export function getEnv(): Env {
  return envSchema.parse({
    CONTENT_SOURCE: process.env.CONTENT_SOURCE || undefined,
    NOTION_API_KEY: process.env.NOTION_API_KEY || undefined,
    NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID || undefined,
    NOTION_COURSE_DATABASE_ID:
      process.env.NOTION_COURSE_DATABASE_ID || undefined,
  })
}
