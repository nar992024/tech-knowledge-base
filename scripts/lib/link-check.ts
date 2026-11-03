export type LinkCheckStatus = 'ok' | 'moved' | 'manual' | 'broken'

export interface LinkCheckResult {
  id: string
  url: string
  status: LinkCheckStatus
  detail: string
}

const MANUAL_CHECK_HOSTS = ['x.com', 'twitter.com']

const normalizeUrl = (url: string) => url.toLowerCase().replace(/\/$/, '')

// 403과 X 링크는 봇 차단이나 로그인 때문일 수 있어 끊어진 링크로 단정하지 않는다
export function classifyResponse(
  url: string,
  responseStatus: number,
  finalUrl: string
): { status: LinkCheckStatus; detail: string } {
  const isManualHost = MANUAL_CHECK_HOSTS.includes(new URL(url).hostname)

  if (isManualHost) {
    return { status: 'manual', detail: `X 링크 (HTTP ${responseStatus})` }
  }
  if (responseStatus === 401 || responseStatus === 403) {
    return { status: 'manual', detail: `HTTP ${responseStatus}` }
  }
  if (responseStatus >= 400) {
    return { status: 'broken', detail: `HTTP ${responseStatus}` }
  }
  if (normalizeUrl(url) !== normalizeUrl(finalUrl)) {
    return { status: 'moved', detail: finalUrl }
  }
  return { status: 'ok', detail: `HTTP ${responseStatus}` }
}
