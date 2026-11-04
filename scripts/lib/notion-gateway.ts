import type { CreatePageParameters } from '@notionhq/client/build/src/api-endpoints'
import {
  COURSE_PROPERTIES,
  LINK_PROPERTIES,
} from '../../src/lib/content/notion-mapper'
import { getEnv } from '../../src/lib/env'
import {
  getDataSourceId,
  getNotionClient,
  queryAllPages,
} from '../../src/lib/notion'
import type { AddLinkGateway } from './add-link-core'
import type { SeedGateway } from './seed-core'

// Notion API 요청 제한(초당 3회)을 넘지 않도록 쓰기 사이에 쉰다
const WRITE_DELAY_MS = 350
const wait = () => new Promise(resolve => setTimeout(resolve, WRITE_DELAY_MS))

export function createNotionGateway(): SeedGateway & AddLinkGateway {
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
    async listLinks() {
      const pages = await queryAllPages(databaseIds.link)
      return pages.flatMap(page => {
        const idProperty = page.properties[LINK_PROPERTIES.id.name]
        const urlProperty = page.properties[LINK_PROPERTIES.url.name]
        const id =
          idProperty?.type === 'rich_text'
            ? idProperty.rich_text.map(part => part.plain_text).join('')
            : ''
        const url = urlProperty?.type === 'url' ? urlProperty.url : null
        return id ? [{ id, url }] : []
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
