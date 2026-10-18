/**
 * OpenDART API 클라이언트 (서버 전용).
 * - client.ts : fetch 래퍼 (crtfc_key 자동 첨부, status 검사, Zod 검증)
 * - errors.ts : DART 관련 에러 타입
 * 엔드포인트별 함수(기업 검색, 재무제표 조회 등)는 이 폴더에 추가한다.
 */
export { DART_BASE_URL, buildDartUrl, dartFetch } from "./client";
export type { DartFetchOptions, DartQuery, DartQueryValue } from "./client";
export { DartApiError, DartConfigError, DartHttpError } from "./errors";
