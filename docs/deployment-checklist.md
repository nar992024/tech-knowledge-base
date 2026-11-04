# 배포 체크리스트

## 배포 전

- [ ] 공개할 코스의 단계와 `검증 완료` 표시가 맞는지 Notion에서 확인
- [ ] `npm run check-all` 통과
- [ ] `npm run test:e2e` 통과
- [ ] `npm run links:check` 실행 후 끊어진 링크 정리, 직접 확인 대상 링크 확인
- [ ] `CONTENT_SOURCE`를 지정하지 않고 Notion 연결 상태로 `npm run build`와 `npm run start` 확인
- [ ] Notion에서 수정한 내용이 5분 안에 반영되는지 확인
- [ ] `npm audit --omit=dev` 결과 확인

## Vercel 환경 변수

| 변수                        | 값                      |
| --------------------------- | ----------------------- |
| `NOTION_API_KEY`            | Integration 토큰        |
| `NOTION_DATABASE_ID`        | 링크 DB ID              |
| `NOTION_COURSE_DATABASE_ID` | 코스 DB ID              |
| `NEXT_PUBLIC_BASE_URL`      | 배포 주소 (`https://…`) |

`CONTENT_SOURCE`는 프로덕션에 설정하지 않습니다. `seed`로 설정하면 Notion을 읽지 않으며, 파일 위치에 따라 조회가 실패할 수 있습니다.

## 배포 후

- [ ] `/`, `/library`, 코스 상세 화면 확인
- [ ] 없는 코스 주소가 HTTP 404로 응답하는지 확인
- [ ] `/sitemap.xml`, `/robots.txt`, 공유 미리보기 이미지 확인
- [ ] 모바일과 다크 모드 확인
