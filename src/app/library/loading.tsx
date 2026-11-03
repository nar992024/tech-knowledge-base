import { Container } from '@/components/layout/container'
import { CardGridSkeleton } from '@/components/layout/card-grid-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function LibraryLoading() {
  return (
    <Container className="py-8 sm:py-12">
      <p className="sr-only" role="status">
        자료를 불러오는 중입니다
      </p>
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-8 h-14 w-full" />
      <CardGridSkeleton className="mt-6" />
    </Container>
  )
}
