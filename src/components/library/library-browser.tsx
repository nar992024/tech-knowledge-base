'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LibraryCard } from '@/components/library/library-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ALL_OPTION,
  filterLibraryLinks,
  toLibrarySearch,
  type LibraryFilters,
} from '@/lib/content/library-filter'
import { LINK_TYPES, type LibraryLink } from '@/types/content'

const URL_SYNC_DELAY_MS = 300

interface FilterSelectProps {
  id: string
  label: string
  allLabel: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}

function FilterSelect({
  id,
  label,
  allLabel,
  value,
  options,
  onChange,
}: FilterSelectProps) {
  return (
    <div className="w-full md:w-52">
      <Label htmlFor={id} className="mb-2">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-11">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_OPTION} className="min-h-11">
            {allLabel}
          </SelectItem>
          {options.map(option => (
            <SelectItem key={option} value={option} className="min-h-11">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface LibraryBrowserProps {
  links: LibraryLink[]
  categories: string[]
  initialFilters: LibraryFilters
}

export function LibraryBrowser({
  links,
  categories,
  initialFilters,
}: LibraryBrowserProps) {
  const [filters, setFilters] = useState(initialFilters)
  const syncedQuery = useRef(initialFilters.query)
  const results = useMemo(
    () => filterLibraryLinks(links, filters),
    [links, filters]
  )
  const isFiltered =
    filters.query.trim() !== '' ||
    filters.category !== ALL_OPTION ||
    filters.type !== ALL_OPTION

  // 검색 조건을 주소에 남겨 결과 화면을 그대로 공유할 수 있게 한다
  // 지연 중인 주소 변경은 진행 중인 페이지 이동을 취소할 수 있어 입력 중인 검색어에만 지연을 둔다
  useEffect(() => {
    const syncUrl = () => {
      syncedQuery.current = filters.query
      const search = toLibrarySearch(filters)
      if (search !== window.location.search) {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${search}`
        )
      }
    }

    if (filters.query === syncedQuery.current) {
      syncUrl()
      return
    }
    const timer = setTimeout(syncUrl, URL_SYNC_DELAY_MS)
    return () => clearTimeout(timer)
  }, [filters])

  const updateFilter = (patch: Partial<LibraryFilters>) =>
    setFilters(current => ({ ...current, ...patch }))
  const resetFilters = () =>
    setFilters({ query: '', category: ALL_OPTION, type: ALL_OPTION })

  return (
    <>
      <search className="bg-muted mt-8 flex flex-col gap-4 rounded-lg p-4 md:flex-row md:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor="library-search" className="mb-2">
            검색어
          </Label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              id="library-search"
              type="search"
              value={filters.query}
              onChange={event => updateFilter({ query: event.target.value })}
              placeholder="제목, 설명, 주소로 검색"
              className="bg-background h-11 pl-9"
            />
          </div>
        </div>
        <FilterSelect
          id="library-category"
          label="카테고리"
          allLabel="모든 카테고리"
          value={filters.category}
          options={categories}
          onChange={category => updateFilter({ category })}
        />
        <FilterSelect
          id="library-type"
          label="유형"
          allLabel="모든 유형"
          value={filters.type}
          options={LINK_TYPES}
          onChange={type => updateFilter({ type })}
        />
        <Button
          type="button"
          variant="outline"
          onClick={resetFilters}
          disabled={!isFiltered}
        >
          <X aria-hidden="true" />
          초기화
        </Button>
      </search>

      <p role="status" className="text-muted-foreground mt-6 text-sm">
        전체 {links.length}개 중 <strong>{results.length}개</strong>
      </p>

      {results.length > 0 ? (
        <ul
          role="list"
          className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {results.map(link => (
            <li key={link.id}>
              <LibraryCard link={link} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed p-10 text-center">
          <p className="font-bold">조건에 맞는 자료가 없습니다</p>
          <p className="text-muted-foreground mt-2">
            검색어나 필터를 바꾸거나 초기화해 보세요.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={resetFilters}
            className="mt-4"
          >
            조건 초기화
          </Button>
        </div>
      )}
    </>
  )
}
