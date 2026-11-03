import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { logger } from '@/lib/logger'
import type { SiteContent } from '@/types/content'
import { withLastGood } from './fallback'
import { buildSiteContent } from './rules'
import { loadRawContent } from './sources'

// 만료 후 첫 요청이 재조회를 시작하므로 5분 안에 반영되도록 주기를 그보다 짧게 둔다
const REVALIDATE_SECONDS = 240

// 캐시는 재시작 후에도 남으므로 출처별로 키를 나눠 seed 데이터가 Notion 모드에 섞이지 않게 한다
const loadCachedRawContent = unstable_cache(
  loadRawContent,
  ['site-content', process.env.CONTENT_SOURCE || 'notion'],
  { revalidate: REVALIDATE_SECONDS, tags: ['site-content'] }
)

const loadRawContentSafely = withLastGood(loadCachedRawContent, error => {
  logger.error(
    '콘텐츠 조회에 실패해 마지막 데이터를 표시합니다',
    undefined,
    error instanceof Error ? error : new Error(String(error))
  )
})

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const { content, warnings } = buildSiteContent(await loadRawContentSafely())
  for (const warning of warnings) logger.warn(warning)
  return content
})
