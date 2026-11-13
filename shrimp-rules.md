# 프로젝트 개발 규칙

AI 에이전트가 이 저장소를 수정할 때 따르는 규칙이다. 기능 명세는 `docs/PRD.md`, 콘텐츠 운영은 `docs/notion-setup.md`를 따른다.

> ⚠️ `docs/guides/*`는 스타터 템플릿의 일반 가이드다. `login/`, `signup/`, `navigation/`, `sections/`, typed routes, Server Actions처럼 이 프로젝트에 없는 구조가 나온다. 실제 코드나 이 문서와 다르면 **실제 코드와 이 문서를 따른다.**

## 1. 프로젝트 개요

- Notion 코스 DB와 링크 DB를 읽어 코스(`/`, `/courses/[slug]`)와 자료실(`/library`)을 보여 주는 공개 읽기 전용 사이트다. 로그인, 관리자 화면, 쓰기 API는 없다.
- 운영 데이터의 기준은 **Notion**이다. `data/seed.json`은 초기 데이터이자 테스트 기준값이다.
- Production은 `https://tech-kb-plum.vercel.app`이다. **`main`에 push하면 자동으로 배포된다.**
- `package.json`의 메이저 버전을 유지한다. `next`와 `eslint-config-next`는 `15.5.28`, `react`와 `react-dom`은 `19.1.10`으로 고정되어 있으며, 업그레이드는 사용자가 요청할 때만 한다.

## 2. 디렉터리와 책임

