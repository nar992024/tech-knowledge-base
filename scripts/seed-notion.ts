import { loadEnvConfig } from '@next/env'
import { loadSeedData } from '../src/lib/content/sources'
import { getEnv } from '../src/lib/env'
import { createNotionGateway } from './lib/notion-gateway'
import { runSeed } from './lib/seed-core'

async function main() {
  loadEnvConfig(process.cwd())
  const dryRun = process.argv.includes('--dry-run')
  const update = process.argv.includes('--update')

  if (getEnv().CONTENT_SOURCE !== 'notion') {
    throw new Error('CONTENT_SOURCE=notion 상태에서만 실행할 수 있습니다')
  }

  const summary = await runSeed(await loadSeedData(), createNotionGateway(), {
    dryRun,
    update,
    onProgress: message => console.log(message),
  })
  console.log(
    `${dryRun ? '[미리 보기] ' : ''}생성 ${summary.created}개, 갱신 ${summary.updated}개, 건너뜀 ${summary.skipped}개`
  )
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
