import { loadEnvConfig } from '@next/env'
import { loadRawContent } from '../src/lib/content/sources'
import { classifyResponse, type LinkCheckResult } from './lib/link-check'

const CONCURRENCY = 8
const TIMEOUT_MS = 25_000

async function checkLink(link: {
  id: string
  url: string
}): Promise<LinkCheckResult> {
  try {
    const response = await fetch(link.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'User-Agent': 'Mozilla/5.0 link-check',
        Accept: 'text/html,*/*',
      },
    })
    await response.body?.cancel()
    return {
      ...link,
      ...classifyResponse(link.url, response.status, response.url),
    }
  } catch (error) {
    return {
      ...link,
      status: 'broken',
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

async function main() {
  loadEnvConfig(process.cwd())
  const { links } = await loadRawContent()
  const targets = links.filter(link => link.published)

  const results: LinkCheckResult[] = []
  for (let index = 0; index < targets.length; index += CONCURRENCY) {
    results.push(
      ...(await Promise.all(
        targets.slice(index, index + CONCURRENCY).map(checkLink)
      ))
    )
  }

  const sections = [
    ['끊어진 링크', 'broken'],
    ['주소가 바뀐 링크', 'moved'],
    ['직접 확인할 링크', 'manual'],
  ] as const
  for (const [label, status] of sections) {
    const rows = results.filter(result => result.status === status)
    console.log(`\n${label}: ${rows.length}개`)
    for (const row of rows) {
      console.log(`  ${row.id}  ${row.url}  (${row.detail})`)
    }
  }
  console.log(
    `\n정상 ${results.filter(result => result.status === 'ok').length}/${results.length}개`
  )

  if (results.some(result => result.status === 'broken')) process.exit(1)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
