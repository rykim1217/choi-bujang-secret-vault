// The student changes this check as each stage adds an attack to the same app.
// Never return tokens, private keys, real names, or note bodies.
import { randomUUID } from 'node:crypto';

const blockedStatuses = new Set([401, 403, 404]);

async function responseJson(response) {
  try { return await response.json(); } catch { return null; }
}

function authHeaders(token, origin, json = false) {
  return {
    Authorization: `Bearer ${token}`,
    Origin: origin,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function runAttackChecks(config) {
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(config.step)) throw new Error('이 단계의 공격 점검을 src/attack-check.mjs에 구현해 주세요.');
  let app;
  try {
    app = new URL(config.publicAppUrl);
  } catch {
    throw new Error('aleph.config.json의 실제 배포 주소를 먼저 넣어 주세요.');
  }
  if (app.protocol !== 'https:' || app.username || app.password || app.search || app.hash
      || app.pathname !== '/' || app.hostname.endsWith('.example')) {
    throw new Error('aleph.config.json의 실제 배포 주소를 먼저 넣어 주세요.');
  }
  if (config.step === 1 && (typeof config.sampleMarker !== 'string' || !config.sampleMarker)) {
    throw new Error('가상 메모의 확인 표시를 넣어 주세요.');
  }
  const response = await fetch(new URL('/data.json', app), {
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  let visible = false;
  if (response.ok) {
    try {
      const data = await response.json();
      const hasSampleMarker = Object.prototype.hasOwnProperty.call(data, 'sampleMarker');
      visible = Array.isArray(data.notes)
        && (config.step === 1
          ? hasSampleMarker && data.sampleMarker === config.sampleMarker && data.notes.length > 0
          : !hasSampleMarker && data.notes.length === 0);
    } catch {
      // A non-JSON response is a failed check, not a successful deployment.
    }
  }
  if (config.step === 1) {
    return [{ attackId: 'anonymous_note_read', expected: '비로그인 화면에서 가상 메모를 확인',
      observed: visible ? '비로그인 요청에서 공개 가상 메모 확인 표시가 보임' : `비로그인 요청에서 확인 표시가 보이지 않음 (HTTP ${response.status})` }];
  }
  const attempts = [{ attackId: 'anonymous_static_note_read', expected: '비로그인 /data.json에서 가상 메모가 보이지 않음',
    observed: visible ? '비로그인 요청의 /data.json에 메모가 보이지 않음' : `비로그인 요청의 /data.json 점검 실패 (HTTP ${response.status})` }];
  if (config.step === 2) return attempts;

  const apiResponse = await fetch(new URL('/api/notes', app), {
    redirect: 'error', signal: AbortSignal.timeout(10000),
  });
  const apiBody = await responseJson(apiResponse);
  const blocked = [401, 403].includes(apiResponse.status)
    && apiBody && typeof apiBody === 'object' && typeof apiBody.error === 'string';
  attempts.push({ attackId: 'anonymous_note_api_read', expected: '비로그인 /api/notes 요청이 JSON 오류와 함께 거부됨',
    observed: blocked
      ? `비로그인 /api/notes 요청이 JSON 오류와 함께 거부됨 (HTTP ${apiResponse.status})`
      : `비로그인 /api/notes 요청이 보호되지 않음 또는 JSON 오류가 아님 (HTTP ${apiResponse.status})` });

  if ([7, 8].includes(config.step)) {
    attempts.push({ attackId: 'step_up_data_gate',
      expected: '추가 확인 전 자료가 반환되지 않고 새 로그인 뒤 요청이 다시 판정됨',
      observed: '미실행: 같은 로그인 주체의 새 로그인 시각을 확인하는 운영 계약과 자료 API 연결이 제공되지 않았습니다.' });
  }

  if (config.step === 8) {
    attempts.push({ attackId: 'resource_zone_direct_api',
      expected: '다른 자원 구역과 알 수 없는 기능 경로가 자료 API에서 거부됨',
      observed: '미실행: 강사 공지 시험 계정과 구역별 운영 요청 계약이 제공되지 않았습니다.' });
  }

  if (config.step === 9) {
    attempts.push({ attackId: 'burst_read_detection',
      expected: '동일 가명 주체의 10분 내 120건 초과 GET만 회수 제안 대상으로 식별됨',
      observed: '미실행: detect:test는 가상 사건 연습이며 운영 반 엔진 전달·실제 권한 변경 경로가 제공되지 않았습니다.' });
  }

  if (![4, 5, 8].includes(config.step)) return attempts;

  const ownerAToken = process.env.ALEPH_CHECK_OWNER_A_TOKEN;
  const ownerBToken = process.env.ALEPH_CHECK_OWNER_B_TOKEN;
  if (typeof ownerAToken !== 'string' || !ownerAToken.trim()
      || typeof ownerBToken !== 'string' || !ownerBToken.trim()) {
    attempts.push({ attackId: 'cross_owner_note_access',
      expected: '로그인한 다른 사용자의 메모 GET·PUT·DELETE가 거부됨',
      observed: '미실행: 소유자 A/B의 검증된 토큰을 비밀 입력란에 넣지 않았습니다.' });
    return attempts;
  }

  const probeId = randomUUID();
  let createResponse;
  try {
      createResponse = await fetch(new URL('/api/notes', app), {
      method: 'POST', headers: authHeaders(ownerBToken, app.origin, true),
      body: JSON.stringify({ id: probeId, title: 'stage4 ownership check', body: 'temporary check' }),
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
  } catch {
    attempts.push({ attackId: 'cross_owner_note_access',
      expected: '로그인한 다른 사용자의 메모 GET·PUT·DELETE가 거부됨',
      observed: '점검 실패: 소유자 B의 시험 메모 생성 요청에서 네트워크 오류가 발생했습니다.' });
    return attempts;
  }

  if (createResponse.status !== 201) {
    attempts.push({ attackId: 'cross_owner_note_access',
      expected: '로그인한 다른 사용자의 메모 GET·PUT·DELETE가 거부됨',
      observed: `미실행: 소유자 B의 시험 메모 생성이 HTTP ${createResponse.status}로 거부되었습니다.` });
    return attempts;
  }

  const crossOwnerRequests = [
    ['GET', undefined],
    ['PUT', JSON.stringify({ title: 'cross-owner update attempt', body: 'temporary check' })],
    ['DELETE', undefined],
  ];
  const statuses = [];
  try {
    for (const [method, body] of crossOwnerRequests) {
      const response = await fetch(new URL(`/api/notes/${probeId}`, app), {
        method, headers: authHeaders(ownerAToken, app.origin, body !== undefined),
        ...(body === undefined ? {} : { body }),
        redirect: 'error', signal: AbortSignal.timeout(10000),
      });
      statuses.push(`${method}=${response.status}`);
    }
  } catch {
    statuses.push('네트워크 오류');
  }

  let cleanupStatus = '미실행';
  try {
    const cleanup = await fetch(new URL(`/api/notes/${probeId}`, app), {
      method: 'DELETE', headers: authHeaders(ownerBToken, app.origin),
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    cleanupStatus = String(cleanup.status);
  } catch {
    cleanupStatus = '네트워크 오류';
  }

  const blockedCrossOwner = statuses.length === 3
    && statuses.every(status => blockedStatuses.has(Number(status.split('=')[1])));
  attempts.push({ attackId: 'cross_owner_note_access',
    expected: '로그인한 다른 사용자의 메모 GET·PUT·DELETE가 모두 거부됨',
    observed: `${blockedCrossOwner ? '거부 확인' : '거부 확인 실패'} (${statuses.join(', ')}, B 정리 HTTP ${cleanupStatus})` });
  return attempts;
}
