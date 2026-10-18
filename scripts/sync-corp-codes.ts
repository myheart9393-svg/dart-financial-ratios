/**
 * OpenDART 고유번호(corpCode.xml)를 내려받아 상장사만 src/data/corp-codes.json 으로 저장한다.
 * 실행: pnpm sync:corp  (.env.local 에 DART_API_KEY 필요)
 *
 * 다운로드와 파일 쓰기만 담당하고, 파싱은 src/lib/dart/corp-codes.ts 의 순수 함수에 맡긴다.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { config } from "dotenv";

import {
  extractCorpCodeXml,
  filterListed,
  isZipBuffer,
  parseCorpCodeXml,
  parseDartErrorXml,
} from "../src/lib/dart/corp-codes";
import type { CorpCode, CorpCodeFile } from "../src/types/corp";

const CORP_CODE_URL = "https://opendart.fss.or.kr/api/corpCode.xml";
const OUTPUT_PATH = path.join("src", "data", "corp-codes.json");

function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function readApiKey(): string {
  config({ path: ".env.local", quiet: true });
  const key = process.env.DART_API_KEY?.trim();
  if (!key) {
    fail(
      "DART_API_KEY 가 없습니다. .env.example 을 참고해 .env.local 에 키를 설정하세요.\n" +
        "  키 발급: https://opendart.fss.or.kr",
    );
  }
  return key;
}

async function downloadCorpCodeZip(apiKey: string): Promise<Uint8Array> {
  const url = new URL(CORP_CODE_URL);
  url.searchParams.set("crtfc_key", apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    fail(`HTTP 오류: ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  if (isZipBuffer(bytes)) {
    return bytes;
  }

  // 키 오류 등은 ZIP 대신 XML 에러 본문으로 응답한다.
  const contentType = response.headers.get("content-type") ?? "unknown";
  const error = parseDartErrorXml(new TextDecoder("utf-8").decode(bytes));
  if (error) {
    fail(`OpenDART 오류 [${error.status}] ${error.message}`);
  }
  fail(`ZIP 이 아닌 응답을 받았습니다 (content-type: ${contentType}).`);
}

/** 항목당 한 줄로 직렬화해 갱신 시 diff 를 읽기 쉽게 한다. */
function serialize(file: CorpCodeFile): string {
  const items = file.items.map((item: CorpCode) => `    ${JSON.stringify(item)}`).join(",\n");
  return (
    "{\n" +
    `  "syncedAt": ${JSON.stringify(file.syncedAt)},\n` +
    `  "count": ${file.count},\n` +
    `  "items": [\n${items}\n  ]\n` +
    "}\n"
  );
}

async function main(): Promise<void> {
  const apiKey = readApiKey();

  console.log("corpCode.xml 다운로드 중...");
  const zip = await downloadCorpCodeZip(apiKey);

  const records = parseCorpCodeXml(extractCorpCodeXml(zip));
  const listed = filterListed(records);

  const file: CorpCodeFile = {
    syncedAt: new Date().toISOString(),
    count: listed.length,
    items: listed,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, serialize(file), "utf-8");

  console.log(`전체 기업 수 : ${records.length.toLocaleString("ko-KR")}`);
  console.log(`상장사 수    : ${listed.length.toLocaleString("ko-KR")}`);
  console.log(`저장 경로    : ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : String(error));
});
