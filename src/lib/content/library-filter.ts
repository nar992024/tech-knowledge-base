import type { LibraryLink } from '@/types/content'

export const ALL_OPTION = 'all'

export interface LibraryFilters {
  query: string
  category: string
  type: string
}

export function filterLibraryLinks(
  links: LibraryLink[],
  { query, category, type }: LibraryFilters
): LibraryLink[] {
  const keyword = query.trim().toLocaleLowerCase('ko')

  return links.filter(link => {
    if (category !== ALL_OPTION && link.category !== category) return false
    if (type !== ALL_OPTION && link.type !== type) return false
    if (!keyword) return true
    return [link.title, link.purpose, link.url, link.category]
      .join(' ')
      .toLocaleLowerCase('ko')
      .includes(keyword)
  })
}

export function toLibrarySearch({
  query,
  category,
  type,
}: LibraryFilters): string {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  if (category !== ALL_OPTION) params.set('category', category)
  if (type !== ALL_OPTION) params.set('type', type)
  const search = params.toString()
  return search ? `?${search}` : ''
}
