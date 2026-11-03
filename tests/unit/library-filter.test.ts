import { describe, expect, it } from 'vitest'
import {
  ALL_OPTION,
  filterLibraryLinks,
  toLibrarySearch,
} from '@/lib/content/library-filter'
import type { LibraryLink } from '@/types/content'
import { makeLink } from './fixtures'

const toLibraryLink = (
  overrides: Parameters<typeof makeLink>[0]
): LibraryLink => ({
  ...makeLink(overrides),
  courseRef: null,
})

const links = [
  toLibraryLink({
    id: 'IT-001',
    title: 'Playwright 기초',
    category: '테스트',
    type: '강의',
  }),
  toLibraryLink({
    id: 'IT-002',
    title: '보안 도구',
    purpose: 'Cloudflare 소개',
    category: '보안',
    type: '문서',
  }),
  toLibraryLink({
    id: 'IT-003',
    title: '하네스',
    url: 'https://walkinglabs.github.io/x',
    category: '보안',
    type: '강의',
  }),
]

const search = (filters: Partial<Parameters<typeof filterLibraryLinks>[1]>) =>
  filterLibraryLinks(links, {
    query: '',
    category: ALL_OPTION,
    type: ALL_OPTION,
    ...filters,
  }).map(link => link.id)

describe('filterLibraryLinks', () => {
  it('조건이 없으면 전체를 돌려준다', () => {
    expect(search({})).toEqual(['IT-001', 'IT-002', 'IT-003'])
  })

  it('제목, 목적, URL을 대소문자 구분 없이 검색한다', () => {
    expect(search({ query: 'playwright' })).toEqual(['IT-001'])
    expect(search({ query: 'CLOUDFLARE' })).toEqual(['IT-002'])
    expect(search({ query: 'walkinglabs' })).toEqual(['IT-003'])
  })

  it('검색어와 카테고리, 유형을 함께 적용한다', () => {
    expect(search({ category: '보안', type: '강의' })).toEqual(['IT-003'])
    expect(search({ query: '보안', type: '문서' })).toEqual(['IT-002'])
    expect(search({ query: '없는 검색어' })).toEqual([])
  })
})

describe('toLibrarySearch', () => {
  it('값이 있는 조건만 주소에 넣는다', () => {
    expect(
      toLibrarySearch({ query: ' ', category: ALL_OPTION, type: ALL_OPTION })
    ).toBe('')
    expect(
      toLibrarySearch({ query: 'mcp', category: '보안', type: ALL_OPTION })
    ).toBe('?q=mcp&category=%EB%B3%B4%EC%95%88')
  })
})
