/** OpenDART corpCode.xml 의 한 항목을 정규화한 값. 비상장사는 stockCode 가 null. */
export interface CorpCodeRecord {
  /** DART 고유번호 (8자리) */
  readonly corpCode: string;
  readonly corpName: string;
  /** 종목코드 (6자리), 비상장사는 null */
  readonly stockCode: string | null;
  /** 최종변경일자 (YYYYMMDD) */
  readonly modifyDate: string;
}

/** 상장사 기업코드. stockCode 가 항상 존재한다. */
export interface CorpCode extends CorpCodeRecord {
  readonly stockCode: string;
}

/** src/data/corp-codes.json 파일 형식 */
export interface CorpCodeFile {
  readonly syncedAt: string;
  readonly count: number;
  readonly items: readonly CorpCode[];
}
