import { z } from 'zod'
import {
  ACCESS_CONDITIONS,
  LANGUAGES,
  LEVELS,
  LINK_TYPES,
} from '@/types/content'

const requiredText = z.string().trim().min(1)

const httpUrl = z
  .string()
  .url()
  .refine(value => /^https?:\/\//.test(value), 'http(s) 주소여야 합니다')

const courseFields = {
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: requiredText,
  order: z.number(),
  level: z.enum(LEVELS),
  summary: requiredText,
  audience: requiredText,
  prerequisites: requiredText,
}

export const rawCourseSchema = z.object({
  ...courseFields,
  published: z.boolean(),
})

// 코스에 연결된 링크는 순서와 난이도가 있어야 학습 경로에 배치할 수 있다
export const rawLinkSchema = z
  .object({
    id: z.string().regex(/^IT-\d{3,}$/),
    title: requiredText,
    url: httpUrl,
    purpose: requiredText,
    category: requiredText,
    type: z.enum(LINK_TYPES),
    access: z.enum(ACCESS_CONDITIONS).nullable(),
    course: z.string().nullable(),
    order: z.number().nullable(),
    level: z.enum(LEVELS).nullable(),
    language: z.enum(LANGUAGES).nullable(),
    estimatedMinutes: z.number().positive().nullable(),
    verified: z.boolean(),
    published: z.boolean(),
  })
  .refine(
    link => !link.course || (link.order !== null && link.level !== null),
    '코스에 연결된 링크는 순서와 난이도가 필수입니다'
  )

export const seedSchema = z.object({
  courses: z.array(z.object(courseFields)),
  links: z.array(rawLinkSchema),
})

export type SeedData = z.infer<typeof seedSchema>
