import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { errorResponse, toErrorResponse } from "@/lib/api/errors";
import { DartApiError, DartConfigError, DartHttpError } from "@/lib/dart/errors";

describe("errorResponse", () => {
  it("{ error: { code, message } } 형식과 상태 코드를 반환한다", async () => {
    const res = errorResponse("INVALID_QUERY", "잘못된 요청", 400);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: { code: "INVALID_QUERY", message: "잘못된 요청" } });
  });
});

describe("toErrorResponse", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);

  it.each([
    [new DartApiError("020", "요청 제한 초과"), 502, "DART_API_ERROR"],
    [new DartHttpError(500, "HTTP 500"), 502, "DART_HTTP_ERROR"],
    [new DartConfigError("키 없음"), 500, "SERVER_CONFIG_ERROR"],
    [new Error("boom"), 500, "INTERNAL_ERROR"],
  ])("%s → %i %s", async (error, status, code) => {
    const res = toErrorResponse(error);
    expect(res.status).toBe(status);
    expect((await res.json()).error.code).toBe(code);
  });

  it("ZodError → 400 INVALID_QUERY", async () => {
    const result = z.object({ q: z.string() }).safeParse({});
    if (result.success) throw new Error("unreachable");
    const res = toErrorResponse(result.error);
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_QUERY");
  });

  it("설정 오류 메시지는 클라이언트에 노출하지 않는다", async () => {
    const res = toErrorResponse(new DartConfigError("DART_API_KEY 환경 변수가 설정되지 않았습니다."));
    expect((await res.json()).error.message).not.toContain("DART_API_KEY");
  });
});
