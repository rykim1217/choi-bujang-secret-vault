import { randomUUID } from 'node:crypto';

const cases = [
  [1, '정상', '자료실 화면 조회', '200'], [1, '금지', '공개 파일의 메모 노출', '메모 없음'],
  [2, '정상', '보호된 자료의 정상 조회', '허용'], [2, '금지', '정적 파일 직접 메모 조회', '메모 없음'],
  [3, '정상', '로그인·승인 기기의 자기 메모 목록 GET', '200'], [3, '금지', '무인증 메모 목록 GET', '401 또는 403'],
  [4, '정상', '자기 메모 개별 GET', '200'], [4, '금지', '타인 메모 GET·PUT·DELETE', '거부 (각 요청 별도 확인)'],
  [5, '정상', '서버를 통한 자료 요청', '허용'], [5, '금지', '원본 API 무인증 직접 요청', '거부'],
  [6, '정상', '등록 기기 요청', 'allow'], [6, '금지', '미등록 기기 요청', 'deny'],
  [7, '정상', '정상 신호 요청', 'allow'], [7, '금지', '복합 이상·추가 확인 없는 요청', 'step_up'],
  [8, '정상', '허용 구역의 자기 자료 읽기', '허용'], [8, '금지', '구역 밖·서명 없는 변경 요청', '거부'],
  [9, '정상', '10분 안에 같은 주체 조회 120건 이하', 'observe'], [9, '금지', '120건 초과 뒤 회수된 신원 재접속', '회수 제안 및 재접속 거부 (운영 확인 필요)'],
  [10, '정상', '승인된 대상·버전 복구', '복구 후 해시·소유자 일치'], [10, '금지', '대상 밖·타인 자료 복구', '거부'],
  [11, '정상', '승인 기기의 자료실 요청', '허용'], [11, '금지', '승인 전·회수 기기의 자료실 요청', '403'],
];

export function plannedChecks() {
  return cases.map(([step, kind, request, expected], index) => ({
    id: `stage-${step}-${kind === '정상' ? 'normal' : 'forbidden'}`, step, kind, request, expected,
    execution: 'not_run', actual: null, requestId: null, checkedAt: null,
    reason: index === 4 || index === 5 ? '실측 버튼으로 조회 가능' : '공식 계정·대상·운영 연결을 확인한 후 별도 실행',
  }));
}

export async function measureReadChecks({ appUrl, cookie, authorization, fetchImpl = fetch }) {
  const rows = plannedChecks();
  for (const authenticated of [true, false]) {
    const row = rows.find(item => item.id === `stage-3-${authenticated ? 'normal' : 'forbidden'}`);
    const probeId = randomUUID();
    try {
      const response = await fetchImpl(new URL('/api/notes', appUrl), {
        method: 'GET', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: authenticated ? { ...(cookie ? { Cookie: cookie } : {}),
          ...(authorization ? { Authorization: authorization } : {}) } : {},
      });
      // Consume no body: neither notes nor private API error text are recorded.
      await response.body?.cancel();
      Object.assign(row, { execution: 'observed', actual: `HTTP ${response.status}`,
        requestId: probeId, serverRequestId: response.headers.get('x-vercel-id'),
        checkedAt: new Date().toISOString(),
        matchesExpected: authenticated ? response.status === 200 : [401, 403].includes(response.status),
        reason: '실제 GET 응답 상태. 요청 ID는 작전실 전송 기록 ID이며 대상 서버 ID는 별도 필드입니다.' });
    } catch {
      Object.assign(row, { execution: 'error', actual: '응답 확인 실패', requestId: probeId,
        checkedAt: new Date().toISOString(), matchesExpected: null, reason: '통과로 처리하지 않습니다.' });
    }
  }
  return { rows, official41: { execution: 'not_run', passed: null,
    reason: '공식 41종 목록·운영 실행 결과 미연결. 이 22행은 단계별 확인 절차입니다.' } };
}
