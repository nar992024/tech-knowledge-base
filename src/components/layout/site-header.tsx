import Link from 'next/link'
import { Container } from '@/components/layout/container'
import { NavLink } from '@/components/layout/nav-link'
import { ThemeToggle } from '@/components/theme-toggle'
import { SITE_NAME } from '@/lib/site'

export function SiteHeader() {
  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex items-center justify-between gap-3 py-2">
        <Link
          href="/"
          className="flex min-h-11 items-center text-sm font-bold whitespace-nowrap sm:text-lg"
        >
          <span className="max-[359px]:hidden">{SITE_NAME}</span>
          <span className="hidden max-[359px]:inline">Tech KB</span>
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="주요 메뉴" className="flex items-center gap-1">
            <NavLink href="/">코스</NavLink>
            <NavLink href="/library">자료실</NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  )
}
