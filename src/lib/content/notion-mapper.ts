import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'

type Properties = PageObjectResponse['properties']

export const COURSE_PROPERTIES = {
  name: { name: '코스명', type: 'title' },
  slug: { name: 'slug', type: 'rich_text' },
  order: { name: '순서', type: 'number' },
  level: { name: '난이도', type: 'select' },
  summary: { name: '소개', type: 'rich_text' },
  audience: { name: '대상', type: 'rich_text' },
  prerequisites: { name: '선수 지식', type: 'rich_text' },
  published: { name: '공개 여부', type: 'checkbox' },
} as const

export const LINK_PROPERTIES = {
  title: { name: '제목', type: 'title' },
  id: { name: '링크 ID', type: 'rich_text' },
  url: { name: 'URL', type: 'url' },
  purpose: { name: '목적', type: 'rich_text' },
  category: { name: '카테고리', type: 'select' },
  type: { name: '유형', type: 'select' },
  verified: { name: '검증 상태', type: 'select' },
  published: { name: '공개 여부', type: 'checkbox' },
  access: { name: '이용 조건', type: 'select' },
  course: { name: '코스', type: 'relation' },
  order: { name: '순서', type: 'number' },
  level: { name: '난이도', type: 'select' },
  language: { name: '언어', type: 'select' },
  estimatedMinutes: { name: '예상 시간', type: 'number' },
} as const

export const VERIFIED_LABEL = '검증 완료'
export const UNVERIFIED_LABEL = '미검증'

function readText(properties: Properties, name: string): string {
  const property = properties[name]
  if (property?.type === 'title') {
    return property.title.map(part => part.plain_text).join('')
  }
  if (property?.type === 'rich_text') {
    return property.rich_text.map(part => part.plain_text).join('')
  }
  return ''
}

function readSelect(properties: Properties, name: string): string | null {
  const property = properties[name]
  return property?.type === 'select' ? (property.select?.name ?? null) : null
}

function readNumber(properties: Properties, name: string): number | null {
  const property = properties[name]
  return property?.type === 'number' ? property.number : null
}

function readCheckbox(properties: Properties, name: string): boolean {
  const property = properties[name]
  return property?.type === 'checkbox' ? property.checkbox : false
}

function readUrl(properties: Properties, name: string): string | null {
  const property = properties[name]
  return property?.type === 'url' ? property.url : null
}

function readFirstRelation(
  properties: Properties,
  name: string
): string | null {
  const property = properties[name]
  return property?.type === 'relation'
    ? (property.relation[0]?.id ?? null)
    : null
}

export function mapCoursePage(page: PageObjectResponse) {
  const { properties } = page
  return {
    slug: readText(properties, COURSE_PROPERTIES.slug.name),
    name: readText(properties, COURSE_PROPERTIES.name.name),
    order: readNumber(properties, COURSE_PROPERTIES.order.name),
    level: readSelect(properties, COURSE_PROPERTIES.level.name),
    summary: readText(properties, COURSE_PROPERTIES.summary.name),
    audience: readText(properties, COURSE_PROPERTIES.audience.name),
    prerequisites: readText(properties, COURSE_PROPERTIES.prerequisites.name),
    published: readCheckbox(properties, COURSE_PROPERTIES.published.name),
  }
}

export function mapLinkPage(
  page: PageObjectResponse,
  courseSlugByPageId: ReadonlyMap<string, string>
) {
  const { properties } = page
  const coursePageId = readFirstRelation(
    properties,
    LINK_PROPERTIES.course.name
  )
  return {
    id: readText(properties, LINK_PROPERTIES.id.name),
    title: readText(properties, LINK_PROPERTIES.title.name),
    url: readUrl(properties, LINK_PROPERTIES.url.name),
    purpose: readText(properties, LINK_PROPERTIES.purpose.name),
    category: readSelect(properties, LINK_PROPERTIES.category.name),
    type: readSelect(properties, LINK_PROPERTIES.type.name),
    access: readSelect(properties, LINK_PROPERTIES.access.name),
    course: coursePageId
      ? (courseSlugByPageId.get(coursePageId) ?? null)
      : null,
    order: readNumber(properties, LINK_PROPERTIES.order.name),
    level: readSelect(properties, LINK_PROPERTIES.level.name),
    language: readSelect(properties, LINK_PROPERTIES.language.name),
    estimatedMinutes: readNumber(
      properties,
      LINK_PROPERTIES.estimatedMinutes.name
    ),
    verified:
      readSelect(properties, LINK_PROPERTIES.verified.name) === VERIFIED_LABEL,
    published: readCheckbox(properties, LINK_PROPERTIES.published.name),
  }
}
