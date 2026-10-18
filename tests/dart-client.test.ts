import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  DartApiError,
  DartConfigError,
  DartHttpError,
  buildDartUrl,
  dartFetch,
} from "@/lib/dart";

const schema = z.object({
  status: z.string(),
  message: z.string(),
  list: z.array(z.string()),
});

function jsonResponse(body: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(body), init);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildDartUrl", () => {
  it("crtfc_key를 첨부하고 undefined 파라미터는 제외한다", () => {
    const url = buildDartUrl(
      "/company.json",
      { corp_code: "00126380", bsns_year: 2024, reprt_code: undefined },
      "KEY",
    );
    expect(url.origin + url.pathname).toBe("https://opendart.fss.or.kr/api/company.json");
    expect(url.searchParams.get("crtfc_key")).toBe("KEY");
    expect(url.searchParams.get("corp_code")).toBe("00126380");
    expect(url.searchParams.get("bsns_year")).toBe("2024");
    expect(url.searchParams.has("reprt_code")).toBe(false);
  });
});

describe("dartFetch", () => {
  it("status가 000이면 스키마로 검증된 데이터를 반환한다", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ status: "000", message: "정상", list: ["a"] }));

    const result = await dartFetch("test.json", {}, schema, { apiKey: "KEY", fetchImpl });

    expect(result.list).toEqual(["a"]);
    const calledUrl = fetchImpl.mock.calls[0]?.[0] as URL;
    expect(calledUrl.searchParams.get("crtfc_key")).toBe("KEY");
  });

  it("status가 000이 아니면 DartApiError를 throw 한다", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ status: "013", message: "조회된 데이타가 없습니다." }));

    const promise = dartFetch("test.json", {}, schema, { apiKey: "KEY", fetchImpl });

    await expect(promise).rejects.toBeInstanceOf(DartApiError);
    await expect(promise).rejects.toMatchObject({ status: "013" });
  });

  it("HTTP 오류면 DartHttpError를 throw 한다", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, { status: 500 }));

    await expect(
      dartFetch("test.json", {}, schema, { apiKey: "KEY", fetchImpl }),
    ).rejects.toBeInstanceOf(DartHttpError);
  });

  it("API 키가 없으면 요청 없이 DartConfigError를 throw 한다", async () => {
    vi.stubEnv("DART_API_KEY", "");
    const fetchImpl = vi.fn<typeof fetch>();

    await expect(dartFetch("test.json", {}, schema, { fetchImpl })).rejects.toBeInstanceOf(
      DartConfigError,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
