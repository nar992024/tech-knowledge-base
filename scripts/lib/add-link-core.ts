import { LINK_PROPERTIES } from '../../src/lib/content/notion-mapper'
import { rawLinkSchema, type SeedData } from '../../src/lib/content/schema'
import {
  buildLinkProperties,
  findSchemaProblems,
  type ExistingPage,
  type PageProperties,
} from './seed-core'

export interface AddLinkGateway {
  getPropertyTypes(kind: 'link'): Promise<Record<string, string>>
  listPages(kind: 'course'): Promise<ExistingPage[]>
  listLinks(): Promise<Array<{ id: string; url: string | null }>>
  createPage(kind: 'link', properties: PageProperties): Promise<string>
}

type NewLink = SeedData['links'][number]

const X_HOSTS = new Set(['x.com', 'twitter.com', 'mobile.twitter.com'])

// 공유할 때 붙는 추적 값을 지워, 같은 글이 다른 주소로 중복 등록되지 않게 한다
export function cleanUrl(value: string): string {
  const url = new URL(value)
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (X_HOSTS.has(host)) {
    url.hostname = 'x.com'
    url.search = ''
  }
  for (const key of [...url.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_')) url.searchParams.delete(key)
  }
  url.hash = ''
  return url.toString()
}

function comparableUrl(value: string): string {
  const url = new URL(cleanUrl(value))
  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  return `${host}${url.pathname.replace(/\/+$/, '')}${url.search}`
}

export function nextLinkId(ids: readonly string[]): string {
  const numbers = ids.flatMap(id => {
    const match = /^IT-(\d+)$/.exec(id)
    return match ? [Number(match[1])] : []
  })
  const next = Math.max(0, ...numbers) + 1
  return `IT-${String(next).padStart(3, '0')}`
}

export async function runAddLink(
  input: Record<string, unknown>,
  gateway: AddLinkGateway,
  { dryRun }: { dryRun: boolean }
): Promise<NewLink> {
  if ('id' in input) {
    throw new Error('링크 ID는 자동으로 정하므로 입력하지 않습니다')
  }

  const problems = findSchemaProblems(
    LINK_PROPERTIES,
    await gateway.getPropertyTypes('link')
  )
  if (problems.length > 0) {
    throw new Error(
      `링크 DB 구조가 PRD와 다릅니다. 아무것도 쓰지 않았습니다.\n- ${problems.join('\n- ')}`
    )
  }

  const existing = await gateway.listLinks()
  const parsed = rawLinkSchema.safeParse({
    access: null,
    course: null,
    order: null,
    level: null,
    language: null,
    estimatedMinutes: null,
    verified: false,
    published: true,
    ...input,
    id: nextLinkId(existing.map(link => link.id)),
    url: typeof input.url === 'string' ? tryCleanUrl(input.url) : input.url,
  })
  if (!parsed.success) {
    const details = parsed.error.issues.map(
      issue => `${issue.path.join('.') || '입력'}: ${issue.message}`
    )
    throw new Error(`입력값이 잘못되었습니다.\n- ${details.join('\n- ')}`)
  }
  const link = parsed.data

  const target = comparableUrl(link.url)
  const duplicate = existing.find(
    item => item.url && tryComparableUrl(item.url) === target
  )
  if (duplicate) {
    throw new Error(`이미 등록된 주소입니다: ${duplicate.id}`)
  }

  const coursePageIds = new Map(
    (await gateway.listPages('course')).map(({ key, pageId }) => [key, pageId])
  )
  // 코스 연결이 잘못되면 여기서 오류가 나므로 쓰기 전에 값을 만든다
  const properties = buildLinkProperties(link, coursePageIds)
  if (!dryRun) await gateway.createPage('link', properties)
  return link
}

function tryCleanUrl(value: string): string {
  try {
    return cleanUrl(value)
  } catch {
    return value
  }
}

function tryComparableUrl(value: string): string | null {
  try {
    return comparableUrl(value)
  } catch {
    return null
  }
}
