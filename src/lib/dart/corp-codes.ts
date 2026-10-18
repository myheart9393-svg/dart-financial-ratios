/**
 * OpenDART 고유번호(corpCode.xml) ZIP·XML 파싱 순수 함수.
 * 네트워크·파일 I/O 없이 동작하며 scripts/sync-corp-codes.ts 에서 사용한다.
 * (server-only 를 import 하지 않으므로 Node 스크립트에서도 import 가능)
 */
import { XMLParser } from "fast-xml-parser";
import { unzipSync } from "fflate";
import { z } from "zod";

import type { CorpCode, CorpCodeRecord } from "@/types/corp";

const CORP_CODE_XML_FILENAME = "CORPCODE.xml";

/** ZIP 로컬 파일 헤더 시그니처 "PK" */
export function isZipBuffer(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export interface DartXmlError {
  readonly status: string;
  readonly message: string;
}

const xmlParser = new XMLParser({
  // corp_code "00126380" 같은 선행 0을 보존하기 위해 숫자 변환을 끈다.
  parseTagValue: false,
  trimValues: true,
  isArray: (tagName) => tagName === "list",
});

const errorXmlSchema = z.object({
  result: z.object({
    status: z.string(),
    message: z.string(),
  }),
});

/** 키 오류 등에서 ZIP 대신 내려오는 `<result><status/><message/></result>` 를 파싱한다. */
export function parseDartErrorXml(xml: string): DartXmlError | null {
  const parsed = errorXmlSchema.safeParse(xmlParser.parse(xml));
  return parsed.success ? parsed.data.result : null;
}

/** ZIP 바이너리에서 CORPCODE.xml 을 꺼내 UTF-8 문자열로 반환한다. */
export function extractCorpCodeXml(zip: Uint8Array): string {
  const files = unzipSync(zip);
  const entry = Object.entries(files).find(
    ([name]) => name.toUpperCase() === CORP_CODE_XML_FILENAME.toUpperCase(),
  );
  if (!entry) {
    throw new Error(`ZIP 안에 ${CORP_CODE_XML_FILENAME} 파일이 없습니다.`);
  }
  return new TextDecoder("utf-8").decode(entry[1]);
}

// 빈 태그(<stock_code> </stock_code>)는 trim 후 "" 로 파싱되며, 태그 자체가 없을 수도 있다.
const optionalText = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "");

const corpCodeXmlSchema = z.object({
  result: z.object({
    list: z
      .array(
        z.object({
          corp_code: z.string(),
          corp_name: z.string(),
          corp_eng_name: optionalText,
          stock_code: optionalText,
          modify_date: optionalText,
        }),
      )
      .default([]),
  }),
});

/** CORPCODE.xml 문자열을 정규화된 레코드 배열로 변환한다. 비상장사는 stockCode = null. */
export function parseCorpCodeXml(xml: string): CorpCodeRecord[] {
  const { result } = corpCodeXmlSchema.parse(xmlParser.parse(xml));
  return result.list.map((item) => ({
    corpCode: item.corp_code.trim(),
    corpName: item.corp_name.trim(),
    stockCode: item.stock_code === "" ? null : item.stock_code,
    modifyDate: item.modify_date,
  }));
}

function isListed(record: CorpCodeRecord): record is CorpCode {
  return record.stockCode !== null;
}

/** 상장사(종목코드 보유)만 남기고 corpName 기준(한국어 정렬)으로 정렬한다. */
export function filterListed(records: readonly CorpCodeRecord[]): CorpCode[] {
  return records
    .filter(isListed)
    .toSorted((a, b) => a.corpName.localeCompare(b.corpName, "ko"));
}
