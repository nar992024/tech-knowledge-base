import { readFile } from 'node:fs/promises'
import { loadEnvConfig } from '@next/env'
import { getEnv } from '../src/lib/env'
import { runAddLink } from './lib/add-link-core'
import { createNotionGateway } from './lib/notion-gateway'

async function main() {
  loadEnvConfig(process.cwd())
  const dryRun = process.argv.includes('--dry-run')
  const inputPath = process.argv.slice(2).find(arg => !arg.startsWith('--'))
  if (!inputPath) {
    throw new Error(
      '사용법: npm run notion:add-link -- <입력 JSON 파일> [--dry-run]'
    )
  }

  if (getEnv().CONTENT_SOURCE !== 'notion') {
    throw new Error('CONTENT_SOURCE=notion 상태에서만 실행할 수 있습니다')
  }

  // Windows 편집기가 붙이는 BOM이 있어도 읽을 수 있게 제거한다
  const content = (await readFile(inputPath, 'utf8')).replace(/^﻿/, '')
  const link = await runAddLink(JSON.parse(content), createNotionGateway(), {
    dryRun,
  })
  console.log(`${dryRun ? '[미리 보기] ' : '추가 완료: '}${link.id}`)
  console.log(JSON.stringify(link, null, 2))
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
