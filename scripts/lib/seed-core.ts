import {
  COURSE_PROPERTIES,
  LINK_PROPERTIES,
  UNVERIFIED_LABEL,
  VERIFIED_LABEL,
} from '../../src/lib/content/notion-mapper'
import type { SeedData } from '../../src/lib/content/schema'

export type PropertyValue =
  | { title: Array<{ text: { content: string } }> }
  | { rich_text: Array<{ text: { content: string } }> }
  | { url: string }
  | { number: number | null }
  | { select: { name: string } | null }
  | { checkbox: boolean }
  | { relation: Array<{ id: string }> }

export type PageProperties = Record<string, PropertyValue>

export interface ExistingPage {
  pageId: string
  key: string
}

export interface SeedGateway {
  getPropertyTypes(kind: 'course' | 'link'): Promise<Record<string, string>>
  listPages(kind: 'course' | 'link'): Promise<ExistingPage[]>
  createPage(
    kind: 'course' | 'link',
    properties: PageProperties
  ): Promise<string>
  updatePage(pageId: string, properties: PageProperties): Promise<void>
}

export interface SeedOptions {
  dryRun: boolean
  update: boolean
  onProgress?: (message: string) => void
}

export interface SeedSummary {
  created: number
  updated: number
  skipped: number
}

const text = (content: string) => [{ text: { content } }]

export function findSchemaProblems(
  expected: Record<string, { name: string; type: string }>,
  actual: Record<string, string>
): string[] {
  return Object.values(expected).flatMap(({ name, type }) => {
    if (!actual[name]) return [`${name} 필드가 없습니다`]
    if (actual[name] !== type) {
      return [`${name} 필드의 타입이 ${type}이 아닙니다 (현재 ${actual[name]})`]
    }
    return []
  })
}

function buildCourseProperties(
  course: SeedData['courses'][number]
): PageProperties {
  return {
    [COURSE_PROPERTIES.name.name]: { title: text(course.name) },
    [COURSE_PROPERTIES.slug.name]: { rich_text: text(course.slug) },
    [COURSE_PROPERTIES.order.name]: { number: course.order },
    [COURSE_PROPERTIES.level.name]: { select: { name: course.level } },
    [COURSE_PROPERTIES.summary.name]: { rich_text: text(course.summary) },
    [COURSE_PROPERTIES.audience.name]: { rich_text: text(course.audience) },
    [COURSE_PROPERTIES.prerequisites.name]: {
      rich_text: text(course.prerequisites),
    },
    [COURSE_PROPERTIES.published.name]: { checkbox: true },
  }
}

const optionalSelect = (name: string | null) => ({
  select: name ? { name } : null,
})

export function buildLinkProperties(
  link: SeedData['links'][number],
  coursePageIds: ReadonlyMap<string, string>
): PageProperties {
  const coursePageId = link.course ? coursePageIds.get(link.course) : undefined
  if (link.course && !coursePageId) {
    throw new Error(`${link.id}의 코스를 찾을 수 없습니다: ${link.course}`)
  }

  return {
    [LINK_PROPERTIES.title.name]: { title: text(link.title) },
    [LINK_PROPERTIES.id.name]: { rich_text: text(link.id) },
    [LINK_PROPERTIES.url.name]: { url: link.url },
    [LINK_PROPERTIES.purpose.name]: { rich_text: text(link.purpose) },
    [LINK_PROPERTIES.category.name]: { select: { name: link.category } },
    [LINK_PROPERTIES.type.name]: { select: { name: link.type } },
    [LINK_PROPERTIES.verified.name]: {
      select: { name: link.verified ? VERIFIED_LABEL : UNVERIFIED_LABEL },
    },
    [LINK_PROPERTIES.published.name]: { checkbox: link.published },
    [LINK_PROPERTIES.access.name]: optionalSelect(link.access),
    [LINK_PROPERTIES.course.name]: {
      relation: coursePageId ? [{ id: coursePageId }] : [],
    },
    [LINK_PROPERTIES.order.name]: { number: link.order },
    [LINK_PROPERTIES.level.name]: optionalSelect(link.level),
    [LINK_PROPERTIES.language.name]: optionalSelect(link.language),
    [LINK_PROPERTIES.estimatedMinutes.name]: {
      number: link.estimatedMinutes,
    },
  }
}

export async function runSeed(
  seed: SeedData,
  gateway: SeedGateway,
  { dryRun, update, onProgress = () => {} }: SeedOptions
): Promise<SeedSummary> {
  // 잘못된 데이터베이스(예: 이전 견적서 DB)에 쓰지 않도록 쓰기 전에 구조부터 확인한다
  const problems = [
    ...findSchemaProblems(
      COURSE_PROPERTIES,
      await gateway.getPropertyTypes('course')
    ).map(problem => `코스 DB: ${problem}`),
    ...findSchemaProblems(
      LINK_PROPERTIES,
      await gateway.getPropertyTypes('link')
    ).map(problem => `링크 DB: ${problem}`),
  ]
  if (problems.length > 0) {
    throw new Error(
      `Notion 데이터베이스 구조가 PRD와 다릅니다. 아무것도 쓰지 않았습니다.\n- ${problems.join('\n- ')}`
    )
  }

  const summary: SeedSummary = { created: 0, updated: 0, skipped: 0 }

  const upsert = async (
    kind: 'course' | 'link',
    key: string,
    existing: ReadonlyMap<string, string>,
    properties: PageProperties
  ): Promise<string> => {
    const pageId = existing.get(key)
    if (pageId && !update) {
      summary.skipped += 1
      return pageId
    }
    if (pageId) {
      summary.updated += 1
      onProgress(`갱신: ${key}`)
      if (!dryRun) await gateway.updatePage(pageId, properties)
      return pageId
    }
    summary.created += 1
    onProgress(`생성: ${key}`)
    return dryRun ? `dry-run-${key}` : gateway.createPage(kind, properties)
  }

  const toMap = (pages: ExistingPage[]) =>
    new Map(pages.map(({ key, pageId }) => [key, pageId]))
  const existingCourses = toMap(await gateway.listPages('course'))
  const existingLinks = toMap(await gateway.listPages('link'))

  const coursePageIds = new Map<string, string>()
  for (const course of seed.courses) {
    coursePageIds.set(
      course.slug,
      await upsert(
        'course',
        course.slug,
        existingCourses,
        buildCourseProperties(course)
      )
    )
  }

  for (const link of seed.links) {
    await upsert(
      'link',
      link.id,
      existingLinks,
      buildLinkProperties(link, coursePageIds)
    )
  }

  return summary
}