| 경로                                             | 책임                                            | 규칙                                                                                    |
| ------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/app`                                        | 라우트, 메타데이터, sitemap, robots, OG 이미지  | 콘텐츠는 `getSiteContent()`로만 받는다                                                  |
| `src/components/{course,library,link,layout}`    | 화면 컴포넌트                                   | 도메인 폴더에 둔다. 파일명은 kebab-case, named export                                   |
| `src/components/ui`                              | shadcn/ui                                       | 기존 파일을 덮어쓰지 않는다 (5.7절)                                                     |
| `src/lib/content`                                | 조회, 검증, 공개 규칙, 캐시, 자료실 필터        | JSX와 화면 로직을 넣지 않는다                                                           |
| `src/lib/{env,notion,logger,site,utils}.ts`      | 환경 변수, Notion 클라이언트, 로그, 사이트 상수 |                                                                                         |
| `src/types/content.ts`                           | 콘텐츠 타입, Select 옵션 상수                   | 옵션 값은 Notion 옵션 이름과 정확히 같아야 한다                                         |
| `scripts/*.ts`                                   | CLI 진입점                                      | 인자 파싱, `loadEnvConfig`, `CONTENT_SOURCE` 확인, core 호출만 한다                     |
| `scripts/lib/*-core.ts`                          | 스크립트 로직                                   | Notion을 Gateway 인터페이스로 주입받아 단위 테스트한다                                  |
| `scripts/lib/notion-gateway.ts`                  | Gateway의 실제 Notion 구현                      | 쓰기 사이 350ms 대기를 유지한다 (요청 제한)                                             |
| `tests/unit`, `tests/e2e`                        | Vitest, Playwright + axe                        | 8절                                                                                     |
| `.claude/skills/add-site/SKILL.md`               | 새 자료 추가 절차                               | 필드, 카테고리, 코스 slug 목록을 담고 있어 관련 변경 시 함께 고친다                     |
| `.claude/agents/dev/vercel-deployment-expert.md` | 배포 진단 에이전트                              | 환경 변수, 캐시 설명을 담고 있어 관련 변경 시 함께 고친다                               |
| `.claude/hooks/*.sh`                             | Slack 알림 훅                                   | 두 파일의 구조(jq로 payload 생성, 표준 입력으로 curl 전송, 비밀값 가림)를 함께 유지한다 |

- import는 `src` 안에서 `@/` 별칭을 쓴다. `scripts/`는 기존처럼 `../src/...` 상대 경로를 쓴다. `tests/`는 `src`에 `@/`, `scripts`에 상대 경로를 쓴다. `.vscode/settings.json`이 자동 import를 상대 경로로 만들므로, `src` 안에서는 결과를 `@/`로 고친다.
- `src` 안의 `default export`는 Next.js 라우트 파일(`page`, `layout`, `loading`, `error`, `not-found`, `sitemap`, `robots`, `opengraph-image`)에만 쓴다.

## 3. 데이터 흐름

```
Notion 코스 DB·링크 DB  (CONTENT_SOURCE=seed이면 data/seed.json)
  → sources.ts      queryAllPages → notion-mapper.ts → schema.ts 행 단위 safeParse
                    (실패 행은 logger.warn 후 제외, 페이지 전체는 실패하지 않음)
  → service.ts      unstable_cache 240초 (키에 CONTENT_SOURCE 포함)
                    → withLastGood (실패 시 마지막 성공값, 없으면 오류 → error.tsx)
  → rules.ts        buildSiteContent: 공개 규칙, 정렬, 순서 중복 경고
  → getSiteContent  React cache로 요청당 1회
  → page.tsx · generateMetadata · sitemap.ts
```

## 4. 코드 규칙

- 형식은 `.prettierrc`를 따른다 (세미콜론 없음, 작은따옴표, `arrowParens: avoid`). Tailwind 클래스 순서는 플러그인이 정한다.
- `any`를 쓰지 않는다. 테스트에서 Notion 응답 목은 `as unknown as PageObjectResponse`로 만든다.
- 주석은 한국어 한 줄로, 코드만 봐서는 알 수 없는 이유만 쓴다. 문체는 `~한다`.
  - ✅ `// 잘못된 행 하나로 페이지 전체가 실패하지 않도록 해당 행만 제외한다`
  - ❌ `// 링크를 필터링합니다`
- 화면 문구와 오류 메시지는 한국어로 쓴다. 화면 문구는 `~습니다`, `~세요` 존댓말을 쓴다.
- 문서는 한국어로 쓰고, 고치는 문서의 기존 문체를 따른다 (`docs/PRD.md`와 이 문서는 `~한다`, `README.md`와 `docs/notion-setup.md`는 `~합니다`).
- 서버 코드의 로그는 `@/lib/logger`의 `logger`만 쓴다. `console.*`는 `src/app/error.tsx`와 `scripts/`의 CLI 출력에만 쓴다.
- `logger`는 context의 **최상위 키 이름**으로만 비밀값을 가린다. 토큰이 들어 있을 수 있는 값을 메시지나 다른 이름의 키에 넣지 않는다.
- 페이지에서 `getSiteContent()`를 try/catch로 감싸지 않는다. 캐시도 없을 때의 오류는 `src/app/error.tsx`가 처리한다. `sitemap.ts`만 실패 시 정적 경로를 반환한다.

## 5. 기능 구현 규칙

### 5.1 라우트와 렌더링

- 콘텐츠를 읽는 라우트는 `export const dynamic = 'force-dynamic'`을 선언한다 (`(home)/page.tsx`, `courses/[slug]/page.tsx`, `library/page.tsx`, `sitemap.ts`).
- `generateStaticParams`나 라우트 단위 `revalidate`를 추가하지 않는다. 빌드할 때 Notion을 읽게 된다.
- `getEnv()`와 Notion 조회는 함수 안에서 호출한다. 모듈 최상위에서 호출하면 환경 변수 없이 빌드할 수 없다.
- **`src/app/courses/[slug]/loading.tsx`를 만들지 않는다.** 스트리밍이 먼저 시작되면 없는 코스가 HTTP 404 대신 200으로 응답한다.
- `params`, `searchParams`는 `Promise` 타입으로 받아 `await`한다.
- 새 공개 라우트를 추가하면 다음을 함께 처리한다: `metadata`(title, description, `openGraph.images: '/opengraph-image'`), `sitemap.ts`, 최상위 메뉴면 `site-header.tsx`의 `NavLink`와 `nav-link.tsx`의 활성 조건(`/`는 `/courses/*`에서도 활성), `tests/e2e/site.spec.ts`의 접근성 검사 경로 목록, `README.md` 화면 표, `docs/PRD.md` 화면 구성.

```ts
// ✅
const course = findCourse(await getSiteContent(), slug)
if (!course) notFound()

// ❌ 화면에서 Notion 직접 조회, 공개 규칙 우회
const pages = await queryAllPages(process.env.NOTION_DATABASE_ID as string)
```

### 5.2 서버와 클라이언트 경계

- `'use client'` 파일에서는 `@/lib/content/library-filter`, `@/types/content`, `@/lib/utils`, `@/components/ui/*`, 다른 클라이언트 컴포넌트만 import한다.
- `'use client'` 파일에서 `@/lib/env`, `@/lib/notion`, `@/lib/content/{service,sources,notion-mapper,schema}`를 import하지 않는다.
- 비밀값에 `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 공개 변수는 `NEXT_PUBLIC_BASE_URL`뿐이며 빌드할 때 코드에 들어가므로 값을 바꾸면 재배포해야 한다.
- `next.config.ts`의 보안 헤더(`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)를 지우지 않는다. 배포 후 `vercel-deployment-expert`가 확인하는 항목이다.

### 5.3 공개 규칙 (`src/lib/content/rules.ts`)

- 공개 여부와 정렬은 `buildSiteContent`에서만 판단한다. 페이지나 컴포넌트에서 `published`, `verified`로 다시 거르지 않는다.
- 코스: `published` 코스만 보이고, 단계가 0개면 숨긴다. `order` → `slug` 순으로 정렬한다.
- 코스 단계: `published` 링크 중 `course`가 같고 `order`, `level`이 있는 링크다. 검증 여부와 상관없이 넣고 `order` → `id` 순으로 정렬한다. 순서가 겹치면 `warnings`에 남긴다.
- 자료실: `published` 링크 전체를 `id` 순으로 보여 준다. `courseRef`는 실제로 보이는 단계에만 연결한다.
- `verified`가 `true`일 때만 `<VerifiedBadge />`를 붙인다. **`미검증` 문구는 어디에도 렌더링하지 않는다.**
- 안내 문구 "외부 자료의 내용은 변경될 수 있으며, 검증 완료 표시가 없는 자료는 내용을 직접 확인하지 않았습니다."를 코스 상세와 자료실에 유지한다.

```tsx
// ✅
<div className="mt-2">{step.verified && <VerifiedBadge />}</div>

// ❌
<div className="mt-2">
  {step.verified ? <VerifiedBadge /> : <Badge>미검증</Badge>}
</div>
```

### 5.4 자료실 검색

- 필터 로직은 `library-filter.ts`의 순수 함수에 둔다. 컴포넌트 안에 직접 쓰지 않는다.
- 검색 대상은 `title`, `purpose`, `url`, `category`다. 바꾸면 `tests/unit/library-filter.test.ts`와 입력창 안내 문구 "제목, 설명, 주소로 검색"을 함께 고친다.
- URL 쿼리는 `q`, `category`, `type`이다. 허용되지 않은 값은 `ALL_OPTION`(`'all'`)으로 처리한다 (`library/page.tsx`의 `allowedOrAll`).
- 주소 동기화는 `window.history.replaceState`를 유지한다. 서버에 다시 요청하지 않고 주소만 바꾼다. `router.push`나 `router.replace`로 바꾸지 않는다.
- 300ms 지연은 검색어 입력에만 둔다. 지연 중인 주소 변경이 진행 중인 페이지 이동을 취소할 수 있다.
- 카테고리 옵션은 공개 링크에서 계산한다. 하드코딩하지 않는다.

### 5.5 외부 링크와 접근성

- 원본 링크는 `ExternalLinkButton`으로만 렌더링한다 (`target="_blank"`, `rel="noopener noreferrer"`, `aria-label="{제목} 원본 열기 (새 탭)"`).
- 터치 대상은 높이 44px 이상이다. `Button`은 기본 `h-11`이고, 링크, `SelectItem`, `DropdownMenuItem`에는 `min-h-11`을 준다. E2E가 `main a, main button, header a, header button, [role="combobox"]`의 높이를 검사한다.
- 카드 전체를 덮는 링크는 `course-card.tsx`처럼 `data-stretched-link` 속성과 `after:absolute after:inset-0`를 쓴다. E2E는 이 속성이 있는 링크만 높이 검사에서 뺀다.
- 장식 아이콘에는 `aria-hidden="true"`를 붙인다. 목록은 `<ul role="list">`, `<ol role="list">`로 쓴다.
- 제목 수준을 유지한다: 홈 코스 카드 `h3`(E2E가 수준 3으로 찾음), 자료실 카드 `h2`, 코스 단계 `h3`.
- 320px 폭에서 헤더가 한 줄(높이 64px 이하)이고 가로 스크롤이 없어야 한다.
- 본문에 `word-break: keep-all`이 전역으로 걸려 있다. 긴 URL과 영문 제목에는 `break-words`나 `truncate`를 쓴다.

```tsx
// ✅
<ExternalLinkButton url={link.url} title={link.title} />

// ❌ rel, 새 탭 안내, 44px 높이가 빠짐
<a href={link.url} target="_blank">원본</a>
```

### 5.6 스타일과 테마

- 색은 `globals.css`의 CSS 변수와 토큰 클래스(`bg-card`, `text-muted-foreground`, `text-primary` 등)만 쓴다. 컴포넌트에 hex나 `text-blue-500` 같은 기본 팔레트 색을 쓰지 않는다.
- 색을 바꾸면 `:root`와 `.dark`를 함께 고치고, E2E의 라이트·다크 axe 검사(대비 포함)를 통과시킨다.
- `src/app/opengraph-image.tsx`와 `src/app/icon.svg`는 CSS 변수를 읽지 못해 hex를 직접 쓴다 (`#0a1120` 배경, `#e8effa` 글자, `#65dbed` 강조 = 다크 테마의 background, foreground, primary). 테마 색을 바꾸면 함께 고친다.
- 기본 테마는 다크다 (`layout.tsx`의 `defaultTheme="dark"`). 폰트는 `--font-noto-sans-kr` 변수의 Noto Sans KR이다.
- 아이콘은 `lucide-react`만 쓴다 (`next.config.ts`의 `optimizePackageImports` 대상).
- 페이지 폭은 `Container`로 잡는다. 목록 화면은 기본값(`lg`), 코스 상세, 404, 오류 화면은 `size="sm"`이다.
- 홈과 자료실의 `loading.tsx`는 `CardGridSkeleton`과 `role="status"` 화면 낭독용 문구를 쓴다.

### 5.7 shadcn/ui

- 새 컴포넌트는 `npx shadcn@latest add <이름>`으로 추가한다. 이미 있는 `src/components/ui/*` 파일은 **덮어쓰지 않는다.** `button.tsx`는 터치 대상 때문에 크기를 `h-11`, `size-11`로 바꿔 두었다.
- 추가한 컴포넌트의 터치 대상이 44px보다 작으면 사용하는 곳에서 `h-11`이나 `min-h-11`을 준다.
- 쓰지 않는 ui 파일(alert, avatar, calendar, card, checkbox, dialog, form, navigation-menu, popover, progress, separator, sheet, sonner, table, tooltip)을 요청 없이 삭제하지 않는다.
- 전역 상태 라이브러리를 추가하지 않는다. 현재 상태는 `LibraryBrowser`의 `useState`와 URL 쿼리뿐이다. 필요해지면 사용자 확인 후 Zustand를 쓴다. 폼이 필요하면 React Hook Form, Zod, `ui/form.tsx`를 쓴다.

## 6. Notion과 콘텐츠 데이터

### 6.1 Notion API

- Notion 접근은 `src/lib/notion.ts`의 `getNotionClient`, `getDataSourceId`, `queryAllPages`만 쓴다. API 버전은 `2025-09-03`이고 data source 기준이다 (`dataSources.query`, `parent: { type: 'data_source_id' }`). `databases.query`를 쓰지 않는다.
- 필드 이름과 타입은 `notion-mapper.ts`의 `COURSE_PROPERTIES`, `LINK_PROPERTIES`에서만 정의한다. 다른 파일에서 `'URL'`, `'링크 ID'` 같은 문자열을 직접 쓰지 않는다 (테스트 목은 예외).
- Select 옵션 값은 `src/types/content.ts`의 `LEVELS`, `LINK_TYPES`, `ACCESS_CONDITIONS`, `LANGUAGES`와 `notion-mapper.ts`의 `VERIFIED_LABEL`, `UNVERIFIED_LABEL`이다. Notion 옵션 이름과 한 글자라도 다르면 그 행이 화면에서 빠진다.
- 카테고리는 스키마에서 자유 텍스트다. 허용 목록은 `docs/PRD.md`와 `.claude/skills/add-site/SKILL.md`에 있으므로 바꿀 때 두 문서를 함께 고친다.
- 링크 DB 행은 Notion MCP 도구로 직접 만들지 않는다. 입력 검증, 중복 주소 확인, ID 부여가 있는 `npm run notion:add-link`를 쓴다.

```ts
// ✅
page.properties[LINK_PROPERTIES.url.name]

// ❌
page.properties['URL']
```

### 6.2 필드 추가와 변경 절차

1. 사용자 확인을 받고 **Notion DB에 열을 먼저 만든다.** `*_PROPERTIES`에 있는 필드가 DB에 없으면 `notion:seed`와 `notion:add-link`가 `findSchemaProblems`에서 중단된다.
2. 새 필드는 `.nullable()`로 시작한다. 필수로 두면 값이 없는 기존 Notion 행이 모두 검증에 실패해 사이트에서 사라진다.
3. 아래 파일을 함께 고친다.

| 파일                                  | 수정 내용                                                                |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `src/types/content.ts`                | `RawLink`, `RawCourse` 필드와 옵션 상수                                  |
| `src/lib/content/schema.ts`           | `rawLinkSchema` 또는 `courseFields`                                      |
| `src/lib/content/notion-mapper.ts`    | `*_PROPERTIES`, `mapLinkPage`, `mapCoursePage`                           |
| `scripts/lib/seed-core.ts`            | `buildLinkProperties`, `buildCourseProperties`                           |
| `scripts/lib/add-link-core.ts`        | `runAddLink`의 기본값 (선택 필드는 `null`)                               |
| `data/seed.json`                      | **모든 행에 키 추가.** Zod 4는 `.nullable()` 필드도 키가 없으면 실패한다 |
| `tests/unit/fixtures.ts`              | `makeLink`, `makeCourse` 기본값                                          |
| `tests/unit/content-data.test.ts`     | `linkPage`, `coursePage` 목 속성                                         |
| 화면 컴포넌트                         | 값이 없으면 표시하지 않는다 (`LinkBadges` 방식)                          |
| `.claude/skills/add-site/SKILL.md`    | 입력 필드 표                                                             |
| `docs/PRD.md`, `docs/notion-setup.md` | DB 필드 표                                                               |

- seed의 코스에는 `published`가 없다. seed 모드(`loadFromSeed`)와 입력 스크립트(`buildCourseProperties`)가 `true`로 넣는다.

### 6.3 `data/seed.json`

- 새 자료를 추가할 때 수정하지 않는다. 새 자료는 Notion에만 넣는다 (`/add-site` 스킬).
- 사용자가 초기 데이터 변경을 명시적으로 요청했을 때만 수정하고, 다음을 함께 고친다.
  - `tests/unit/content-data.test.ts`의 `PRD의 수량과 일치한다` (현재 코스 5, 링크 62, 공개 59, 코스 배정 24)
  - `tests/e2e/site.spec.ts`의 기대값 (`전체 59개 중`, `playwright` 검색 4개와 강의 1개, `보안` 2개, `ai-code-quality` 5단계와 `검증 완료` 2개, 코스 이름 5개, 원본 URL, 비공개 링크 제목 `하네스 엔지니어링 우선론`)
  - `docs/PRD.md`의 초기 콘텐츠 수량과 초기 코스 구성 표
- 링크 ID는 `IT-` 뒤에 3자리 이상 숫자다. 삭제한 ID를 다시 쓰거나 재배열하지 않는다. 새 ID는 `nextLinkId`(가장 큰 번호 + 1)가 정하며 직접 정하지 않는다.
- `IT_link.html`, `IT_link2.html`은 초기 데이터의 원본(git 제외)이다. 수정하거나 코드에서 읽지 않는다.

### 6.4 콘텐츠 문구

`data/seed.json`과 Notion 행을 쓸 때 기존 데이터의 형식을 따른다. 모든 값은 사이트에 그대로 보인다.

| 필드                             | 형식                                          | 예                                                         |
| -------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| 링크 `title`                     | 원문 제목. 원문 언어를 유지한다               | `How the Claude Code team does code review`                |
| 링크 `purpose`                   | 70자 안팎의 명사형 구절. 마침표를 찍지 않는다 | `에이전트 작성 코드를 계층별 자동 리뷰로 검증하는 방법`    |
| 코스 `summary`                   | `~한다.`로 끝나는 한 문장                     | `설치부터 CLI, 스킬, 플러그인까지 … 기본 사용법을 익힌다.` |
| 코스 `audience`, `prerequisites` | 명사형 구절                                   | `터미널과 Git 기본 사용 경험`                              |

- ❌ `purpose`에 내부 메모를 쓰지 않는다 (`확인 필요`, `중복?`, `나중에 코스로` 등).
- ❌ 원문에서 확인하지 못한 이용 조건, 언어, 예상 시간을 채우지 않는다. 모르면 `null`로 둔다.

### 6.5 운영 스크립트

`notion:*` 명령은 **운영 중인 Notion DB에 실제로 쓰며**, 결과는 5분 안에 사이트에 반영된다.

| 명령                                          | 규칙                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run notion:add-link -- <JSON> --dry-run` | 항상 먼저 실행한다. 입력 JSON은 스크래치패드 등 **저장소 밖**에 만들고 `id`를 넣지 않는다 |
| `npm run notion:add-link -- <JSON>`           | 미리 보기 결과를 확인한 뒤 실행한다. 중복 주소 오류면 강행하지 않고 기존 ID를 알린다      |
| `npm run notion:seed -- --dry-run`            | 쓰지 않고 결과만 본다                                                                     |
| `npm run notion:seed`                         | 없는 행만 추가한다                                                                        |
| `npm run notion:seed -- --update`             | Notion에서 수정한 내용을 덮어쓴다. **사용자가 명시적으로 요청할 때만** 실행한다           |
| `npm run links:check`                         | 읽기만 한다. `manual`(403, X 링크)은 자동으로 고치지 않고 보고한다                        |

- add-link 입력 JSON은 Write 도구로 UTF-8 파일을 만든다. PowerShell 5.1의 `Set-Content`는 기본 인코딩이 ANSI라 한글이 깨진다 (BOM은 스크립트가 지운다).

- 새 스크립트는 기존 구조를 따른다: `scripts/<이름>.ts`(`loadEnvConfig` → `CONTENT_SOURCE` 확인 → core 호출 → `main().catch`에서 `process.exit(1)`), 로직은 `scripts/lib/<이름>-core.ts`에 Gateway 인터페이스로 분리하고 `tests/unit`에 테스트를 추가한다. `package.json`, `CLAUDE.md` 명령어 목록, `README.md` 명령어 표에 함께 추가한다.

## 7. 캐시와 환경 변수

- 재검증 주기는 `service.ts`의 `REVALIDATE_SECONDS = 240`이다 (PRD의 5분 내 반영). 바꾸면 `docs/PRD.md` 캐싱, `docs/notion-setup.md`의 "최대 5분", add-site 스킬의 반영 시간, vercel 에이전트의 캐시 설명을 함께 고친다.
- `unstable_cache` 키에서 `CONTENT_SOURCE`를 빼지 않는다. seed 데이터가 Notion 모드에 섞인다.
- 캐시는 재시작 후에도 남는다. 콘텐츠 데이터 형태를 바꾼 뒤 로컬에서 이전 값이 보이면 개발 서버를 끄고 `.next`를 지운 뒤 다시 확인한다.
- 환경 변수를 추가하면 `src/lib/env.ts`의 스키마와 `getEnv()` 매핑, `README.md`의 `.env` 예시, `docs/deployment-checklist.md`의 Vercel 표, `vercel-deployment-expert.md`의 필수 환경 변수, E2E에 필요하면 `playwright.config.ts`의 `webServer.env`를 함께 고친다.
- `CONTENT_SOURCE=seed`는 로컬 확인과 E2E에만 쓴다. 프로덕션에 설정하지 않는다.
- `.env`
  - 값을 읽어 출력하거나 로그, 커밋, 외부 요청에 넣지 않는다. 확인이 필요하면 키 이름과 설정 여부만 다룬다.
  - `.claude/hooks/*.sh`가 `source`로 읽으므로 bash 문법(`KEY=value`, 공백이 있는 값은 따옴표)을 유지한다.
  - `ADMIN_PASSWORD`, `SESSION_SECRET`은 이전 견적서 프로젝트에서 남은 값이다. 코드에서 다시 쓰지 않는다.

## 8. 테스트와 검증

- 단위 테스트는 `tests/unit/*.test.ts`(Vitest, node 환경)에 둔다. `vitest.config.ts`가 `tests/unit/**/*.test.ts`만 실행하므로 다른 위치의 테스트는 돌지 않는다.
- `tsconfig.json`이 `**/*.ts`를 포함하고 `eslint .`가 전체를 검사하므로 `scripts/`와 `tests/`도 타입 검사와 린트 대상이다. `describe`와 `it` 이름은 한국어로 쓰고, 데이터는 `fixtures.ts`의 `makeLink`, `makeCourse`로 만든다. Notion은 `vi.fn` Gateway 목(`satisfies SeedGateway`)으로 대신하며 실제 API를 부르지 않는다.
- 변경 대상별 테스트 파일:

| 변경 대상                                                        | 테스트 파일                         |
| ---------------------------------------------------------------- | ----------------------------------- |
| `rules.ts`                                                       | `tests/unit/rules.test.ts`          |
| `library-filter.ts`                                              | `tests/unit/library-filter.test.ts` |
| `notion-mapper.ts`, `schema.ts`, `fallback.ts`, `data/seed.json` | `tests/unit/content-data.test.ts`   |
| `scripts/lib/seed-core.ts`, `scripts/lib/link-check.ts`          | `tests/unit/scripts.test.ts`        |
| `scripts/lib/add-link-core.ts`                                   | `tests/unit/add-link.test.ts`       |
| 화면, 라우트, 접근성                                             | `tests/e2e/site.spec.ts`            |

- E2E는 `CONTENT_SOURCE=seed`로 `npm run build && npm run start -- -p 3100`을 띄우고 desktop(Desktop Chrome), mobile(Pixel 7) 두 환경에서 실행한다.
- E2E가 정확히 찾는 문구다. 바꾸면 `tests/e2e/site.spec.ts`도 고친다: 홈 제목 `Tech Knowledge Base`(`src/lib/site.ts`의 `SITE_NAME`), `본문으로 건너뛰기`, `테마 전환`, `다크`, `검색어`, `카테고리`, `전체 N개 중 M개`, `검증 완료`, `조건에 맞는 자료가 없습니다`, `조건 초기화`, `페이지를 찾을 수 없습니다`, `코스 목록으로 돌아가기`, `{코스명} 코스`, `{제목} 원본 열기 (새 탭)`, `검증 완료 표시가 없는 자료`, 페이지 제목 `{코스명} | Tech Knowledge Base`.
- 테스트를 통과시키려고 기대값만 바꾸지 않는다. 수량이나 문구가 의도적으로 바뀐 경우에만 기대값을 고친다.
- **완료 조건** (순서대로):
  1. `npm run check-all` (typecheck, lint, format:check, test)
  2. 개발 서버를 끈 뒤 `npm run test:e2e` (`.next`를 함께 쓰고 3100 포트를 쓴다)
  3. `npm run build`
- `format:check`는 `docs/guides/`, `.claude/`를 뺀 Markdown도 검사한다. 이 문서, `README.md`, `docs/*.md`를 고치면 `npx prettier --write <파일>`을 실행한다.

## 9. 함께 수정할 파일

| 변경                          | 함께 수정                                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| 공개 규칙                     | `rules.test.ts`, `site.spec.ts`, `docs/PRD.md` 공개 규칙, `docs/notion-setup.md` 공개 규칙, 이 문서 5.3절 |
| Notion 필드                   | 6.2절 표                                                                                                  |
| `data/seed.json`              | 6.3절 목록                                                                                                |
| 코스 추가, slug 변경 (Notion) | `.claude/skills/add-site/SKILL.md`의 slug 목록                                                            |
| 카테고리                      | `docs/PRD.md` 카테고리, `.claude/skills/add-site/SKILL.md` 카테고리                                       |
| 라우트                        | 5.1절 목록                                                                                                |
| npm 스크립트                  | `package.json`, `CLAUDE.md`, `README.md`                                                                  |
| 환경 변수, 캐시 주기          | 7절                                                                                                       |
| 테마 색                       | `globals.css`의 `:root`와 `.dark`, `opengraph-image.tsx`, `icon.svg`                                      |
| 배포 절차                     | `docs/deployment-checklist.md`, `.claude/agents/dev/vercel-deployment-expert.md`                          |
| 로드맵 항목 완료              | `docs/ROADMAP.md` 체크                                                                                    |

## 10. Git과 배포

- 커밋과 push는 사용자가 요청할 때만 한다. **`main` push는 곧 Production 배포다.**
- 커밋 메시지는 기존 이력 형식을 따른다: 첫 줄 `<type>: <한국어 설명>`(`feat`, `fix`, `docs`, `refactor`, `test`, `chore`), 본문은 `- ` 목록. `/git:commit` 명령을 쓰면 그 명령의 형식을 따른다.
- 브랜치를 만들 때는 `/git:branch`의 접두사(`feature/`, `fix/`, `hotfix/`, `docs/`, `chore/`)를 쓴다.
- pre-commit 훅이 lint-staged(eslint --fix, prettier)를 실행한다. `--no-verify`를 쓰지 않는다.
- 커밋하지 않는다: `.env*`, `.mcp.json`, `shrimp_data/`, `.claude/settings.local.json`, 루트의 임시 입력 파일(`*.tmp.json`).
- 배포 점검과 장애 분석은 `vercel-deployment-expert` 에이전트에 맡긴다. 이 에이전트는 진단만 하고 설정을 바꾸지 않는다.
- 취약점 경고는 `npm audit fix --force` 대신 `package.json`의 `overrides`로 하위 패키지 버전을 고정해 해결한다 (현재 postcss, nanoid, source-map-js, sharp).

## 11. AI 판단 기준

- **새 자료나 사이트 추가 요청** → `/add-site` 스킬을 쓴다. 코드와 `data/seed.json`은 고치지 않는다.
- **"코스에 넣어줘"** → `course`, `order`, `level`을 함께 넣는다. 기존 단계와 순서가 겹치면 위치를 사용자에게 확인한다.
- **사이트에 링크가 안 보임** → 코드를 고치기 전에 확인한다: ① `공개 여부` ② 필수 값과 URL 형식 ③ 코스 연결 시 `순서`, `난이도` ④ Select 옵션 철자 ⑤ 240초 캐시(만료 후 두 번째 요청부터 반영). 데이터 문제면 코드에서 예외 처리로 덮지 말고 Notion 수정을 안내한다.
- **문서끼리 다름** → 현재 구조는 실제 코드, 기능 의도는 `docs/PRD.md`가 기준이다. 둘이 다르면 고치기 전에 사용자에게 알린다. `docs/PRD.md`의 "기존 코드 정리" 절은 끝난 작업 기록이다 (`src/lib/cache.ts` 등은 이미 없다). `docs/guides/*`는 가장 낮은 기준이다.
- **PRD의 MVP 제외 기능** (진도 체크, 로그인, 관리자 화면, 자료 상세 페이지, 다국어, 링크 점검 자동 실행) → 구현 전에 사용자 확인을 받고 `docs/PRD.md`, `docs/ROADMAP.md`를 갱신한다.
- **외부 상태를 바꾸는 작업** (Notion DB 구조 변경, `notion:*` 쓰기, `--update`, push, Vercel 설정) → 사용자 확인을 받는다.
- **로드맵 갱신** → `docs/ROADMAP.md`의 현재 형식(`완료`, `남은 일`, `MVP 이후 후보`와 체크박스)을 유지한다. `/docs:update-roadmap` 명령이 가정하는 `Task XXX`, Phase 형식으로 바꾸지 않는다.
- **`.claude/agents`의 초기 구성용 에이전트** (`starter-cleaner`, `prd-generator`, `prd-validator`, `development-planner`) → 요청 없이 쓰지 않는다. 초기화가 끝난 프로젝트에서 파일을 지우거나 PRD, 로드맵을 다시 쓸 수 있다.

## 12. 금지 사항

- ❌ `any` 타입
- ❌ 빌드할 때 Notion을 읽게 만드는 코드 (`force-dynamic` 제거, `generateStaticParams`, 모듈 최상위 `getEnv()`나 조회)
- ❌ `NOTION_API_KEY`를 클라이언트로 전달하거나 비밀값에 `NEXT_PUBLIC_` 접두사 사용
- ❌ 화면에서 Notion 직접 조회, `rules.ts` 밖에서 공개 여부 판단
- ❌ `notion-mapper.ts` 밖에서 Notion 필드 이름 문자열 사용 (테스트 목 제외)
- ❌ `src/app/courses/[slug]/loading.tsx` 추가
- ❌ `미검증` 배지나 문구 표시
- ❌ `src/components/ui/*` 덮어쓰기, 44px보다 작은 터치 대상
- ❌ 컴포넌트에 hex나 기본 팔레트 색 사용 (`opengraph-image.tsx`, `icon.svg` 제외)
- ❌ 새 자료를 넣으려고 `data/seed.json` 수정, 링크 ID 재사용이나 직접 지정
- ❌ 요청 없는 `notion:seed -- --update`, push, Notion DB 구조 변경
- ❌ `.env` 값 출력이나 커밋, 저장소 안에 add-link 입력 JSON 생성
- ❌ `npm audit fix --force`, 요청 없는 메이저 버전 업그레이드, `--no-verify`
- ❌ 삭제한 관리자, 로그인, 견적서, PDF 기능의 코드 복원
- ❌ 요청 없이 `starter-cleaner` 등 초기 구성용 에이전트 실행
