import { Client, isFullPage } from '@notionhq/client'
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import { getEnv } from './env'

let client: Client | null = null

export function getNotionClient(): Client {
  if (!client) {
    client = new Client({
      auth: getEnv().NOTION_API_KEY,
      notionVersion: '2025-09-03',
    })
  }
  return client
}

const dataSourceIds = new Map<string, string>()

export async function getDataSourceId(databaseId: string): Promise<string> {
  const cached = dataSourceIds.get(databaseId)
  if (cached) return cached

  const database = await getNotionClient().databases.retrieve({
    database_id: databaseId,
  })
  const dataSourceId =
    'data_sources' in database ? database.data_sources[0]?.id : undefined

  if (!dataSourceId) {
    throw new Error(`데이터베이스에 data source가 없습니다: ${databaseId}`)
  }

  dataSourceIds.set(databaseId, dataSourceId)
  return dataSourceId
}

export async function queryAllPages(
  databaseId: string
): Promise<PageObjectResponse[]> {
  const dataSourceId = await getDataSourceId(databaseId)
  const pages: PageObjectResponse[] = []
  let cursor: string | undefined

  do {
    const response = await getNotionClient().dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      start_cursor: cursor,
    })
    pages.push(
      ...response.results.filter(
        (result): result is PageObjectResponse =>
          result.object === 'page' && isFullPage(result)
      )
    )
    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined
  } while (cursor)

  return pages
}
