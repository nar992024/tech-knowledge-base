export const SITE_NAME = 'Tech Knowledge Base'
export const SITE_DESCRIPTION =
  'AI 코딩과 에이전트 개발을 공부하는 개발자를 위한 학습 코스와 기술 자료실'

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return 'http://localhost:3000'
}
