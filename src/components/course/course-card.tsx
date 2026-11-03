import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { SiteCourse } from '@/types/content'

export function CourseCard({ course }: { course: SiteCourse }) {
  return (
    <article className="bg-card hover:border-primary relative flex h-full flex-col rounded-lg border p-6 transition-colors">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{course.level}</Badge>
        <span className="text-muted-foreground text-sm">
          {course.steps.length}단계
        </span>
      </div>
      <h3 className="mt-3 text-xl font-bold">
        <Link
          href={`/courses/${course.slug}`}
          data-stretched-link
          className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-[3px]"
        >
          {course.name}
        </Link>
      </h3>
      <p className="mt-2 flex-1">{course.summary}</p>
      <p className="text-muted-foreground mt-4 text-sm">
        <span className="font-bold">대상</span> {course.audience}
      </p>
      <span
        aria-hidden="true"
        className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-bold"
      >
        코스 보기
        <ArrowRight className="size-4" />
      </span>
    </article>
  )
}
