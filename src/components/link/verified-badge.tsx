import { BadgeCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function VerifiedBadge() {
  return (
    <Badge variant="secondary">
      <BadgeCheck aria-hidden="true" />
      검증 완료
    </Badge>
  )
}
