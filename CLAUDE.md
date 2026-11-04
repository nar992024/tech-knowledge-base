# 🤖 Claude Code 개발 지침

**Tech Knowledge Base** - Notion을 CMS로 활용해 검증한 기술 자료를 학습 코스로 안내하고, 자료실에서 검색할 수 있는 공개 사이트

📋 상세 프로젝트 요구사항은 @/docs/PRD.md 참조

## 🛠️ 핵심 기술 스택

- **Framework**: Next.js 15.5.28 (App Router + Turbopack)
- **Runtime**: React 19.1.10 + TypeScript 5
- **Styling**: TailwindCSS v4 + shadcn/ui (new-york style)
- **Data Validation**: Zod
- **UI Components**: Radix UI + Lucide Icons
- **External API**: @notionhq/client (Notion API SDK)
- **Development**: ESLint + Prettier + Husky + lint-staged

## 📚 개발 가이드

- **📋 프로젝트 요구사항 (PRD)**: `@/docs/PRD.md` - 사이트 상세 명세
- **🗂️ Notion 설정과 콘텐츠 운영**: `@/docs/notion-setup.md`
- **📁 프로젝트 구조**: `@/docs/guides/project-structure.md`
- **🎨 스타일링 가이드**: `@/docs/guides/styling-guide.md`
- **🧩 컴포넌트 패턴**: `@/docs/guides/component-patterns.md`
- **⚡ Next.js 15.5.3 전문 가이드**: `@/docs/guides/nextjs-15.md`
- **📝 폼 처리 완전 가이드**: `@/docs/guides/forms-react-hook-form.md`

## ⚡ 자주 사용하는 명령어

```bash
# 개발
npm run dev         # 개발 서버 실행 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # 타입, 린트, 포맷, 단위 테스트 통합 실행 (권장)
npm run test:e2e    # 프로덕션 빌드 기반 E2E, 접근성 테스트
npm run notion:seed # data/seed.json을 Notion에 입력
npm run notion:add-link -- <JSON 파일> [--dry-run] # 새 링크를 Notion에 추가 (/add-site 스킬에서 사용)
npm run links:check # 공개 링크 응답 점검

# UI 컴포넌트
npx shadcn@latest add button    # 새 컴포넌트 추가
```

## ✅ 작업 완료 체크리스트

```bash
npm run check-all   # 모든 검사 통과 확인
npm run test:e2e    # E2E, 접근성 테스트 통과 확인 (개발 서버를 끈 뒤 실행)
npm run build       # 빌드 성공 확인
```

💡 **상세 규칙은 위 개발 가이드 문서들을 참조하세요**
