# CLAUDE.md

## 프로젝트 목적

OpenDART API로 특정 기업의 최근 5개년 재무제표를 가져와 재무비율(수익성·안정성·성장성·활동성)을 계산하고 시각화하는 웹앱.
취업 포트폴리오용이므로 기능보다 **코드 품질, 구조, 테스트**를 우선한다.

## 스택

- Next.js 15 (App Router) + React 19
- TypeScript (`strict: true`)
- Tailwind CSS v4
- Recharts (차트), Zod (외부 데이터 검증)
- Vitest (테스트)
- pnpm (패키지 매니저 — npm/yarn 사용 금지)

## 명령어

```bash
pnpm dev        # 개발 서버
pnpm build      # 프로덕션 빌드
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm test       # Vitest
```

작업 완료 전 `pnpm lint && pnpm typecheck && pnpm test && pnpm build`가 모두 통과해야 한다.

## 디렉토리 규칙

| 경로 | 역할 | 의존 가능 대상 |
| --- | --- | --- |
| `src/app` | 라우트, 페이지, Route Handler (`app/api/**/route.ts`) | 모든 `src/*` |
| `src/lib/api` | Route Handler 공통 유틸 (에러 응답 형식, 예외 → HTTP 상태 매핑) | `src/lib/dart`, `src/types` |
| `src/lib/dart` | OpenDART API 클라이언트 (fetch 래퍼, 응답 타입/스키마, 에러), 기업코드 파싱·검색 — **서버 전용** | `src/data`, `src/types` |
| `src/lib/ratios` | 재무비율 계산 순수 함수 — **프레임워크 비의존** | `src/types` |
| `src/components` | UI 컴포넌트 (표시 전용) | `src/types`, `src/lib/ratios` |
| `src/data` | 커밋되는 정적 데이터 (`corp-codes.json` 등, 스크립트로 생성 — 직접 수정 금지) | 없음 |
| `src/types` | 여러 레이어가 공유하는 공용 타입 | 없음 |
| `scripts` | 개발용 Node 스크립트 (`pnpm sync:corp` 등, tsx 실행). 다운로드·파일 I/O만 담당하고 로직은 `src/lib`의 순수 함수에 둔다 | `src/lib`, `src/types` |
| `tests` | Vitest 테스트 (`*.test.ts`) | 모든 `src/*` |

- `src/lib/ratios`는 React, Next.js, fetch, `process.env` 등을 import 하지 않는다.
- `src/components`는 `src/lib/dart`를 import 하지 않는다. 데이터는 Route Handler를 거쳐 받는다.
- 경로 별칭 `@/*` → `src/*` 를 사용한다.
- `scripts/`에서 import 하는 `src/lib` 모듈은 `server-only`를 import 하면 안 된다(Node에서 throw). `@/lib/dart` 배럴 대신 개별 파일을 import 한다.

## 코딩 규칙

- **함수형 스타일**: 클래스는 에러 타입에만 사용한다. 순수 함수와 불변 데이터(`readonly`, 스프레드)를 선호한다.
- **명시적 타입**: export 되는 함수는 매개변수와 반환 타입을 명시한다. `any` 금지(`unknown` + Zod로 좁힌다).
- **외부 데이터는 Zod로 검증**: DART 응답, 요청 쿼리 파라미터 등 경계에서 들어오는 값은 반드시 스키마로 파싱한다.
- **API 키는 서버 전용**:
  - `DART_API_KEY`는 `src/lib/dart`(`import "server-only"`)와 Route Handler에서만 읽는다.
  - `NEXT_PUBLIC_` 접두사를 절대 붙이지 않는다.
  - 클라이언트 컴포넌트에서 `@/lib/dart`를 import 하지 않는다.
  - 에러 메시지·로그에 키나 키가 포함된 URL을 남기지 않는다.
- **비율 계산은 순수 함수 + 테스트 필수**:
  - `src/lib/ratios`의 모든 함수는 같은 입력에 같은 출력을 내고 부수효과가 없다.
  - 분모가 0이거나 값이 없으면 `NaN`/`Infinity` 대신 `null`을 반환한다.
  - 새 함수를 추가하면 `tests/`에 정상·경계(0, 음수, 누락) 케이스 테스트를 함께 작성한다.
- DART 금액 필드는 쉼표가 포함된 문자열로 오므로 파싱 로직을 한 곳에 모은다.
- 불필요한 UI 라이브러리(shadcn 등)는 추가하지 않는다. Tailwind로 작성한다.

## 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/) 형식을 따른다. 제목은 50자 이내, 본문은 한국어 허용.

```
<type>(<scope>): <제목>

<본문: 무엇을, 왜 바꿨는지>
```

- type: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`, `ci`, `build`
- scope 예: `dart`, `ratios`, `ui`, `api`
- 커밋은 의미 단위로 나눈다. 기능 코드와 무관한 설정 변경을 한 커밋에 섞지 않는다.
- 예: `feat(ratios): ROE·ROA 계산 함수 추가`
