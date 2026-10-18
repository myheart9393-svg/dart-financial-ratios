/**
 * OpenDART 응답의 `status`가 "000"(정상)이 아닐 때 발생하는 에러.
 * 주요 상태 코드: 010(미등록 키), 011(사용할 수 없는 키), 013(조회된 데이터 없음),
 * 020(요청 제한 초과), 100(필드 부적절), 800(시스템 점검), 900(정의되지 않은 오류)
 */
export class DartApiError extends Error {
  readonly status: string;

  constructor(status: string, message: string) {
    super(`[DART ${status}] ${message}`);
    this.name = "DartApiError";
    this.status = status;
  }
}

/** 2xx 이외의 HTTP 응답, 또는 응답 본문 형식이 예상과 다를 때 발생. */
export class DartHttpError extends Error {
  readonly httpStatus: number;

  constructor(httpStatus: number, message: string) {
    super(message);
    this.name = "DartHttpError";
    this.httpStatus = httpStatus;
  }
}

/** 서버 환경 변수 `DART_API_KEY`가 설정되지 않았을 때 발생. */
export class DartConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DartConfigError";
  }
}
