import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { z } from 'zod'
import { getEnv } from '@/lib/env'
import { logger } from '@/lib/logger'
import { queryAllPages } from '@/lib/notion'
import type { RawContent } from '@/types/content'
import { mapCoursePage, mapLinkPage } from './notion-mapper'
import { rawCourseSchema, rawLinkSchema, seedSchema } from './schema'

// 잘못된 행 하나로 페이지 전체가 실패하지 않도록 해당 행만 제외한다
function keepValidRows<Schema extends z.ZodType>(
  rows: Array<{ pageId: string; candidate: unknown }>,
  schema: Schema,
  label: string
): Array<{ pageId: string; row: z.output<Schema> }> {
  const valid: Array<{ pageId: string; row: z.output<Schema> }> = []

  for (const { pageId, candidate } of rows) {
    const result = schema.safeParse(candidate)
    if (result.success) {
      valid.push({ pageId, row: result.data })
      continue
    }
    const linkId =
      typeof candidate === 'object' && candidate !== null && 'id' in candidate
        ? candidate.id
        : undefined
    logger.warn(`${label} 행을 제외했습니다`, {
      pageId,
      linkId,
      issues: result.error.issues.map(
        issue => `${issue.path.join('.')}: ${issue.message}`
      ),
    })
  }

  return valid
}

async function loadFromNotion(): Promise<RawContent> {
  const env = getEnv()
  const [coursePages, linkPages] = await Promise.all([
    queryAllPages(env.NOTION_COURSE_DATABASE_ID as string),
    queryAllPages(env.NOTION_DATABASE_ID as string),
  ])

  const courses = keepValidRows(
    coursePages.map(page => ({
      pageId: page.id,
      candidate: mapCoursePage(page),
    })),
    rawCourseSchema,
    '코스'
  )
  const courseSlugByPageId = new Map(
    courses.map(({ pageId, row }) => [pageId, row.slug])
  )
  const links = keepValidRows(
    linkPages.map(page => ({
      pageId: page.id,
      candidate: mapLinkPage(page, courseSlugByPageId),
    })),
    rawLinkSchema,
    '링크'
  )

  return {
    courses: courses.map(({ row }) => row),
    links: links.map(({ row }) => row),
  }
}

export async function loadSeedData() {
  const file = await readFile(join(process.cwd(), 'data', 'seed.json'), 'utf8')
  return seedSchema.parse(JSON.parse(file))
}

async function loadFromSeed(): Promise<RawContent> {
  const seed = await loadSeedData()
  return {
    courses: seed.courses.map(course => ({ ...course, published: true })),
    links: seed.links,
  }
}

export async function loadRawContent(): Promise<RawContent> {
  const source = getEnv().CONTENT_SOURCE
  logger.info('콘텐츠를 조회합니다', { source })
  return source === 'seed' ? loadFromSeed() : loadFromNotion()
}
