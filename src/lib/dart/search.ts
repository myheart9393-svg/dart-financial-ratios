/**
 * 상장사 기업코드 검색 (순수 함수).
 * 데이터 원본은 `pnpm sync:corp` 로 생성한 src/data/corp-codes.json.
 */
import corpCodeData from "@/data/corp-codes.json";
import type { CorpCode, CorpCodeFile } from "@/types/corp";

const corpCodeFile: CorpCodeFile = corpCodeData;

const STOCK_CODE_PATTERN = /^\d{6}$/;

/** 낮을수록 우선. 종목코드 일치 > 이름 완전일치 > 접두 일치 > 부분 포함 */
const MatchRank = {
  StockCode: 0,
  ExactName: 1,
  PrefixName: 2,
  PartialName: 3,
} as const;

type MatchRank = (typeof MatchRank)[keyof typeof MatchRank];

function rankOf(item: CorpCode, normalizedQuery: string, isStockCodeQuery: boolean): MatchRank | null {
  if (isStockCodeQuery && item.stockCode === normalizedQuery) {
    return MatchRank.StockCode;
  }
  const name = item.corpName.toLowerCase();
  if (name === normalizedQuery) return MatchRank.ExactName;
  if (name.startsWith(normalizedQuery)) return MatchRank.PrefixName;
  if (name.includes(normalizedQuery)) return MatchRank.PartialName;
  return null;
}

/** 주어진 목록에서 검색한다. 테스트·재사용을 위해 데이터를 인자로 받는다. */
export function searchCorpCodes(
  items: readonly CorpCode[],
  query: string,
  limit: number,
): CorpCode[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === "" || limit <= 0) {
    return [];
  }
  const isStockCodeQuery = STOCK_CODE_PATTERN.test(normalizedQuery);

  return items
    .flatMap((item) => {
      const rank = rankOf(item, normalizedQuery, isStockCodeQuery);
      return rank === null ? [] : [{ item, rank }];
    })
    .toSorted((a, b) => a.rank - b.rank || a.item.corpName.localeCompare(b.item.corpName, "ko"))
    .slice(0, limit)
    .map(({ item }) => item);
}

/** 동기화된 상장사 목록에서 회사명 또는 6자리 종목코드로 검색한다. */
export function searchCompanies(query: string, limit = 20): CorpCode[] {
  return searchCorpCodes(corpCodeFile.items, query, limit);
}
