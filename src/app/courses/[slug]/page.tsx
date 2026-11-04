import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CourseStepItem } from '@/components/course/course-step-item'
import { Container } from '@/components/layout/container'
import { Badge } from '@/components/ui/badge'
import { findCourse } from '@/lib/content/rules'
import { getSiteContent } from '@/lib/content/service'

export const dynamic = 'force-dynamic'

interface CoursePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { slug } = await params
  const course = findCourse(await getSiteContent(), slug)
  if (!course) return { title: '코스를 찾을 수 없습니다' }

  return {
    title: course.name,
    description: course.summary,
    openGraph: {
      title: course.name,
      description: course.summary,
      images: '/opengraph-image',
    },
  }
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params
  const course = findCourse(await getSiteContent(), slug)
  if (!course) notFound()

  return (
    <Container size="sm" className="py-8 sm:py-12">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        코스 목록
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{course.level}</Badge>
          <span className="text-muted-foreground text-sm">
            {course.steps.length}단계
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          {course.name}
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{course.summary}</p>
        <dl className="bg-muted mt-6 grid gap-4 rounded-lg p-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold">이런 분께 맞습니다</dt>
            <dd className="text-muted-foreground mt-1 text-sm">
              {course.audience}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-bold">시작 전에 필요한 지식</dt>
            <dd className="text-muted-foreground mt-1 text-sm">
              {course.prerequisites}
            </dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="steps-heading" className="mt-10">
        <h2 id="steps-heading" className="text-2xl font-bold">
          학습 순서
        </h2>
        <ol role="list" className="mt-5 space-y-4">
          {course.steps.map((step, index) => (
            <CourseStepItem key={step.id} step={step} position={index + 1} />
          ))}
        </ol>
      </section>

      <p className="text-muted-foreground mt-10 border-t pt-6 text-sm">
        외부 자료의 내용은 변경될 수 있으며, 검증 완료 표시가 없는 자료는 내용을
        직접 확인하지 않았습니다.
      </p>
    </Container>
  )
}
