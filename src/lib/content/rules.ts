import type {
  CourseStep,
  LibraryLink,
  RawContent,
  RawLink,
  SiteContent,
  SiteCourse,
} from '@/types/content'

function isCourseStep(link: RawLink): link is CourseStep {
  return link.order !== null && link.level !== null
}

function byOrderThenId(a: CourseStep, b: CourseStep): number {
  return a.order - b.order || a.id.localeCompare(b.id)
}

export function buildSiteContent(raw: RawContent): {
  content: SiteContent
  warnings: string[]
} {
  const warnings: string[] = []
  const publishedLinks = raw.links.filter(link => link.published)

  // 공개 코스에는 검증을 마친 공개 링크만 노출하고, 보여 줄 단계가 없는 코스는 숨긴다
  const courses: SiteCourse[] = raw.courses
    .filter(course => course.published)
    .map(course => {
      const steps = publishedLinks
        .filter(link => link.course === course.slug && link.verified)
        .filter(isCourseStep)
        .sort(byOrderThenId)

      steps.forEach((step, index) => {
        if (index > 0 && steps[index - 1]?.order === step.order) {
          warnings.push(
            `${course.slug} 코스의 순서 ${step.order}이 중복되었습니다: ${step.id}`
          )
        }
      })

      return { ...course, steps }
    })
    .filter(course => course.steps.length > 0)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))

  const courseByStepId = new Map<string, { slug: string; name: string }>()
  for (const course of courses) {
    for (const step of course.steps) {
      courseByStepId.set(step.id, { slug: course.slug, name: course.name })
    }
  }

  // 자료실에서 안내하는 코스 링크는 실제로 해당 단계가 보이는 경우에만 연결한다
  const library: LibraryLink[] = publishedLinks
    .map(link => ({ ...link, courseRef: courseByStepId.get(link.id) ?? null }))
    .sort((a, b) => a.id.localeCompare(b.id))

  return { content: { courses, library }, warnings }
}

export function findCourse(
  content: SiteContent,
  slug: string
): SiteCourse | undefined {
  return content.courses.find(course => course.slug === slug)
}
