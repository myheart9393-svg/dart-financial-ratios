/**
 * Route Handler 공통 에러 응답.
 * 형식: { error: { code, message } }
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { DartApiError, DartConfigError, DartHttpError } from "@/lib/dart/errors";

export type ApiErrorCode =
  | "INVALID_QUERY"
  | "DART_API_ERROR"
  | "DART_HTTP_ERROR"
  | "SERVER_CONFIG_ERROR"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  readonly error: {
    readonly code: ApiErrorCode;
    readonly message: string;
  };
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

/** 이슈별 메시지를 이어 붙인다. 스키마의 메시지에 필드명을 포함시키는 것을 전제로 한다. */
function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join("; ");
}

/**
 * 예외를 HTTP 에러 응답으로 매핑한다.
 * - ZodError → 400, DartApiError/DartHttpError → 502, DartConfigError → 500, 그 외 → 500
 * 서버 설정·내부 오류는 상세 메시지를 클라이언트에 노출하지 않는다.
 */
export function toErrorResponse(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return errorResponse("INVALID_QUERY", formatZodError(error), 400);
  }
  if (error instanceof DartApiError) {
    return errorResponse("DART_API_ERROR", error.message, 502);
  }
  if (error instanceof DartHttpError) {
    return errorResponse("DART_HTTP_ERROR", "OpenDART 서버 응답을 처리하지 못했습니다.", 502);
  }
  if (error instanceof DartConfigError) {
    console.error(error);
    return errorResponse("SERVER_CONFIG_ERROR", "서버 설정 오류입니다.", 500);
  }
  console.error(error);
  return errorResponse("INTERNAL_ERROR", "알 수 없는 서버 오류입니다.", 500);
}
