import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CourseCard } from '@/components/course/course-card'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui/button'
import { getSiteContent } from '@/lib/content/service'
import { SITE_DESCRIPTION } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { courses, library } = await getSiteContent()

  return (
    <Container className="py-10 sm:py-14">
      <section className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          무엇을 어떤 순서로 공부할지 코스로 안내합니다
        </h1>
        <p className="text-muted-foreground mt-4 text-lg">{SITE_DESCRIPTION}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/library">
            자료실에서 자료 {library.length}개 찾기
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section aria-labelledby="courses-heading" className="mt-12">
        <h2 id="courses-heading" className="text-2xl font-bold">
          학습 코스
        </h2>
        {courses.length > 0 ? (
          <ul
            role="list"
            className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            {courses.map(course => (
              <li key={course.slug}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground mt-6 rounded-lg border border-dashed p-8 text-center">
            공개된 코스를 준비하고 있습니다. 자료실에서 자료를 먼저 찾아보세요.
          </p>
        )}
      </section>
    </Container>
  )
}
