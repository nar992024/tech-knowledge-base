import { describe, expect, it } from 'vitest'
import { buildSiteContent, findCourse } from '@/lib/content/rules'
import { makeCourse, makeLink } from './fixtures'

const step = (id: string, order: number, overrides = {}) =>
  makeLink({
    id,
    course: 'course-a',
    order,
    level: '입문',
    verified: true,
    ...overrides,
  })

describe('buildSiteContent', () => {
  it('코스 단계에는 공개이면서 검증 완료인 링크만 넣는다', () => {
    const { content } = buildSiteContent({
      courses: [makeCourse()],
      links: [
        step('IT-001', 1),
        step('IT-002', 2, { verified: false }),
        step('IT-003', 3, { published: false }),
      ],
    })

    expect(content.courses[0]?.steps.map(link => link.id)).toEqual(['IT-001'])
  })

  it('비공개 코스와 표시할 단계가 없는 코스는 숨긴다', () => {
    const { content } = buildSiteContent({
      courses: [
        makeCourse({ slug: 'hidden', published: false }),
        makeCourse({ slug: 'empty' }),
        makeCourse({ slug: 'course-a' }),
      ],
      links: [
        step('IT-001', 1, { course: 'hidden' }),
        step('IT-002', 1, { course: 'empty', verified: false }),
        step('IT-003', 1),
      ],
    })

    expect(content.courses.map(course => course.slug)).toEqual(['course-a'])
    expect(findCourse(content, 'hidden')).toBeUndefined()
  })

  it('코스와 단계를 순서대로 정렬한다', () => {
    const { content } = buildSiteContent({
      courses: [
        makeCourse({ slug: 'second', order: 2 }),
        makeCourse({ slug: 'course-a', order: 1 }),
      ],
      links: [
        step('IT-003', 2),
        step('IT-001', 1),
        step('IT-002', 1, { course: 'second' }),
      ],
    })

    expect(content.courses.map(course => course.slug)).toEqual([
      'course-a',
      'second',
    ])
    expect(content.courses[0]?.steps.map(link => link.id)).toEqual([
      'IT-001',
      'IT-003',
    ])
  })

  it('순서가 중복되면 링크 ID 순으로 표시하고 경고를 남긴다', () => {
    const { content, warnings } = buildSiteContent({
      courses: [makeCourse()],
      links: [step('IT-002', 1), step('IT-001', 1)],
    })

    expect(content.courses[0]?.steps.map(link => link.id)).toEqual([
      'IT-001',
      'IT-002',
    ])
    expect(warnings).toHaveLength(1)
  })

  it('자료실에는 공개 링크를 모두 넣고, 보이는 단계에만 코스를 연결한다', () => {
    const { content } = buildSiteContent({
      courses: [makeCourse()],
      links: [
        step('IT-001', 1),
        step('IT-002', 2, { verified: false }),
        makeLink({ id: 'IT-003' }),
        makeLink({ id: 'IT-004', published: false }),
      ],
    })

    expect(content.library.map(link => link.id)).toEqual([
      'IT-001',
      'IT-002',
      'IT-003',
    ])
    expect(content.library[0]?.courseRef?.slug).toBe('course-a')
    expect(content.library[1]?.courseRef).toBeNull()
    expect(content.library[2]?.courseRef).toBeNull()
  })
})
