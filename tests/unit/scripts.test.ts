import { describe, expect, it, vi } from 'vitest'
import { COURSE_PROPERTIES, LINK_PROPERTIES } from '@/lib/content/notion-mapper'
import type { SeedData } from '@/lib/content/schema'
import { classifyResponse } from '../../scripts/lib/link-check'
import { runSeed, type SeedGateway } from '../../scripts/lib/seed-core'
import { makeLink } from './fixtures'

const seed: SeedData = {
  courses: [
    {
      slug: 'course-a',
      name: '코스 A',
      order: 1,
      level: '입문',
      summary: '소개',
      audience: '대상',
      prerequisites: '지식',
    },
  ],
  links: [
    makeLink({ id: 'IT-001', course: 'course-a', order: 1, level: '입문' }),
    makeLink({ id: 'IT-002', url: 'https://example.com/b' }),
  ],
}

const toTypes = (properties: Record<string, { name: string; type: string }>) =>
  Object.fromEntries(
    Object.values(properties).map(({ name, type }) => [name, type])
  )

function makeGateway(overrides: Partial<SeedGateway> = {}) {
  return {
    getPropertyTypes: vi.fn(async (kind: 'course' | 'link') =>
      toTypes(kind === 'course' ? COURSE_PROPERTIES : LINK_PROPERTIES)
    ),
    listPages: vi.fn(async () => []),
    createPage: vi.fn(async (kind: 'course' | 'link') => `${kind}-page`),
    updatePage: vi.fn(async () => {}),
    ...overrides,
  } satisfies SeedGateway
}

describe('runSeed', () => {
  it('DB 구조가 다르면 아무것도 쓰지 않고 중단한다', async () => {
    const gateway = makeGateway({
      getPropertyTypes: vi.fn(async () => ({ '견적서 번호': 'title' })),
    })

    await expect(
      runSeed(seed, gateway, { dryRun: false, update: false })
    ).rejects.toThrow('아무것도 쓰지 않았습니다')
    expect(gateway.createPage).not.toHaveBeenCalled()
  })

  it('새 행을 만들고 링크를 코스에 연결한다', async () => {
    const createPage = vi.fn<SeedGateway['createPage']>(
      async kind => `${kind}-page`
    )

    const summary = await runSeed(seed, makeGateway({ createPage }), {
      dryRun: false,
      update: false,
    })

    expect(summary).toEqual({ created: 3, updated: 0, skipped: 0 })
    expect(createPage.mock.calls[1]?.[1]).toMatchObject({
      코스: { relation: [{ id: 'course-page' }] },
      '검증 상태': { select: { name: '미검증' } },
    })
  })

  it('기본 실행은 기존 행을 덮어쓰지 않아 Notion 수정 내용을 보존한다', async () => {
    const gateway = makeGateway({
      listPages: vi.fn(async (kind: 'course' | 'link') =>
        kind === 'course'
          ? [{ pageId: 'c1', key: 'course-a' }]
          : [{ pageId: 'l1', key: 'IT-001' }]
      ),
    })

    const summary = await runSeed(seed, gateway, {
      dryRun: false,
      update: false,
    })

    expect(summary).toEqual({ created: 1, updated: 0, skipped: 2 })
    expect(gateway.updatePage).not.toHaveBeenCalled()
    expect(gateway.createPage).toHaveBeenCalledOnce()
  })

  it('--update에서만 기존 행을 갱신하고, 미리 보기는 쓰지 않는다', async () => {
    const listPages = vi.fn(async (kind: 'course' | 'link') =>
      kind === 'course'
        ? [{ pageId: 'c1', key: 'course-a' }]
        : [{ pageId: 'l1', key: 'IT-001' }]
    )
    const updating = makeGateway({ listPages })
    await runSeed(seed, updating, { dryRun: false, update: true })
    expect(updating.updatePage).toHaveBeenCalledTimes(2)

    const previewing = makeGateway({ listPages })
    const summary = await runSeed(seed, previewing, {
      dryRun: true,
      update: true,
    })
    expect(summary).toEqual({ created: 1, updated: 2, skipped: 0 })
    expect(previewing.updatePage).not.toHaveBeenCalled()
    expect(previewing.createPage).not.toHaveBeenCalled()
  })
})

describe('classifyResponse', () => {
  const url = 'https://example.com/a'

  it('응답을 구분한다', () => {
    expect(classifyResponse(url, 200, url).status).toBe('ok')
    expect(classifyResponse(url, 200, `${url}/`).status).toBe('ok')
    expect(classifyResponse(url, 200, 'https://example.com/b').status).toBe(
      'moved'
    )
    expect(classifyResponse(url, 404, url).status).toBe('broken')
    expect(classifyResponse(url, 500, url).status).toBe('broken')
  })

  it('403과 X 링크는 사람이 확인하도록 분류한다', () => {
    expect(classifyResponse(url, 403, url).status).toBe('manual')
    const xUrl = 'https://x.com/a/status/1'
    expect(classifyResponse(xUrl, 200, xUrl).status).toBe('manual')
    expect(classifyResponse(xUrl, 404, xUrl).status).toBe('manual')
  })
})
