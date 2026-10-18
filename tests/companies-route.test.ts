import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/companies/route";

function get(search: string): Response {
  return GET(new NextRequest(`http://localhost/api/companies${search}`));
}

describe("GET /api/companies", () => {
  it("성공 시 200, items/count 와 Cache-Control 헤더를 반환한다", async () => {
    const res = get(`?q=${encodeURIComponent("삼성전자")}`);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    const body = await res.json();
    expect(body.count).toBe(body.items.length);
    expect(body.items[0].stockCode).toBe("005930");
  });

  it("limit 을 적용한다", async () => {
    const body = await get(`?q=${encodeURIComponent("삼성")}&limit=3`).json();
    expect(body.count).toBe(3);
  });

  it.each(["", "?q=", "?q=%20%20", `?q=${"a".repeat(51)}`, "?q=a&limit=0", "?q=a&limit=51", "?q=a&limit=abc"])(
    "잘못된 쿼리(%s)는 400 INVALID_QUERY",
    async (search) => {
      const res = get(search);
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("INVALID_QUERY");
    },
  );
});
