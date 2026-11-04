import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { withLastGood } from '@/lib/content/fallback'
import {
  LINK_PROPERTIES,
  mapCoursePage,
  mapLinkPage,
} from '@/lib/content/notion-mapper'
import {
  rawCourseSchema,
  rawLinkSchema,
  seedSchema,
} from '@/lib/content/schema'
import { makeLink } from './fixtures'

const richText = (value: string) => ({
  type: 'rich_text',
  rich_text: [{ plain_text: value }],
})
const select = (name: string | null) => ({
  type: 'select',
  select: name ? { name } : null,
})

const toPage = (properties: Record<string, unknown>) =>
  ({ id: 'page-id', properties }) as unknown as PageObjectResponse

const linkPage = (overrides: Record<string, unknown> = {}) =>
  toPage({
    제목: {
      type: 'title',
      title: [{ plain_text: '링' }, { plain_text: '크' }],
    },
    '링크 ID': richText('IT-010'),
    URL: { type: 'url', url: 'https://example.com' },
    목적: richText('설명'),
    카테고리: select('보안'),
    유형: select('문서'),
    '검증 상태': select('검증 완료'),
    '공개 여부': { type: 'checkbox', checkbox: true },
    '이용 조건': select(null),
    코스: { type: 'relation', relation: [{ id: 'course-page' }] },
    순서: { type: 'number', number: 2 },
    난이도: select('중급'),
    언어: select('영어'),
    '예상 시간': { type: 'number', number: null },
    ...overrides,
  })

const courseSlugs = new Map([['course-page', 'course-a']])

describe('Notion 응답 변환', () => {
  it('링크 페이지를 검증 가능한 값으로 변환한다', () => {
    const result = rawLinkSchema.safeParse(mapLinkPage(linkPage(), courseSlugs))

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({
      id: 'IT-010',
      title: '링크',
      course: 'course-a',
      order: 2,
      level: '중급',
      access: null,
      verified: true,
      published: true,
    })
  })

  it('`미검증`은 검증 완료로 취급하지 않는다', () => {
    const mapped = mapLinkPage(
      linkPage({ [LINK_PROPERTIES.verified.name]: select('미검증') }),
      courseSlugs
    )
    expect(mapped.verified).toBe(false)
  })

  it('필수 값이 없거나 URL이 잘못된 행은 통과시키지 않는다', () => {
    const invalidPages = [
      linkPage({ URL: { type: 'url', url: null } }),
      linkPage({ URL: { type: 'url', url: 'javascript:alert(1)' } }),
      linkPage({ 목적: richText('') }),
      linkPage({ 유형: select('없는 유형') }),
    ]
    for (const page of invalidPages) {
      const result = rawLinkSchema.safeParse(mapLinkPage(page, courseSlugs))
      expect(result.success).toBe(false)
    }
  })

  it('코스에 연결됐는데 순서나 난이도가 없으면 통과시키지 않는다', () => {
    expect(
      rawLinkSchema.safeParse(
        makeLink({ course: 'a', order: null, level: '입문' })
      ).success
    ).toBe(false)
    expect(
      rawLinkSchema.safeParse(makeLink({ course: 'a', order: 1, level: null }))
        .success
    ).toBe(false)
    expect(rawLinkSchema.safeParse(makeLink()).success).toBe(true)
  })

  it('코스 페이지를 변환하고 slug 형식을 검사한다', () => {
    const coursePage = (slug: string) =>
      toPage({
        코스명: { type: 'title', title: [{ plain_text: '코스' }] },
        slug: richText(slug),
        순서: { type: 'number', number: 1 },
        난이도: select('입문'),
        소개: richText('소개'),
        대상: richText('대상'),
        '선수 지식': richText('지식'),
        '공개 여부': { type: 'checkbox', checkbox: true },
      })

    expect(
      rawCourseSchema.safeParse(mapCoursePage(coursePage('good-slug'))).success
    ).toBe(true)
    expect(
      rawCourseSchema.safeParse(mapCoursePage(coursePage('한글 slug'))).success
    ).toBe(false)
  })
})

describe('withLastGood', () => {
  it('실패하면 마지막 성공 결과를 돌려주고, 결과가 없으면 오류를 전달한다', async () => {
    const onFallback = vi.fn()
    const loader = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('첫 실패'))
      .mockResolvedValueOnce('성공')
      .mockRejectedValueOnce(new Error('장애'))
    const load = withLastGood(loader, onFallback)

    await expect(load()).rejects.toThrow('첫 실패')
    expect(onFallback).not.toHaveBeenCalled()
    await expect(load()).resolves.toBe('성공')
    await expect(load()).resolves.toBe('성공')
    expect(onFallback).toHaveBeenCalledOnce()
  })
})

describe('data/seed.json', () => {
  const seed = seedSchema.parse(
    JSON.parse(readFileSync('data/seed.json', 'utf8'))
  )
  const courseSlugSet = new Set(seed.courses.map(course => course.slug))

  it('PRD의 수량과 일치한다', () => {
    expect(seed.courses).toHaveLength(5)
    expect(seed.links).toHaveLength(62)
    expect(seed.links.filter(link => link.published)).toHaveLength(59)
    expect(seed.links.filter(link => link.course)).toHaveLength(24)
  })

  it('링크 ID와 URL이 중복되지 않고 코스 연결이 유효하다', () => {
    expect(new Set(seed.links.map(link => link.id)).size).toBe(
      seed.links.length
    )
    expect(new Set(seed.links.map(link => link.url)).size).toBe(
      seed.links.length
    )
    for (const link of seed.links) {
      if (link.course) expect(courseSlugSet.has(link.course)).toBe(true)
    }
  })
})
