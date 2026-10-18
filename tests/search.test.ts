import { describe, expect, it } from "vitest";

import { searchCompanies, searchCorpCodes } from "@/lib/dart/search";
import type { CorpCode } from "@/types/corp";

function corp(corpName: string, stockCode: string): CorpCode {
  return { corpCode: "00000000", corpName, stockCode, modifyDate: "20240101" };
}

const FIXTURE: readonly CorpCode[] = [
  corp("한국삼성", "100003"),
  corp("삼성전자우", "005935"),
  corp("삼성", "100001"),
  corp("삼성전자", "005930"),
  corp("Samsung Bio", "207940"),
  corp("005930홀딩스", "100002"),
];

describe("searchCorpCodes", () => {
  it("완전일치 > 접두 일치 > 부분 포함 순, 같은 순위는 이름순", () => {
    expect(searchCorpCodes(FIXTURE, "삼성", 10).map((c) => c.corpName)).toEqual([
      "삼성",
      "삼성전자",
      "삼성전자우",
      "한국삼성",
    ]);
  });

  it("6자리 숫자는 종목코드 정확 일치를 최우선으로 한다", () => {
    expect(searchCorpCodes(FIXTURE, "005930", 10).map((c) => c.corpName)).toEqual([
      "삼성전자",
      "005930홀딩스",
    ]);
  });

  it("앞뒤 공백을 무시하고 대소문자를 구분하지 않는다", () => {
    expect(searchCorpCodes(FIXTURE, "  samsung ", 10).map((c) => c.corpName)).toEqual([
      "Samsung Bio",
    ]);
  });

  it("limit 만큼만 반환한다", () => {
    expect(searchCorpCodes(FIXTURE, "삼성", 2)).toHaveLength(2);
    expect(searchCorpCodes(FIXTURE, "삼성", 0)).toEqual([]);
  });
});

describe("searchCompanies (동기화된 상장사 데이터)", () => {
  it("005930 → 삼성전자", () => {
    const [first] = searchCompanies("005930");
    expect(first).toMatchObject({ corpName: "삼성전자", stockCode: "005930", corpCode: "00126380" });
  });

  it("'삼성전자' 는 완전일치가 첫 번째", () => {
    expect(searchCompanies("삼성전자")[0]?.stockCode).toBe("005930");
  });

  it("'삼성' 은 여러 건을 반환하고 limit(기본 20)을 넘지 않는다", () => {
    const results = searchCompanies("삼성");
    expect(results.length).toBeGreaterThan(1);
    expect(results.length).toBeLessThanOrEqual(20);
    expect(results.every((c) => c.corpName.includes("삼성"))).toBe(true);
  });

  it("존재하지 않는 쿼리는 빈 배열", () => {
    expect(searchCompanies("존재하지않는회사명xyz")).toEqual([]);
  });

  it("빈 문자열·공백은 빈 배열", () => {
    expect(searchCompanies("")).toEqual([]);
    expect(searchCompanies("   ")).toEqual([]);
  });
});
