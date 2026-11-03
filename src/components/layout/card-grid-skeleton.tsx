import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function CardGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('grid gap-5 md:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-56 w-full" />
      ))}
    </div>
  )
}
