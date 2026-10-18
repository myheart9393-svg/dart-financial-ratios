# DART 5개년 재무비율 조회

OpenDART API로 기업의 최근 5개년 재무제표를 조회하고 재무비율을 계산·시각화하는 웹앱입니다.

## 스택

Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Recharts · Zod · Vitest · pnpm

## 시작하기

```bash
pnpm install
cp .env.example .env.local   # DART_API_KEY 입력
pnpm dev
```

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | 타입 검사 |
| `pnpm test` | Vitest 실행 |
| `pnpm sync:corp` | OpenDART 기업코드 동기화 → `src/data/corp-codes.json` |

## 기업코드 동기화

OpenDART의 재무제표 API는 종목코드가 아니라 8자리 **고유번호(`corp_code`)** 로 기업을 식별합니다.
회사명·종목코드로 검색하려면 고유번호 목록이 필요하므로, OpenDART 공시정보 > 고유번호 API(`corpCode.xml`)의 결과를 `src/data/corp-codes.json`으로 저장해 커밋합니다.

- **상장사만 커밋하는 이유**: 전체 목록은 약 12만 건(대부분 비상장·외부감사 대상 법인)으로 JSON이 수십 MB에 이릅니다. 재무비율 비교 대상은 종목코드가 있는 상장사(약 4천 건, 약 400 KB)이므로, 저장소 크기와 서버 번들 크기를 줄이기 위해 `stock_code`가 있는 항목만 남깁니다.
- **갱신 방법**: `.env.local`에 `DART_API_KEY`를 설정한 뒤 실행하고, 변경된 JSON을 커밋합니다. 신규 상장·상호 변경을 반영하려면 주기적으로 실행하세요.

  ```bash
  pnpm sync:corp
  ```

- **데이터 출처**: 금융감독원 전자공시시스템 [OpenDART](https://opendart.fss.or.kr). 파일의 `syncedAt`이 마지막 동기화 시각입니다.
- 검색 API: `GET /api/companies?q=삼성전자&limit=20` → `{ items, count }`

개발 규칙은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
