import type { Metadata } from 'next'
import { Container } from '@/components/layout/container'
import { LibraryBrowser } from '@/components/library/library-browser'
import { ALL_OPTION } from '@/lib/content/library-filter'
import { getSiteContent } from '@/lib/content/service'
import { LINK_TYPES } from '@/types/content'

export const dynamic = 'force-dynamic'

const DESCRIPTION =
  'AI 코딩, 에이전트, 테스트, 보안 등 기술 자료를 검색과 필터로 찾아보세요.'

export const metadata: Metadata = {
  title: '자료실',
  description: DESCRIPTION,
  openGraph: {
    title: '자료실',
    description: DESCRIPTION,
    images: '/opengraph-image',
  },
}

interface LibraryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const allowedOrAll = (value: string | undefined, allowed: readonly string[]) =>
  value && allowed.includes(value) ? value : ALL_OPTION

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams
  const { library } = await getSiteContent()
  const categories = [...new Set(library.map(link => link.category))].sort(
    (a, b) => a.localeCompare(b, 'ko')
  )

  return (
    <Container className="py-8 sm:py-12">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          자료실
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">{DESCRIPTION}</p>
      </header>

      <LibraryBrowser
        links={library}
        categories={categories}
        initialFilters={{
          query: firstValue(params.q) ?? '',
          category: allowedOrAll(firstValue(params.category), categories),
          type: allowedOrAll(firstValue(params.type), LINK_TYPES),
        }}
      />

      <p className="text-muted-foreground mt-10 border-t pt-6 text-sm">
        외부 자료의 내용은 변경될 수 있으며, 검증 완료 표시가 없는 자료는 내용을
        직접 확인하지 않았습니다.
      </p>
    </Container>
  )
}
