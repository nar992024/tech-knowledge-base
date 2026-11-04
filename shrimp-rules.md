# 프로젝트 개발 규칙

## 프로젝트 개요

Notion을 CMS로 활용한 공개 IT 기술 학습 사이트입니다. 요구사항은 `docs/PRD.md`를 따릅니다.

## 구조 규칙

- 페이지는 `src/app`, 화면 컴포넌트는 `src/components/{course,library,link,layout}`에 둡니다.
- 콘텐츠 조회, 검증, 공개 규칙은 `src/lib/content`에 둡니다. 화면에서 Notion API를 직접 호출하지 않습니다.
- Notion 필드 이름은 `src/lib/content/notion-mapper.ts`에서만 정의합니다.

## 콘텐츠 규칙

- 공개 규칙은 `src/lib/content/rules.ts`에서만 판단합니다.
- 코스 단계에는 공개 링크를 모두 표시하고, `검증 완료` 링크에만 배지를 붙입니다.
- Notion 필드를 바꾸면 매퍼, Zod 스키마, 입력 스크립트, `docs/notion-setup.md`를 함께 고칩니다.

## 금지 사항

- `any` 타입 사용
- 빌드 시점에 Notion을 조회하는 정적 페이지 추가
- `NOTION_API_KEY`를 클라이언트 코드로 전달

## 완료 조건

`npm run check-all`, `npm run test:e2e`, `npm run build`를 통과해야 합니다.
