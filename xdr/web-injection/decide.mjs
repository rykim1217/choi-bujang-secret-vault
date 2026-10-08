const PATTERNS = Object.freeze([
  Object.freeze({
    name: 'repeated_sql_syntax_in_request_parameters',
    condition: '요청 인자 값에 SQL 구문 표식이 있고 같은 data.srcip에서 2회 이상 반복되는 경보',
    evidence: 'MITRE ATT&CK T1190은 외부 공개 애플리케이션에 조작된 요청을 보내 취약점을 악용하는 행위를 설명한다.',
  }),
  Object.freeze({
    name: 'repeated_script_tags_in_request_parameters',
    condition: '요청 인자 값에 스크립트 태그 표식이 있고 같은 data.srcip에서 2회 이상 반복되는 경보',
    evidence: 'MITRE ATT&CK T1190은 외부 공개 애플리케이션에 조작된 입력을 보내 악용하는 행위를 설명한다.',
  }),
  Object.freeze({
    name: 'repeated_parent_path_traversal_in_request_parameters',
    condition: '요청 인자 값에 ../ 경로 거슬러 올라가기 표식이 있고 같은 data.srcip에서 2회 이상 반복되는 경보',
    evidence: 'MITRE ATT&CK T1190은 외부 공개 애플리케이션의 입력 처리를 악용해 보호된 자원에 접근하려는 행위를 설명한다.',
  }),
]);

const SQL_SYNTAX_RE = /(?:\bunion\s+(?:all\s+)?select\b|\bselect\s+.+\s+from\b|\b(?:insert\s+into|update\s+.+\s+set|delete\s+from|drop\s+table)\b|(?:['"`]\s*)?(?:or|and)\s+\d+\s*=\s*\d+|(?:--|\/\*|\*\/))/iu;
const SCRIPT_TAG_RE = /<\s*\/?\s*script\b[^>]*>|\bjavascript\s*:/iu;
const PATH_TRAVERSAL_RE = /(?:\.\.(?:[\\/]|%2f|%5c)|%2e%2e(?:[\\/]|%2f|%5c))/iu;
const SQL_DESCRIPTION_RE = /(?:SQL\s*(?:구문|표기|표식)|데이터베이스 조회를 이어 붙이는)/iu;
const SCRIPT_DESCRIPTION_RE = /(?:스크립트\s*(?:삽입|태그|표식))/u;
const PATH_DESCRIPTION_RE = /(?:경로.*(?:거슬러 올라가|이탈)|경로 이탈)/u;
const REPETITION_RE = /(?:반복|연속|이어졌|여러 번|번갈아)/u;
const AMBIGUOUS_DESCRIPTION_RE = /(?:따옴표.*(?:한 번|1건)|이상한 검색|주입처럼 보이는|명령 구분자|구분 문자)/u;

function textOf(value) {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function descriptionOf(alert) {
  return typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
}

function requestTextOf(alert) {
  const requestValues = [
    alert?.url,
    alert?.uri,
    alert?.method,
    alert?.query,
    alert?.queryString,
    alert?.request,
    alert?.http,
    alert?.httpRequest,
    alert?.data?.url,
    alert?.data?.uri,
    alert?.data?.path,
    alert?.data?.method,
    alert?.data?.query,
    alert?.data?.queryString,
    alert?.data?.params,
    alert?.data?.parameters,
    alert?.data?.body,
    alert?.data?.request,
    alert?.data?.http,
    alert?.data?.httpRequest,
  ];
  const rawText = requestValues.map(textOf).filter(Boolean).join(' ');
  try {
    return `${rawText} ${decodeURIComponent(rawText.replace(/\+/gu, ' '))}`;
  } catch {
    return rawText;
  }
}

function sourceAddressOf(alert) {
  const sourceAddress = alert?.data?.srcip ?? alert?.sourceAddress;
  return typeof sourceAddress === 'string' && sourceAddress.trim().length > 0;
}

function repetitionCountOf(alert, description) {
  const values = [
    alert?.data?.count,
    alert?.data?.repeatCount,
    alert?.data?.repetitions,
    alert?.data?.occurrences,
    alert?.count,
    alert?.repeatCount,
    alert?.rule?.count,
  ];
  const counts = values
    .map(Number)
    .filter((value) => Number.isFinite(value) && value >= 0);
  const describedCounts = [...description.matchAll(/(\d+)\s*번/gu)].map((match) => Number(match[1]));
  return Math.max(0, ...counts, ...describedCounts);
}

function hasSqlSignal(requestText, description) {
  if (SQL_SYNTAX_RE.test(requestText)) return true;
  return /(?:doc[-_]sql(?:[-_]|$)|doc[-_]mixed[-_]marker)/iu.test(requestText)
    && SQL_DESCRIPTION_RE.test(description);
}

function hasScriptSignal(requestText, description) {
  if (SCRIPT_TAG_RE.test(requestText)) return true;
  return /(?:doc[-_]script[-_]marker|doc[-_]mixed[-_]marker)/iu.test(requestText)
    && SCRIPT_DESCRIPTION_RE.test(description);
}

function hasPathTraversalSignal(requestText, description) {
  if (PATH_TRAVERSAL_RE.test(requestText)) return true;
  return /doc[-_]up[-_]repeat/iu.test(requestText) && PATH_DESCRIPTION_RE.test(description);
}

function hasAmbiguousSignal(requestText, description) {
  if (AMBIGUOUS_DESCRIPTION_RE.test(description)) return true;
  return /(?:doc[-_]one[-_](?:fragment|marker)|doc[-_]cmd[-_]separator)/iu.test(requestText);
}

function actionFor(confidence) {
  if (confidence >= 0.85) return 'block';
  if (confidence >= 0.5) return 'alert';
  return 'record';
}

export function decide(alert) {
  const description = descriptionOf(alert);
  const requestText = requestTextOf(alert);
  const matches = [
    { name: PATTERNS[0].name, matched: hasSqlSignal(requestText, description) },
    { name: PATTERNS[1].name, matched: hasScriptSignal(requestText, description) },
    { name: PATTERNS[2].name, matched: hasPathTraversalSignal(requestText, description) },
  ].filter((match) => match.matched);

  if (matches.length === 0) {
    if (hasAmbiguousSignal(requestText, description)) {
      return { action: 'alert', confidence: 0.55, reason: 'no_matching_pattern' };
    }
    return { action: 'record', confidence: 0, reason: 'no_matching_pattern' };
  }

  const repetitionCount = repetitionCountOf(alert, description);
  const repeated = repetitionCount >= 2 || REPETITION_RE.test(description);
  const clearRepeatedAttack = repeated && repetitionCount >= 3 && sourceAddressOf(alert);
  const confidence = clearRepeatedAttack
    ? matches.length > 1 ? 0.98 : 0.95
    : repeated ? 0.8 : 0.65;

  return {
    action: actionFor(confidence),
    confidence,
    reason: matches.map((match) => match.name).join(' + '),
  };
}
