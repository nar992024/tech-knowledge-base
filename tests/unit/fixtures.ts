import type { RawCourse, RawLink } from '@/types/content'

export function makeCourse(overrides: Partial<RawCourse> = {}): RawCourse {
  return {
    slug: 'course-a',
    name: '코스 A',
    order: 1,
    level: '입문',
    summary: '소개',
    audience: '대상',
    prerequisites: '선수 지식',
    published: true,
    ...overrides,
  }
}

export function makeLink(overrides: Partial<RawLink> = {}): RawLink {
  return {
    id: 'IT-001',
    title: '링크 제목',
    url: 'https://example.com/a',
    purpose: '링크 설명',
    category: '보안',
    type: '문서',
    access: '무료',
    course: null,
    order: null,
    level: null,
    language: null,
    estimatedMinutes: null,
    verified: false,
    published: true,
    ...overrides,
  }
}
