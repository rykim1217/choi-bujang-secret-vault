// The student changes this check as each stage adds an attack to the same app.
// Never return tokens, private keys, real names, or note bodies.
export async function runAttackChecks(config) {
  if (![1, 2, 3].includes(config.step)) throw new Error('이 단계의 공격 점검을 src/attack-check.mjs에 구현해 주세요.');
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
  let apiBody = null;
  try { apiBody = await apiResponse.json(); } catch {
    // A non-JSON response is a failed authentication check.
  }
  const blocked = [401, 403].includes(apiResponse.status)
    && apiBody && typeof apiBody === 'object' && typeof apiBody.error === 'string';
  attempts.push({ attackId: 'anonymous_note_api_read', expected: '비로그인 /api/notes 요청이 JSON 오류와 함께 거부됨',
    observed: blocked
      ? `비로그인 /api/notes 요청이 JSON 오류와 함께 거부됨 (HTTP ${apiResponse.status})`
      : `비로그인 /api/notes 요청이 보호되지 않음 또는 JSON 오류가 아님 (HTTP ${apiResponse.status})` });
  return attempts;
}
