import { zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import {
  extractCorpCodeXml,
  filterListed,
  isZipBuffer,
  parseCorpCodeXml,
  parseDartErrorXml,
} from "@/lib/dart/corp-codes";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<result>
  <list>
    <corp_code>00126380</corp_code>
    <corp_name>삼성전자</corp_name>
    <corp_eng_name>SAMSUNG ELECTRONICS CO,.LTD</corp_eng_name>
    <stock_code>005930</stock_code>
    <modify_date>20240625</modify_date>
  </list>
  <list>
    <corp_code>00434003</corp_code>
    <corp_name>다코</corp_name>
    <corp_eng_name>Daco corporation</corp_eng_name>
    <stock_code> </stock_code>
    <modify_date>20170630</modify_date>
  </list>
  <list>
    <corp_code>00164779</corp_code>
    <corp_name>SK하이닉스</corp_name>
    <corp_eng_name>SK hynix Inc.</corp_eng_name>
    <stock_code>000660</stock_code>
    <modify_date>20240315</modify_date>
  </list>
  <list>
    <corp_code>00164742</corp_code>
    <corp_name>가나다상사</corp_name>
    <corp_eng_name></corp_eng_name>
    <stock_code></stock_code>
    <modify_date>20200101</modify_date>
  </list>
</result>`;

describe("isZipBuffer", () => {
  it("PK 시그니처로 ZIP 여부를 판별한다", () => {
    expect(isZipBuffer(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
    expect(isZipBuffer(new TextEncoder().encode("<result>"))).toBe(false);
    expect(isZipBuffer(new Uint8Array([]))).toBe(false);
  });
});

describe("parseDartErrorXml", () => {
  it("에러 XML 에서 status/message 를 꺼낸다", () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><result><status>010</status><message>등록되지 않은 키입니다.</message></result>';
    expect(parseDartErrorXml(xml)).toEqual({ status: "010", message: "등록되지 않은 키입니다." });
  });

  it("에러 형식이 아니면 null 을 반환한다", () => {
    expect(parseDartErrorXml(SAMPLE_XML)).toBeNull();
  });
});

describe("extractCorpCodeXml", () => {
  it("ZIP 안의 CORPCODE.xml 을 UTF-8 로 디코딩한다", () => {
    const zip = zipSync({ "CORPCODE.xml": new TextEncoder().encode(SAMPLE_XML) });
    expect(extractCorpCodeXml(zip)).toBe(SAMPLE_XML);
  });

  it("CORPCODE.xml 이 없으면 throw 한다", () => {
    const zip = zipSync({ "OTHER.xml": new Uint8Array([1]) });
    expect(() => extractCorpCodeXml(zip)).toThrow("CORPCODE.xml");
  });
});

describe("parseCorpCodeXml", () => {
  const records = parseCorpCodeXml(SAMPLE_XML);

  it("모든 항목을 정규화하고 corp_code 선행 0을 보존한다", () => {
    expect(records).toHaveLength(4);
    expect(records[0]).toEqual({
      corpCode: "00126380",
      corpName: "삼성전자",
      stockCode: "005930",
      modifyDate: "20240625",
    });
    expect(records[2]?.stockCode).toBe("000660");
  });

  it("공백(' ') 또는 빈 stock_code 는 null 로 변환한다", () => {
    expect(records[1]?.stockCode).toBeNull();
    expect(records[3]?.stockCode).toBeNull();
  });

  it("list 가 하나뿐이어도 배열로 파싱한다", () => {
    const single =
      "<result><list><corp_code>00000001</corp_code><corp_name>단일</corp_name>" +
      "<stock_code>123456</stock_code><modify_date>20240101</modify_date></list></result>";
    expect(parseCorpCodeXml(single)).toHaveLength(1);
  });
});

describe("filterListed", () => {
  it("상장사만 남기고 이름순(한국어 정렬: 한글 → 영문)으로 정렬한다", () => {
    const listed = filterListed(parseCorpCodeXml(SAMPLE_XML));
    expect(listed.map((c) => c.corpName)).toEqual(["삼성전자", "SK하이닉스"]);
    expect(listed.every((c) => c.stockCode.length === 6)).toBe(true);
  });

  it("빈 입력은 빈 배열", () => {
    expect(filterListed([])).toEqual([]);
  });
});
