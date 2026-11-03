import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton'
import { Container } from '@/components/layout/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <Container className="py-10 sm:py-14">
      <p className="sr-only" role="status">
        코스를 불러오는 중입니다
      </p>
      <Skeleton className="h-12 w-full max-w-2xl" />
      <Skeleton className="mt-4 h-7 w-full max-w-xl" />
      <CardGridSkeleton className="mt-12" />
    </Container>
  )
}
