export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">OpenDART 기반</p>
      <h1 className="text-4xl font-bold tracking-tight">DART 재무비율 조회</h1>
      <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
        금융감독원 전자공시시스템(OpenDART)의 재무제표를 바탕으로 기업의 최근 5개년
        수익성·안정성·성장성·활동성 비율을 계산하고 차트로 비교합니다.
      </p>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        기업 검색 기능은 준비 중입니다.
      </p>
    </main>
  );
}
