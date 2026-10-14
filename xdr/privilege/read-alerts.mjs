import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE_URL = new URL('../fixtures/privilege.json', import.meta.url);
const SECRET_LIKE = /password|passwd|pwd\s*[:=]|token|secret|api[_-]?key|private[_-]?key|bearer|authorization|cookie|session|-----BEGIN|[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|[A-Za-z0-9_+/=-]{32,}/iu;

function safeString(value) {
  if (typeof value !== 'string') return null;
  return SECRET_LIKE.test(value) ? '[redacted]' : value.replace(/[\r\n\u2028\u2029]/gu, ' ');
}

function summarizeAlert(alert) {
  return {
    timestamp: safeString(alert?.timestamp),
    sourceAddress: safeString(alert?.data?.srcip),
    account: safeString(alert?.data?.srcuser),
    ruleLevel: Number.isInteger(alert?.rule?.level) ? alert.rule.level : null,
    description: safeString(alert?.rule?.description),
  };
}

export async function readAlerts(fixtureUrl = FIXTURE_URL) {
  const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  if (fixture?.schema !== 'aleph.xdr.fixture.v1'
      || fixture.moduleKey !== 'privilege'
      || !Array.isArray(fixture.alerts)) {
    throw new Error('privilege 경보 묶음 형식이 아닙니다.');
  }
  return fixture.alerts.map(summarizeAlert);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    const alerts = await readAlerts();
    for (const alert of alerts) process.stdout.write(`${JSON.stringify(alert)}\n`);
  } catch {
    process.stderr.write('privilege 경보 읽기 오류: 파일과 묶음 형식을 확인하세요.\n');
    process.exitCode = 1;
  }
}
