import type { MetadataRoute } from 'next'
import { getSiteContent } from '@/lib/content/service'
import { logger } from '@/lib/logger'
import { getSiteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl()
  const staticRoutes = [{ url: baseUrl }, { url: `${baseUrl}/library` }]

  try {
    const { courses } = await getSiteContent()
    return [
      ...staticRoutes,
      ...courses.map(course => ({ url: `${baseUrl}/courses/${course.slug}` })),
    ]
  } catch (error) {
    logger.error(
      'sitemap 생성 중 콘텐츠 조회에 실패했습니다',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    )
    return staticRoutes
  }
}
