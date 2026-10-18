import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { toErrorResponse } from "@/lib/api/errors";
import { searchCompanies } from "@/lib/dart/search";
import type { CorpCode } from "@/types/corp";

const querySchema = z.object({
  q: z
    .string({ error: "q 파라미터가 필요합니다." })
    .trim()
    .min(1, "q 는 1자 이상이어야 합니다.")
    .max(50, "q 는 50자 이하여야 합니다."),
  limit: z.coerce
    .number({ error: "limit 은 숫자여야 합니다." })
    .int("limit 은 정수여야 합니다.")
    .min(1, "limit 은 1 이상이어야 합니다.")
    .max(50, "limit 은 50 이하여야 합니다.")
    .default(20),
});

export interface CompaniesResponse {
  readonly items: readonly CorpCode[];
  readonly count: number;
}

/** GET /api/companies?q=삼성&limit=20 — 상장사 회사명·종목코드 검색 */
export function GET(request: NextRequest): NextResponse {
  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    q: params.get("q") ?? undefined,
    limit: params.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return toErrorResponse(parsed.error);
  }

  const items = searchCompanies(parsed.data.q, parsed.data.limit);
  const body: CompaniesResponse = { items, count: items.length };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
