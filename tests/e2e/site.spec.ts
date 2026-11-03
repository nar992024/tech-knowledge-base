import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const expectNoA11yViolations = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(
    violations.map(violation => ({
      id: violation.id,
      targets: violation.nodes.slice(0, 5).map(node => node.target.join(' ')),
    }))
  ).toEqual([])
}

test.describe('코스', () => {
  test('코스 목록에서 원본 링크까지 이동할 수 있다', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle('Tech Knowledge Base')

    await page.getByRole('link', { name: 'AI 코드 품질과 테스트' }).click()
    await expect(page).toHaveURL('/courses/ai-code-quality')
    await expect(
      page.getByRole('heading', { level: 1, name: 'AI 코드 품질과 테스트' })
    ).toBeVisible()

    const original = page.getByRole('link', {
      name: 'How the Claude Code team does code review 원본 열기 (새 탭)',
    })
    await expect(original).toHaveAttribute(
      'href',
      'https://claude.dev/blog/solving-code-review-at-anthropic/'
    )
    await expect(original).toHaveAttribute('target', '_blank')
    await expect(original).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('검증 완료 단계만 표시하고, 단계가 없는 코스는 숨긴다', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 3 })).toHaveText([
      'Claude Code 입문',
      'AI 에이전트 엔지니어링',
      'AI 코드 품질과 테스트',
    ])

    await page.goto('/courses/ai-code-quality')
    await expect(page.getByText('인프런 Playwright 기초')).toHaveCount(0)
    await expect(page.getByRole('listitem')).toHaveCount(2)
  })

  test('없는 코스와 숨긴 코스는 404를 보여 준다', async ({ page }) => {
    for (const slug of ['no-such-course', 'stanford-cs146s']) {
      const response = await page.goto(`/courses/${slug}`)
      expect(response?.status()).toBe(404)
      await expect(
        page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })
      ).toBeVisible()
    }
    await page.getByRole('link', { name: '코스 목록으로 돌아가기' }).click()
    await expect(page).toHaveURL('/')
  })
})

test.describe('자료실', () => {
  test('공개 링크를 모두 보여 주고 비공개 링크는 숨긴다', async ({ page }) => {
    await page.goto('/library')
    await expect(page.getByRole('status')).toHaveText('전체 66개 중 66개')
    await expect(page.getByText('하네스 엔지니어링 우선론')).toHaveCount(0)
    await expect(page.getByText('미검증')).toHaveCount(0)
    await expect(page.getByText(/검증 완료 표시가 없는 자료/)).toBeVisible()
  })

  test('검색 조건을 주소에 저장하고 공유 주소로 복원한다', async ({ page }) => {
    await page.goto('/library')
    await page.getByLabel('검색어').fill('playwright')
    await expect(page.getByRole('status')).toHaveText('전체 66개 중 4개')
    await expect(page).toHaveURL('/library?q=playwright')

    await page.goto('/library?q=playwright&type=%EA%B0%95%EC%9D%98')
    await expect(page.getByLabel('검색어')).toHaveValue('playwright')
    await expect(page.getByRole('status')).toHaveText('전체 66개 중 1개')
    await expect(
      page.getByRole('heading', { name: '인프런 Playwright 기초' })
    ).toBeVisible()
  })

  test('카테고리 필터와 코스 연결이 동작한다', async ({ page }) => {
    await page.goto('/library')
    await page.getByLabel('카테고리').click()
    await page.getByRole('option', { name: '보안' }).click()
    await expect(page.getByRole('status')).toHaveText('전체 66개 중 2개')

    await page.getByRole('link', { name: 'AI 코드 품질과 테스트 코스' }).click()
    await expect(page).toHaveURL('/courses/ai-code-quality')
  })

  test('결과가 없으면 안내하고 초기화할 수 있다', async ({ page }) => {
    await page.goto('/library?q=zzzz-no-match')
    await expect(page.getByText('조건에 맞는 자료가 없습니다')).toBeVisible()

    await page.getByRole('button', { name: '조건 초기화' }).click()
    await expect(page.getByRole('status')).toHaveText('전체 66개 중 66개')
    await expect(page).toHaveURL('/library')
  })

  test('잘못된 필터 값은 전체로 처리한다', async ({ page }) => {
    await page.goto('/library?category=none&type=none')
    await expect(page.getByRole('status')).toHaveText('전체 66개 중 66개')
  })
})

test.describe('품질', () => {
  for (const path of [
    '/',
    '/courses/claude-code-basics',
    '/library',
    '/none',
  ]) {
    test(`${path} 접근성 위반이 없다 (라이트)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expectNoA11yViolations(page)
    })

    test(`${path} 접근성 위반이 없다 (다크)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      await expect(page.locator('html')).toHaveClass(/dark/)
      await expectNoA11yViolations(page)
    })

    test(`${path} 터치 대상이 44px 이상이고 가로로 넘치지 않는다`, async ({
      page,
    }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')

      const small = await page
        .locator(
          'main a, main button, header a, header button, [role="combobox"]'
        )
        .evaluateAll(elements =>
          elements
            .filter(element => (element as HTMLElement).offsetParent !== null)
            // 카드 전체로 확장된 링크는 카드 크기가 실제 터치 영역이다
            .filter(element => !element.hasAttribute('data-stretched-link'))
            .filter(element => element.getBoundingClientRect().height < 44)
            .map(element => element.textContent?.trim())
        )
      expect(small).toEqual([])

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('가장 좁은 화면에서도 헤더가 한 줄로 유지된다', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/library')
    await page.waitForLoadState('networkidle')

    const header = await page.getByRole('banner').boundingBox()
    expect(header?.height).toBeLessThanOrEqual(64)
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('키보드로 본문 건너뛰기와 테마 전환을 쓸 수 있다', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(
      page.getByRole('link', { name: '본문으로 건너뛰기' })
    ).toBeFocused()

    await page.getByRole('button', { name: '테마 전환' }).focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: '다크' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })

  test('검색 노출 파일과 메타데이터를 제공한다', async ({ page, request }) => {
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('/courses/claude-code-basics')
    expect(sitemap).toContain('/library')
    expect(sitemap).not.toContain('/courses/stanford-cs146s')

    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('sitemap.xml')

    expect((await request.get('/opengraph-image')).ok()).toBe(true)

    await page.goto('/courses/claude-code-basics')
    await expect(page).toHaveTitle('Claude Code 입문 | Tech Knowledge Base')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /opengraph-image/
    )
  })
})
