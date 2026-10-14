const PATTERNS = Object.freeze([
  {
    "name": "remote_jndi_lookup_in_headers",
    "condition": "data.useragent 또는 실제 요청 머리글 값에 완전한 JNDI 조회 표현식이 있고, LDAP·LDAPS·RMI·DNS 같은 원격 조회 방식과 비어 있지 않은 대상이 함께 확인되는 경우; CVE 이름·jndi 단어·중괄호만으로는 일치하지 않는다.",
    "evidence": "NVD CVE-2021-44228은 로그 메시지·인자의 공격자 제어 JNDI 대상 조회를 설명하며, MITRE T1190은 공개 애플리케이션 취약점 악용을 분류한다.",
    "sources": [
      "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
      "https://attack.mitre.org/techniques/T1190/"
    ]
  },
  {
    "name": "remote_jndi_lookup_in_parameters",
    "condition": "data.url의 요청 인자 또는 실제 요청 인자 값에 완전한 JNDI 조회 표현식이 있고, 원격 조회 방식과 비어 있지 않은 대상이 함께 확인되는 경우; 단순 취약점 검색·수업 노트·설명 문장만으로는 일치하지 않는다.",
    "evidence": "NVD CVE-2021-44228은 로그에 포함되는 인자의 JNDI 조회로 원격 대상에 접근할 수 있음을 설명하며, MITRE T1190은 이를 공개 애플리케이션 악용 기법으로 분류한다.",
    "sources": [
      "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
      "https://attack.mitre.org/techniques/T1190/"
    ]
  },
  {
    "name": "incomplete_remote_jndi_lookup",
    "condition": "요청 머리글·인자에 JNDI 원격 조회를 시작한 흔적은 있으나 대상 또는 닫는 구문이 없어 완전한 표현식을 확인할 수 없는 경우; 경보가 잘린 조회 형태를 명시한 경우도 약한 확인 신호로만 다루며 단독 차단하지 않는다.",
    "evidence": "CVE-2021-44228의 JNDI 원격 조회 특성에 근거한 보수적 확인 조건이며, 불완전한 흔적은 악용 성립을 입증하지 못한다.",
    "sources": [
      "https://nvd.nist.gov/vuln/detail/CVE-2021-44228"
    ]
  },
  {
    "name": "known_log4shell_scanner_trace",
    "condition": "요청 머리글·인자에 출처로 확인한 Log4Shell 점검 도구의 명시적 식별자가 있거나 경보가 해당 취약점 점검 흔적을 명시한 경우; 비슷한 수업용 프로그램 이름·일반 probe 인자·취약점 문서 조회만으로는 일치하지 않으며 도구 흔적만으로 차단하지 않는다.",
    "evidence": "CISA AA21-356A는 Log4Shell 스캔 활동과 공식 취약점 점검 도구를 설명하므로, 도구 흔적은 점검·공격 구분을 위한 확인 신호로만 사용한다.",
    "sources": [
      "https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-356a"
    ]
  },
  {
    "name": "ambiguous_known_cve_signal",
    "condition": "T1190으로 분류된 경보에 CVE-2021-44228·jndi 언급, 취약점 목록·검색, 머리글 중괄호, 점검 도구와 비슷한 이름 또는 관련 라이브러리 이름 같은 약한 흔적이 명시되고 완전한 원격 조회 구문은 없는 경우; alert로만 남기며 T1190 분류나 일반 정상 이벤트만으로는 일치하지 않는다.",
    "evidence": "CVE-2021-44228·T1190 관련 경보의 약한 흔적은 악용을 입증하지 않으므로, 이번 과제의 애매한 시도 알림 조건에 따라 차단 없이 확인 대상으로 남긴다.",
    "sources": [
      "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
      "https://attack.mitre.org/techniques/T1190/"
    ]
  }
].map((pattern) => Object.freeze(pattern)));

const COMPLETE_LOOKUP = /\$\{jndi:(?:ldap|ldaps|rmi|dns):\/\/[^\s{}/?#]+(?:[^\s{}]*)\}/iu;
const LOOKUP_START = /\$\{jndi:(?:ldap|ldaps|rmi|dns):/iu;

function stringsIn(value, depth = 0) {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object' || depth >= 4) return [];
  return Object.values(value).flatMap((item) => stringsIn(item, depth + 1));
}

function decoded(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

function queryValues(url) {
  if (typeof url !== 'string' || !url.includes('?')) return [];
  return url.slice(url.indexOf('?') + 1).split('#')[0].split('&')
    .map((part) => part.includes('=') ? part.slice(part.indexOf('=') + 1) : part);
}

function result(confidence, names) {
  return {
    action: confidence >= 0.85 ? 'block' : confidence >= 0.5 ? 'alert' : 'record',
    confidence,
    reason: names.length ? names.join(' + ') : 'no_matching_pattern',
  };
}

export function decide(alert) {
  if (!alert || typeof alert !== 'object' || Array.isArray(alert)) return result(0, []);
  const data = alert.data ?? {};
  const headers = stringsIn([data.useragent, data.headers, alert.headers]).map(decoded);
  const parameters = [
    ...queryValues(data.url),
    ...stringsIn([data.params, data.parameters, data.query]),
  ].map(decoded);
  const names = [];
  if (headers.some((value) => COMPLETE_LOOKUP.test(value))) names.push(PATTERNS[0].name);
  if (parameters.some((value) => COMPLETE_LOOKUP.test(value))) names.push(PATTERNS[1].name);
  if (names.length) return result(names.length > 1 ? 0.98 : 0.95, names);

  const description = typeof alert.rule?.description === 'string' ? alert.rule.description : '';
  const context = Array.isArray(alert.rule?.mitre) && alert.rule.mitre.includes('T1190');
  const incomplete = [...headers, ...parameters].some((value) => LOOKUP_START.test(value))
    || (context && /조회 형태가 잘린|잘린.*조회.*구문/u.test(description));
  if (incomplete) names.push(PATTERNS[2].name);
  // A tool name can describe an authorized check; it alone never warrants blocking.
  const scanner = [...headers, ...parameters].some((value) => /\bCVE-2021-44228_scanner\b/iu.test(value))
    || (context && /(?:CVE-2021-44228|Log4Shell|알려진 취약점).*점검 흔적/iu.test(description));
  if (scanner) names.push(PATTERNS[3].name);
  const weakSignal = context && (
    [...headers, ...parameters].some((value) => /CVE-2021-44228|\bjndi\b/iu.test(value))
    || /CVE-2021-44228|\bjndi\b|취약점.*(?:목록|검색)|머리글.*중괄호|점검 도구.*비슷|라이브러리 이름/iu.test(description)
  );
  if (weakSignal && names.length === 0) names.push(PATTERNS[4].name);
  return result(names.length ? 0.6 : 0, names);
}
