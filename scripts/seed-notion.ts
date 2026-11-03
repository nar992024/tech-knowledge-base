import { loadEnvConfig } from '@next/env'
import type { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints'
import {
  COURSE_PROPERTIES,
  LINK_PROPERTIES,
} from '../src/lib/content/notion-mapper'
import { loadSeedData } from '../src/lib/content/sources'
import { getEnv } from '../src/lib/env'
import {
  getDataSourceId,
  getNotionClient,
  queryAllPages,
} from '../src/lib/notion'
import { runSeed, type SeedGateway } from './lib/seed-core'

// Notion API 요청 제한(초당 3회)을 넘지 않도록 쓰기 사이에 쉰다
const WRITE_DELAY_MS = 350
const wait = () => new Promise(resolve => setTimeout(resolve, WRITE_DELAY_MS))

function createGateway(): SeedGateway {
  const env = getEnv()
  const databaseIds = {
    course: env.NOTION_COURSE_DATABASE_ID as string,
    link: env.NOTION_DATABASE_ID as string,
  }
  const keyProperty = {
    course: COURSE_PROPERTIES.slug.name,
    link: LINK_PROPERTIES.id.name,
  }

  return {
    async getPropertyTypes(kind) {
      const dataSource = await getNotionClient().dataSources.retrieve({
        data_source_id: await getDataSourceId(databaseIds[kind]),
      })
      if (!('properties' in dataSource)) return {}
      return Object.fromEntries(
        Object.entries(dataSource.properties).map(([name, property]) => [
          name,
          property.type,
        ])
      )
    },
    async listPages(kind) {
      const pages = await queryAllPages(databaseIds[kind])
      return pages.flatMap(page => {
        const property = page.properties[keyProperty[kind]]
        const key =
          property?.type === 'rich_text'
            ? property.rich_text.map(part => part.plain_text).join('')
            : ''
        return key ? [{ pageId: page.id, key }] : []
      })
    },
    async createPage(kind, properties) {
      const page = await getNotionClient().pages.create({
        parent: {
          type: 'data_source_id',
          data_source_id: await getDataSourceId(databaseIds[kind]),
        },
        properties: properties as CreatePageParameters['properties'],
      })
      await wait()
      return page.id
    },
    async updatePage(pageId, properties) {
      await getNotionClient().pages.update({
        page_id: pageId,
        properties: properties as CreatePageParameters['properties'],
      })
      await wait()
    },
  }
}

async function main() {
  loadEnvConfig(process.cwd())
  const dryRun = process.argv.includes('--dry-run')
  const update = process.argv.includes('--update')

  if (getEnv().CONTENT_SOURCE !== 'notion') {
    throw new Error('CONTENT_SOURCE=notion 상태에서만 실행할 수 있습니다')
  }

  const summary = await runSeed(await loadSeedData(), createGateway(), {
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
