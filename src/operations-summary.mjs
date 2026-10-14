import { readFileSync } from 'node:fs';
import { RULE_IDS } from './decider.mjs';
import { plannedChecks } from './operations-checks.mjs';

const policy = JSON.parse(readFileSync(new URL('../policy-baseline/manifest.json', import.meta.url), 'utf8'));
const snapshot = JSON.parse(readFileSync(new URL('../practice-restore/manifest.json', import.meta.url), 'utf8'));

// Only explicit summary fields leave the server; no source events or note rows.
export function operationsSummary({ requestId, checkedAt, deviceStatus }) {
  return {
    schema: 'aleph.operations.summary.v1', requestId, checkedAt,
    checks: { rows: plannedChecks(), official41: { execution: 'not_run', passed: null,
      reason: '공식 41종 목록·운영 실행 결과 미연결. 아래는 단계별 확인 절차입니다.' } },
    rules: { source: 'src/decider.mjs RULE_IDS', count: RULE_IDS.length, ids: [...RULE_IDS],
      execution: 'not_run', measuredDecisions: null },
    detection: { execution: 'not_run', eventCount: null,
      reason: '운영 사건 전달 API 미연결. 로컬 가상 사건 시험은 실측에 포함하지 않습니다.' },
    revocation: { execution: 'not_run', count: null,
      reason: '운영 신원·접속 회수 API 미연결. 기기 등록부 상태와 별개입니다.' },
    device: { execution: 'observed', source: 'vault_devices: current user/current device', status: deviceStatus },
    recovery: { execution: 'not_run', restoredCount: null,
      policyVersion: policy.source.commit, snapshotVersion: snapshot.source.derivedFromGitCommit,
      source: 'synthetic_fixture', reason: '실습 사본 메타데이터입니다. 운영 복구 실행 기록은 연결되지 않았습니다.' },
  };
}
