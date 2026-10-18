import "server-only";

import { z } from "zod";

import { DartApiError, DartConfigError, DartHttpError } from "./errors";

export const DART_BASE_URL = "https://opendart.fss.or.kr/api";

/** 정상 응답 상태 코드 */
const DART_STATUS_OK = "000";

export type DartQueryValue = string | number | undefined;
export type DartQuery = Readonly<Record<string, DartQueryValue>>;

export interface DartFetchOptions {
  /** 테스트 등에서 키를 주입할 때 사용. 생략 시 `process.env.DART_API_KEY`. */
  readonly apiKey?: string;
  /** 테스트용 fetch 주입. 생략 시 전역 fetch(Next.js 확장 fetch). */
  readonly fetchImpl?: typeof fetch;
  /** Next.js 캐시 옵션(`next: { revalidate }`) 등 추가 RequestInit. */
  readonly init?: RequestInit;
}

/** 모든 OpenDART JSON 응답이 공통으로 갖는 필드 */
const dartEnvelopeSchema = z.looseObject({
  status: z.string(),
  message: z.string(),
});

function resolveApiKey(apiKey: string | undefined): string {
  const key = apiKey ?? process.env.DART_API_KEY;
  if (!key) {
    throw new DartConfigError("DART_API_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return key;
}

export function buildDartUrl(endpoint: string, query: DartQuery, apiKey: string): URL {
  const url = new URL(`${DART_BASE_URL}/${endpoint.replace(/^\/+/, "")}`);
  url.searchParams.set("crtfc_key", apiKey);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) {
      url.searchParams.set(name, String(value));
    }
  }
  return url;
}

/**
 * OpenDART JSON 엔드포인트 호출 래퍼.
 * - 모든 요청에 `crtfc_key`를 자동 첨부한다.
 * - `status`가 "000"이 아니면 `DartApiError`를 throw 한다.
 * - 정상 응답은 전달된 Zod 스키마로 검증한 뒤 반환한다.
 */
export async function dartFetch<TSchema extends z.ZodType>(
  endpoint: string,
  query: DartQuery,
  schema: TSchema,
  options: DartFetchOptions = {},
): Promise<z.infer<TSchema>> {
  const apiKey = resolveApiKey(options.apiKey);
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = buildDartUrl(endpoint, query, apiKey);

  const response = await fetchImpl(url, {
    ...options.init,
    method: "GET",
    headers: { Accept: "application/json", ...options.init?.headers },
  });

  if (!response.ok) {
    throw new DartHttpError(
      response.status,
      `OpenDART HTTP 오류: ${response.status} ${response.statusText}`,
    );
  }

  const body: unknown = await response.json();

  const envelope = dartEnvelopeSchema.safeParse(body);
  if (!envelope.success) {
    throw new DartHttpError(response.status, "OpenDART 응답 형식이 올바르지 않습니다.");
  }
  if (envelope.data.status !== DART_STATUS_OK) {
    throw new DartApiError(envelope.data.status, envelope.data.message);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new DartHttpError(
      response.status,
      `OpenDART 응답 스키마 불일치: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}
