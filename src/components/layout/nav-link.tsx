'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  href: string
  children: React.ReactNode
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname()
  const isActive =
    href === '/'
      ? pathname === '/' || pathname.startsWith('/courses')
      : pathname.startsWith(href)

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'hover:bg-accent flex min-h-11 items-center rounded-md px-2 text-sm font-medium whitespace-nowrap sm:px-3',
        isActive && 'bg-secondary text-secondary-foreground font-bold'
      )}
    >
      {children}
    </Link>
  )
}
