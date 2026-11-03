import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Level, RawLink } from '@/types/content'

interface LinkBadgesProps {
  link: Pick<RawLink, 'type' | 'access' | 'language' | 'estimatedMinutes'>
  level?: Level | null
  className?: string
}

export function LinkBadges({ link, level, className }: LinkBadgesProps) {
  const labels = [
    level,
    link.type,
    link.access,
    link.language,
    link.estimatedMinutes ? `약 ${link.estimatedMinutes}분` : null,
  ].filter((label): label is NonNullable<typeof label> => Boolean(label))

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {labels.map(label => (
        <Badge key={label} variant="outline">
          {label}
        </Badge>
      ))}
    </div>
  )
}
