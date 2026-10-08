import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE_URL = new URL('../fixtures/web-injection.json', import.meta.url);
const REDACTED = '[redacted]';
const SECRET_LIKE_TEXT = /(?:password|passwd|token|secret|api[_-]?key|private[_-]?key|bearer|authorization|cookie|session)/iu;
const JWT_LIKE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u;
const PEM_LIKE = /^-----BEGIN [^-]+-----/u;

function safeString(value) {
  if (typeof value !== 'string') return value ?? null;
  if (SECRET_LIKE_TEXT.test(value) || JWT_LIKE.test(value) || PEM_LIKE.test(value)) {
    return REDACTED;
  }
  return value;
}

function summarizeAlert(alert) {
  return {
    timestamp: safeString(alert?.timestamp),
    sourceAddress: safeString(alert?.data?.srcip),
    account: safeString(alert?.data?.srcuser),
    ruleLevel: alert?.rule?.level ?? null,
    description: safeString(alert?.rule?.description),
  };
}

export async function readAlerts(fixtureUrl = FIXTURE_URL) {
  const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8'));
  if (fixture?.schema !== 'aleph.xdr.fixture.v1'
      || fixture.moduleKey !== 'web-injection'
      || !Array.isArray(fixture.alerts)) {
    throw new Error('web-injection 경보 묶음 형식이 아닙니다.');
  }
  return fixture.alerts.map(summarizeAlert);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  try {
    process.stdout.write(`${JSON.stringify(await readAlerts(), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : '읽기 오류'}\n`);
    process.exitCode = 1;
  }
}
