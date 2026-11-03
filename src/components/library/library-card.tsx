import { BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import { ExternalLinkButton } from '@/components/link/external-link-button'
import { LinkBadges } from '@/components/link/link-badges'
import { Badge } from '@/components/ui/badge'
import type { LibraryLink } from '@/types/content'

export function LibraryCard({ link }: { link: LibraryLink }) {
  return (
    <article className="bg-card flex h-full flex-col rounded-lg border p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground text-sm font-medium">
          {link.category}
        </span>
        {link.verified && (
          <Badge variant="secondary">
            <BadgeCheck aria-hidden="true" />
            검증 완료
          </Badge>
        )}
      </div>
      <h2 className="mt-2 text-lg font-bold break-words">{link.title}</h2>
      <p className="mt-1 flex-1">{link.purpose}</p>
      <p className="text-muted-foreground mt-3 truncate text-sm">
        {new URL(link.url).hostname.replace(/^www\./, '')}
      </p>
      <LinkBadges link={link} className="mt-3" />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ExternalLinkButton url={link.url} title={link.title} />
        {link.courseRef && (
          <Link
            href={`/courses/${link.courseRef.slug}`}
            className="text-primary inline-flex min-h-11 items-center px-2 text-sm font-bold hover:underline"
          >
            {link.courseRef.name} 코스
          </Link>
        )}
      </div>
    </article>
  )
}
