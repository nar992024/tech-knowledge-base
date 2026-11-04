# Tech Knowledge Base

Notion을 CMS로 활용한 공개 IT 기술 학습 사이트입니다. 자료를 순서가 있는 코스로 안내하고, 나머지 자료는 자료실에서 검색과 필터로 찾을 수 있습니다.

- **요구사항**: [docs/PRD.md](docs/PRD.md)
- **Notion 설정과 콘텐츠 운영**: [docs/notion-setup.md](docs/notion-setup.md)
- **배포**: [docs/deployment-checklist.md](docs/deployment-checklist.md)
- **진행 상황**: [docs/ROADMAP.md](docs/ROADMAP.md)

## 화면

| 주소              | 내용                                     |
| ----------------- | ---------------------------------------- |
| `/`               | 코스 목록                                |
| `/courses/[slug]` | 코스 소개와 단계별 학습 경로             |
| `/library`        | 공개 자료 전체의 키워드 검색과 조건 필터 |

## 기술 스택

Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide React, Zod, Notion API

## 시작하기

```bash
npm install
```

프로젝트 루트의 `.env`에 환경 변수를 설정합니다.

```env
NOTION_API_KEY=ntn_xxx
NOTION_DATABASE_ID=링크_DB_ID
NOTION_COURSE_DATABASE_ID=코스_DB_ID
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

```bash
npm run dev
```

Notion을 연결하기 전에 화면만 확인하려면 `.env`에 `CONTENT_SOURCE=seed`를 추가합니다. `data/seed.json`을 읽으며, 이 모드에서는 Notion 환경 변수가 필요 없습니다.

## 명령어

| 명령어                | 설명                                    |
| --------------------- | --------------------------------------- |
| `npm run dev`         | 개발 서버 실행                          |
| `npm run build`       | 프로덕션 빌드                           |
| `npm run check-all`   | 타입 검사, 린트, 포맷 검사, 단위 테스트 |
| `npm run test`        | 단위 테스트                             |
| `npm run test:e2e`    | 프로덕션 빌드 기반 E2E와 접근성 테스트  |
| `npm run notion:seed` | `data/seed.json`을 Notion에 입력        |
| `npm run links:check` | 공개 링크의 응답 점검                   |

## 구조

```
src/
├── app/                 # 페이지, 메타데이터, sitemap, robots
├── components/          # course, library, link, layout, ui
├── lib/
│   ├── content/         # 조회, 검증, 공개 규칙, 캐싱, 자료실 필터
│   ├── env.ts           # 환경 변수 검증
│   └── notion.ts        # Notion 클라이언트
└── types/content.ts     # 콘텐츠 타입
scripts/                 # Notion 초기 입력, 링크 점검
data/seed.json           # 초기 콘텐츠
tests/                   # 단위 테스트, E2E 테스트
```
