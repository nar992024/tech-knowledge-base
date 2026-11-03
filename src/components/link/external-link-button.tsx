import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ExternalLinkButtonProps {
  url: string
  title: string
  className?: string
}

export function ExternalLinkButton({
  url,
  title,
  className,
}: ExternalLinkButtonProps) {
  return (
    <Button asChild variant="outline" className={className}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} 원본 열기 (새 탭)`}
      >
        원본 열기
        <ExternalLink aria-hidden="true" />
      </a>
    </Button>
  )
}
