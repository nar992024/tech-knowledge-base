import { describe, expect, it, vi } from 'vitest'
import { LINK_PROPERTIES } from '@/lib/content/notion-mapper'
import {
  cleanUrl,
  nextLinkId,
  runAddLink,
  type AddLinkGateway,
} from '../../scripts/lib/add-link-core'

const propertyTypes = Object.fromEntries(
  Object.values(LINK_PROPERTIES).map(({ name, type }) => [name, type])
)

const makeGateway = (overrides: Partial<AddLinkGateway> = {}) => ({
  getPropertyTypes: vi.fn(async () => propertyTypes),
  listPages: vi.fn(async () => [{ pageId: 'course-page', key: 'course-a' }]),
  listLinks: vi.fn(async () => [
    { id: 'IT-079', url: 'https://example.com/guide/' },
  ]),
  createPage: vi.fn(async () => 'new-page'),
  ...overrides,
})

const input = {
  title: '새 자료',
  url: 'https://example.com/new?utm_source=x',
  purpose: '새 자료를 소개한다',
  category: 'AI 에이전트 엔지니어링',
  type: '아티클',
}

describe('cleanUrl', () => {
  it('X 공유 값과 utm 값을 지운다', () => {
    expect(cleanUrl('https://x.com/a/status/1?s=12')).toBe(
      'https://x.com/a/status/1'
    )
    expect(cleanUrl('https://twitter.com/a/status/1?t=abc')).toBe(
      'https://x.com/a/status/1'
    )
    expect(cleanUrl('https://example.com/p?id=1&utm_medium=mail#top')).toBe(
      'https://example.com/p?id=1'
    )
  })
})

describe('nextLinkId', () => {
  it('가장 큰 번호 다음 ID를 만든다', () => {
    expect(nextLinkId(['IT-001', 'IT-079', 'IT-012'])).toBe('IT-080')
    expect(nextLinkId([])).toBe('IT-001')
  })
})

describe('runAddLink', () => {
  it('기본값으로 미검증 공개 링크를 만든다', async () => {
    const gateway = makeGateway()
    const link = await runAddLink(input, gateway, { dryRun: false })

    expect(link).toMatchObject({
      id: 'IT-080',
      url: 'https://example.com/new',
      verified: false,
      published: true,
    })
    expect(gateway.createPage).toHaveBeenCalledOnce()
  })

  it('미리 보기에서는 쓰지 않는다', async () => {
    const gateway = makeGateway()
    await runAddLink(input, gateway, { dryRun: true })
    expect(gateway.createPage).not.toHaveBeenCalled()
  })

  it('주소가 같으면 형식이 달라도 중복으로 막는다', async () => {
    const gateway = makeGateway()
    await expect(
      runAddLink(
        { ...input, url: 'https://www.example.com/guide?utm_source=a' },
        gateway,
        { dryRun: false }
      )
    ).rejects.toThrow('IT-079')
    expect(gateway.createPage).not.toHaveBeenCalled()
  })

  it('필수 값이 없거나 코스 정보가 부족하면 쓰지 않는다', async () => {
    const gateway = makeGateway()
    await expect(
      runAddLink({ ...input, purpose: ' ' }, gateway, { dryRun: false })
    ).rejects.toThrow('purpose')
    await expect(
      runAddLink({ ...input, course: 'course-a' }, gateway, { dryRun: false })
    ).rejects.toThrow('순서와 난이도')
    await expect(
      runAddLink(
        { ...input, course: 'none', order: 1, level: '입문' },
        gateway,
        { dryRun: false }
      )
    ).rejects.toThrow('코스를 찾을 수 없습니다')
    expect(gateway.createPage).not.toHaveBeenCalled()
  })

  it('DB 구조가 다르면 쓰지 않는다', async () => {
    const gateway = makeGateway({
      getPropertyTypes: vi.fn(async () => ({})),
    })
    await expect(runAddLink(input, gateway, { dryRun: false })).rejects.toThrow(
      '링크 DB 구조'
    )
    expect(gateway.createPage).not.toHaveBeenCalled()
  })
})
