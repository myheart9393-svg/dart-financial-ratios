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

개발 규칙은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.
