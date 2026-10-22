# BYTE BACK 방어전 시작 틀 R5

## 17단계 저장점

`on-client/student/extension.mjs`의 `renderAiConnection`은 AI 연결 점검의 대기·진행·성공·실패를 구분하고, 시험 연결·앱 권한 확인·모델 수·점검 시각과 안전한 오류 코드·메시지를 표시합니다. `renderExplanation`은 선택한 사건의 설명 결과만 표시하며, 연결 점검을 사건 설명 성공으로 바꾸지 않습니다. 앞 단계 학생 함수와 제공 서버·인증 설정은 유지합니다.

다시 확인하려면 `on-client` 폴더의 PowerShell에서 `npm run check`를 실행한 뒤 `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1`로 앱을 켜고 브라우저에서 `http://127.0.0.1:5189/`를 엽니다. 기본 실행은 연결 없음 상태이며 실제 AI 연결·사건 설명 성공을 뜻하지 않습니다.

## 18단계 저장점

`on-client/student/extension.mjs`의 `renderExplanation`은 선택된 이벤트의 AI 설명을 참고용으로 표시하고, 현재 이벤트의 `evidenceIds`와 근거 문장을 대조합니다. 규칙·접속·세션·기기 상태·제안 이유·사람 확인 필요·미실행 상태를 함께 표시하며, 근거 불일치·실패·자료 없음에는 `data-student-explanation-event`를 붙이지 않습니다. 지원 조치가 없으면 제안이 없는 이유를 표시하고 실행 버튼은 만들지 않습니다. 다른 이벤트·새로고침·실패 화면은 새 DOM으로 교체됩니다.

다시 확인하려면 `on-client` 폴더의 PowerShell에서 `npm run check`를 실행하고, 실제 AI 설명 요청은 유료 요청을 반복하지 않는 범위에서 선택한 이벤트의 근거 ID와 표시 내용만 확인합니다. 실제 AI 연결·설명 응답은 이번 저장점에서 미확인입니다.

## 19단계 저장점

`on-client/student/extension.mjs`의 `renderAction`은 조치 준비·전달·접수·거절·실패·결과 불명·기한 만료·요청 오류를 원래 상태값과 함께 구분합니다. `succeeded`는 `observation.effectApplied === true`일 때만 효과 확인으로 표시하고 관측 시각·영수증 ID를 함께 보여 줍니다. 사건·근거·조치·대상·요청 식별자를 입력 범위에서만 표시하며, 버튼·POST 요청·인증 티켓은 추가하지 않습니다.

다시 확인하려면 `on-client` 폴더의 PowerShell에서 `npm run check`를 실행합니다. 실제 조치 요청이나 효과 확인은 이번 저장점에서 실행하지 않았으며, 현재 `supportedActions`가 비어 있어 조치 준비 버튼이 나오지 않는 것이 정상입니다.

## 20단계 저장점

`on-client/student/extension.mjs`의 `renderVulnerabilities`는 설치 패키지 취약점 조회의 대기·진행·실패·완료를 구분하고, 전체 조회 상태·lockfile 메타데이터·정확한 설치 버전·OSV 출처·확인 시각·취약점 ID와 수정 시각을 표시합니다. 일부 조회 실패와 알려진 항목 없음은 구분하며, 확인 불가 상태에서 이미 받은 취약점 ID를 지우지 않습니다. 조회 중·오류 화면에는 이전 목록을 남기지 않습니다.

다시 확인하려면 `on-client` 폴더의 PowerShell에서 `npm run check`를 실행합니다. 실제 OSV 조회와 공식 단계 판정은 이번 저장점에서 미확인입니다. 의존성 버전을 낮추거나 프로젝트의 허용 패키지 설정을 변경하지 않았습니다.

## 보너스 xdr-06 저장점

`xdr/exfiltration/read-alerts.mjs`는 가상 Wazuh 경보 30건에서 시각·출발 주소·계정·규칙 수준·설명 30줄을 추출하고 비밀값 의심 문자열을 가립니다. `patterns.json`에는 MITRE T1041·T1048 근거와 수업용 조건을 기록했습니다. 같은 패턴 상수를 포함한 `decide.mjs`는 외부 파일·패키지·네트워크 없이 판단하며, 전송량 하나나 경보 수준만으로 차단하지 않습니다.

2026-10-14 `npm run xdr:run -- exfiltration` 재실행 결과는 **block 10·alert 10·record 10**, 가상 정상 이벤트 10건 중 차단 **0건**입니다. 같은 명령으로 다시 실행하고 편집기에서 `xdr/exfiltration/result.json`을 눌러 `counts`를 확인합니다. 명확한 복합 반출은 block, 약한 반출 징후는 alert, 정상 이벤트는 record입니다. 읽기는 `node xdr/exfiltration/read-alerts.mjs`로 확인합니다. Windows에서 npm이 검색되지 않으면 `& 'C:/Program Files/nodejs/npm.cmd' run xdr:run -- exfiltration`을 사용합니다.

`respond.mjs`는 판단을 재확인한 block 후보만 목적지·계정·출발 주소·현재 공격 패턴에 한정된 메모리 거부 규칙으로 등록하고 기본 15분 만료·근거 경보 번호를 붙입니다. block·alert 알림은 `xdr/alerts.log`에 원문·주소·계정 없이 한 줄씩 기록하며 이번 가상 경보 응답 확인에서 규칙 10개·알림 20줄을 생성했습니다. `checkAccess(request, inspectedAlert)`는 기존 ZTNA deny·step_up을 유지하고 allow 뒤에 신뢰된 별도 경보 검사를 추가합니다. 정상 요청은 같은 출발 주소여도 통과합니다. 공식 요청·응답 계약과 기존 판정기 규칙은 보존했습니다.

`node --test --test-isolation=none test/exfiltration-connection.test.mjs` 로컬 시험 4개가 통과했습니다. 공격 거부·애매한 시도 알림·정상 허용·기존 거부와 추가 확인 유지·목적지 범위·만료·위조 결과 거부·독립 판단을 확인했습니다. 실행기는 판단 결과만 생성하며 응답 연결·운영 차단·심판 판정을 실행하지 않습니다. 운영 등록은 `installDenyRule` 연결점만 제공하며 운영 엔진·자료 API 연결·실제 접속 회수·배포·심판 판정은 미실행입니다. 메모리 규칙은 재시작하면 사라지며 실제 연결에는 신뢰된 경보와 요청 신원·전송 목적지의 매핑이 필요합니다.

설정 step 12, Git 원격·문서의 배포 주소, 로그인 발급자·JWKS·대상, 허용 경로 3개, 원본 API의 vault_notes 경로를 기존 구현과 대조했습니다. `src/decider.mjs` RULE_IDS 여섯 개는 구현된 규칙이며 설정과 운영 측 judgeIssuer를 유지합니다. 현재 원격 배포 상태·bundle 자기 점검은 이번 저장점에서 미실행입니다. 기존 가상 메모·다른 XDR 모듈을 보존하고 알림 로그·bundle-notes.json·artifacts/submission.json은 커밋에서 제외합니다.


## 보너스 xdr-05 저장점

`xdr/privilege/read-alerts.mjs`는 가상 Wazuh 경보 26건에서 시각·출발 주소·계정·규칙 수준·설명만 추출하며 비밀값 의심 문자열을 가립니다. `patterns.json`은 관리자 그룹 변경·낯선 관리자 실행·시간 밖 권한 사용의 조건과 MITRE T1068·T1078 근거를 기록합니다. 같은 패턴을 상수로 포함한 `decide.mjs`는 다른 파일·패키지·네트워크 없이 판단하며, 관리자 명령만으로 취약점 악용을 입증하지 않습니다.

2026-10-14 `npm run xdr:run -- privilege` 재실행 결과는 **block 9·alert 8·record 9**, 가상 정상 이벤트 9건 중 차단 **0건**입니다. 같은 명령으로 `xdr/privilege/result.json`을 갱신하고 편집기에서 해당 파일을 눌러 `counts`를 확인합니다. 터미널의 `node xdr/privilege/read-alerts.mjs`는 26줄 읽기 확인용입니다. 실행기는 판단 결과만 생성하며 알림 기록·운영 차단·심판 판정을 수행하지 않습니다.

`respond.mjs`는 판단을 다시 확인해 block 후보만 계정·출발 주소·패턴에 한정된 메모리 거부 규칙으로 등록하며, 기본 15분 만료와 근거 경보 번호를 붙입니다. block·alert는 기본 `xdr/alerts.log`에 원문·주소·계정 없이 기록하고 정상 이벤트에는 규칙을 만들지 않습니다. `checkAccess(request, inspectedAlert)`는 기존 ZTNA 판정기의 deny·step_up을 유지하고 allow 뒤에 신뢰된 별도 경보 검사를 추가합니다. 공식 요청 계약과 기존 판정기 규칙은 변경하지 않았습니다.

`node --test --test-isolation=none test/privilege-connection.test.mjs`의 로컬 시험 4개가 통과했습니다. 명확한 공격 거부·애매한 시도 알림·정상 및 동일 주소 정상 요청 허용·기존 거부와 추가 확인 유지·만료·위조 결과 거부·독립 판단을 확인했습니다. 운영 등록은 `installDenyRule` 연결점만 제공하며 운영 ZTNA 등록·실제 세션 회수·배포·심판 판정은 미실행입니다. 메모리 규칙은 재시작하면 사라지며 운영 연결에는 경보 계정과 확인된 요청 신원의 신뢰된 매핑이 필요합니다.

설정된 배포 주소는 https://choi-bujang-secret-vault-rayeon.vercel.app 입니다. 설정 step 12, 저장소 원격과 배포 주소 문서, 로그인 발급자·JWKS·대상, 허용 경로 3개, 원본 API를 기존 구현과 대조했습니다. 기존 RULE_IDS 여섯 개는 구현되어 있으며 설정과 운영 측 judgeIssuer를 유지합니다. 최신 원격 배포 상태·bundle 자기 점검은 이번 저장점에서 미실행입니다. 기존 가상 메모·다른 XDR 모듈을 보존하고, 알림 로그·bundle-notes.json·artifacts/submission.json은 커밋에 포함하지 않습니다.

## 보너스 xdr-04 저장점 준비

`xdr/persistence/read-alerts.mjs`는 가상 경보 24건에서 시각·출발 주소·계정·규칙 수준·설명만 출력하고 비밀값 의심 문자열을 가립니다. `patterns.json`에는 서비스(T1543), 예약 작업(T1053), 시작 폴더(T1547.001)의 이름·조건·한 줄 근거·출처를 기록했습니다. `decide.mjs` 맨 위에 같은 패턴을 상수로 넣었으며 외부 파일·패키지·네트워크 없이 판단합니다. 0.85 이상 block, 0.5 이상 alert, 나머지는 record입니다.

2026-10-14 `npm run xdr:run -- persistence` 실행 결과는 **block 8·alert 8·record 8**, 가상 정상 이벤트 8건의 차단은 **0건**입니다. 같은 명령으로 `xdr/persistence/result.json`을 갱신할 수 있습니다. 터미널에서 `node xdr/persistence/read-alerts.mjs`로 읽기 결과를 보고, 편집기에서 result.json의 counts를 확인합니다. 이 실행기는 판단만 수행하며 알림 기록·규칙 등록·운영 격리·심판 판정은 수행하지 않습니다.

`respond.mjs`는 판단을 다시 확인하여 명확한 공격만 기본 15분 만료와 근거 경보 번호가 있는 메모리 거부 규칙으로 등록하고, block·alert를 기본 `xdr/alerts.log`에 원문·주소·계정 없이 한 줄씩 기록합니다. `checkAccess(request, inspectedAlert)`는 기존 판정기를 먼저 호출해 deny·step_up을 유지하고, allow인 요청에 신뢰된 별도 경보 검사를 추가하는 로컬 연결입니다. 정상 이벤트는 같은 출발 주소여도 거부하지 않습니다. 검사 경보가 없으면 미검사 오류로 거부합니다. 공식 요청·응답 계약과 기존 판정기 규칙은 변경하지 않았습니다.

`node --test --test-isolation=none test/persistence-connection.test.mjs`의 4개 시험으로 공격 거부·애매한 알림·정상 허용·같은 주소 정상 허용·기존 거부 및 추가 확인 유지·만료·위조 결과 거부·외부 등록 확인 처리·독립 실행을 확인했습니다. 운영 ZTNA 등록은 `installDenyRule` 연결점만 제공하며 실제 등록 API·자료 API·운영 엔진 호출 연결은 미실행입니다. 따라서 실제 PC 전체 접속 격리를 완료한 상태는 아닙니다. 메모리 규칙은 재시작하면 사라지며 운영 연결 시 신뢰된 경보와 기기 연결 확인이 필요합니다.

설정 step 12, 저장소 주소, 배포 주소, 로그인 발급자·JWKS·대상, 허용 경로, 원본 API를 기존 구현·README·Git 원격과 대조했습니다. 기존 RULE_IDS 여섯 개는 구현되어 있으며 설정과 운영 측 judgeIssuer를 유지합니다. 현재 원격 배포 상태 확인·배포·bundle 자기 점검·심판 판정은 이번 작업에서 미실행입니다. 알림 로그, bundle-notes.json, artifacts/submission.json은 커밋에서 제외합니다.

## 보너스 xdr-03 저장점

### 심판 피드백에 따른 애매한 경보 분류 수정

`adf2b87`의 심판 피드백은 `X03_AMBIGUOUS_NOT_ALERT`와 `X03_RECORD_MISMATCH`였습니다. 이전 구현은 애매한 경보 일곱 건을 record로 내려 알림 1건·기록 15건이 되었습니다. T1190 맥락에서 취약점 관련 약한 흔적을 명시한 경보는 단독 차단 없이 alert로 남기는 패턴을 추가했습니다. 2026-10-14 재실행은 block 8·alert 8·record 8이며 정상 이벤트 차단은 0건입니다. 응답 모듈 시험은 차단 후보 알림 8줄과 애매한 시도 알림 8줄을 확인했고 정상 이벤트에는 알림·거부 규칙을 만들지 않습니다. 아래 8·1·15 결과와 패턴 네 개 설명은 이전 저장점 기록입니다. 현재 패턴은 다섯 개이며 심판 재판정은 아직 확인하지 않았습니다.

`xdr/known-cve/read-alerts.mjs`는 가상 경보의 다섯 항목만 읽고 비밀값처럼 보이는 문자열을 가립니다. `patterns.json`의 CVE-2021-44228·MITRE ATT&CK T1190 근거 패턴 네 개를 독립적인 `decide.mjs`에 옮겼으며, 완전한 원격 JNDI 조회는 block, 불완전한 조회·명시적 점검 흔적은 alert, 단순 단어·정상 이벤트는 record로 처리합니다. 판단 모듈은 다른 파일·패키지·네트워크·파일 쓰기를 사용하지 않습니다.

`respond.mjs`는 차단 후보에 근거 경보 번호와 기본 15분 만료를 붙여 프로세스 메모리에 저장하고, `matchingDenyRule`로 만료와 현재 공격 형태를 다시 확인합니다. 같은 출발 주소의 정상 요청만으로는 차단하지 않습니다. 알림은 기본 `xdr/alerts.log`에 식별값·공격 원문 없이 기록합니다. 외부 등록 연결점 `installDenyRule`은 준비했지만 운영 ZTNA 등록 API 연결은 미실행입니다. 기존 `src/decider.mjs` 규칙과 요청·응답 계약은 그대로 유지하며, 프로세스 재시작 후 메모리 규칙은 다시 등록해야 합니다.

제작 4 보완의 `checkAccess(request, inspectedAlert)`는 기존 ZTNA 판정기를 실제로 호출하는 로컬 결합 함수입니다. 기존 deny·step_up을 유지하고, allow일 때 별도로 전달된 검사 경보를 XDR 판단·응답 처리에 연결해 명확한 공격만 deny로 바꿉니다. 검사 경보가 없으면 미검사 상태로 거부합니다. 공식 요청에 새 필드를 넣지 않으며 반환은 로컬 결합 결과이므로 운영 엔진 응답으로 제출하지 않습니다. `node --test --test-isolation=none test/known-cve-connection.test.mjs`로 공격 거부·정상 허용·동일 주소 정상 허용·추가 확인 유지·만료·알림을 확인합니다. 운영 엔진과 자료 API는 이 함수를 아직 호출하지 않으며, 운영 배포·차단은 미실행입니다.

저장소 터미널에서 `npm run xdr:run -- known-cve`로 `xdr/known-cve/result.json`을 다시 만듭니다. 2026-10-14 실행 결과는 block 8·alert 1·record 15이며 가상 정상 이벤트 8건의 차단은 0건입니다. 응답 모듈의 별도 로컬 확인은 차단 규칙 8개·알림 1개, 같은 주소의 정상 요청 허용, 만료, 위조된 차단 결과 거부를 확인했습니다. `xdr:run`은 판단 결과만 생성하며 응답 연결·알림 파일 쓰기·운영 차단·심판 판정은 실행하지 않습니다.

설정의 step 12, 저장소·배포 주소, 로그인 발급자, 허용 경로, 원본 API와 구현된 RULE_IDS 여섯 개를 대조했습니다. 현재 배포 식별자 조회는 실패하여 최신 배포 상태는 미확인입니다. 기존 설정과 운영 측 judgeIssuer를 유지하며 이 저장점에서 배포하지 않습니다. 기존 `src/attack-check.mjs`도 유지하고 bundle 자기 점검은 이번 저장점에서 미실행입니다. `bundle-notes.json`, `artifacts/submission.json`과 알림 로그는 커밋에 포함하지 않습니다.

이 저장소는 1단계에서 학생 본인이 GitHub 저장소와 Vercel 배포를 만드는 출발점입니다. 2단계에서 가상 메모를 보호하고, 3단계 「진짜 로그인을 붙입니다」에서 Supabase Auth 로그인과 로그인 사용자용 메모 기능을 연결했으며, 4단계 「로그인해도 내 자료만 보이게 합니다」에서 메모 소유자 검사를 추가했습니다. 5단계 「자료 요청을 서버 한곳으로 모읍니다」에서 로그인과 자료 요청을 Vercel 서버 함수로 모았고, 6단계 「등록한 기기만 자료실에 들어옵니다」에서 등록된 기기만 판정기를 통과하도록 했습니다. 실제 학생 자료, 토큰, 비밀키를 넣지 마세요.

## 학생이 하는 일: 세 걸음

1. GitHub 계정을 만듭니다.
2. 방어전 1단계 카드의 **Deploy** 버튼을 누릅니다. Vercel에 GitHub로 로그인하고, 새 저장소가 **본인 계정의 Public 저장소**인지 확인한 뒤 Deploy를 누릅니다.
3. 배포가 끝나면 화면에 나온 `https://…vercel.app` 주소를 방어전 1단계 카드에 붙여넣고 제출합니다. 저장소 주소나 설정 파일은 적지 않습니다.

배포가 끝나면 `/`에서 점령된 가상 자료실을 볼 수 있습니다. 화면은 Supabase Auth 세션의 access token을 `/api/notes` 서버 함수에 전달하며, `/data.json`에는 메모를 남기지 않습니다. 비로그인 `/api/notes` 요청은 JSON 오류로 거부됩니다. 실제 키는 Vercel 환경변수의 비밀 입력란에만 넣고 브라우저 파일·응답·로그에 넣지 않습니다.

## 시작 틀의 자동 처리

`vercel.json`은 정적 결과물 `public`을 배포하고 `api/notes.js`와 `api/notes/[id].js`를 서버 함수로 제공합니다. 빌드 명령 `npm run build`는 Vercel이 제공하는 GitHub 저장소 소유자·이름, 커밋 SHA, 배포 URL을 검증하고 `public/aleph.json`을 생성합니다. 이 값이 없으면 빌드가 실패하므로, 성공한 것처럼 빈 주소를 내보내지 않습니다. `aleph.json`의 내용만으로 저장소 소유권이나 방어 성공을 인정하지 않습니다. 심판이 공개 저장소의 실제 커밋과 배포된 자료를 따로 대조해야 합니다.

`api/notes.js`와 `api/notes/[id].js`는 `SUPABASE_URL`과 서버 전용 `SUPABASE_SECRET_KEY`를 환경변수에서 읽고 `src/verify-login.mjs`로 요청 토큰을 확인합니다. 목록 GET은 확인된 로그인 사용자의 메모만 반환하고, POST는 그 사용자 ID를 `owner_id`로 저장합니다. 개별 GET·PUT·DELETE도 확인된 사용자 ID와 `owner_id`가 일치할 때만 허용하며, 본문의 `owner_id`는 사용하지 않습니다. 두 환경변수는 Vercel 비밀 입력란에만 넣고 저장소에 기록하지 않습니다.

## 현재 공개 여부 확인

실제 가상 메모 문장은 저장소에 새로 적지 않습니다. 기존에 보관한 임시 SQL Editor `INSERT`에서 제목·본문 네 줄을 복사해 저장소 밖의 임시 파일에 한 줄씩 넣고, 확인이 끝나면 그 파일을 삭제합니다.

GitHub 최신 파일은 다음처럼 확인합니다.

```powershell
$patternFile = Join-Path ([System.IO.Path]::GetTempPath()) 'vault-note-patterns.txt'
git fetch origin --prune
$patterns = Get-Content -LiteralPath $patternFile | Where-Object { $_.Trim() }
$hits = foreach ($pattern in $patterns) { git grep -n -F -- "$pattern" origin/main -- . }
if ($hits) { 'FAIL: GitHub 최신 파일에서 메모 문장이 검색됨' } else { 'PASS: GitHub 최신 파일에서 메모 문장이 검색되지 않음' }
```

현재 Vercel 배포의 정적 공개 파일은 `/data.json`을 대상으로 확인합니다. 3단계와 4단계에서는 비로그인 `/api/notes` 요청도 함께 확인하며, 401 또는 403과 JSON 오류가 나와야 합니다. 정상 로그인 뒤에는 화면에서 자기 메모를 추가·수정·삭제할 수 있고, 다른 사용자의 개별 메모 GET·PUT·DELETE는 거부되어야 합니다.

```powershell
$patternFile = Join-Path ([System.IO.Path]::GetTempPath()) 'vault-note-patterns.txt'
$deployUrl = Read-Host 'Vercel deployment URL'
$patterns = Get-Content -LiteralPath $patternFile | Where-Object { $_.Trim() }
$body = (Invoke-WebRequest -UseBasicParsing "$deployUrl/data.json").Content
$hits = $patterns | Where-Object { $body.Contains($_) }
if ($hits) { 'FAIL: 현재 배포의 data.json에서 메모 문장이 검색됨' } else { 'PASS: 현재 배포의 data.json에서 메모 문장이 검색되지 않음' }
```

`$deployUrl`에는 실제 Vercel 주소를 확인해 넣습니다. GitHub의 과거 공개 커밋·브랜치·태그와 Vercel의 과거 공개 배포 URL도 같은 방식으로 확인합니다. 옛 공개 커밋이나 옛 배포가 남아 있거나 메모 문장을 계속 제공하는 동안에는 과거 노출이 해소됐다고 쓰지 않습니다. 현재 `origin/main`과 현재 배포가 깨끗한 것은 과거 노출 해소의 증명이 아닙니다.

`aleph.config.json`의 현재 제출 준비 `step`은 12이며, `repoUrl`, 실제 `publicAppUrl`, Supabase `identityProvider`, 자료 API `allowedRoutes`, 쿼리 없는 원본 `originalApiUrl`을 기록합니다. `npm run bundle`과 `bundle-notes.json`은 저장점에서만 사용하며, 생성된 `artifacts/submission.json`은 커밋하지 않습니다.

## 4단계 저장점

현재 작동하는 기능은 메모 없는 `/data.json`, Supabase Auth 이메일·비밀번호 로그인·로그아웃, 검증된 Bearer 토큰이 필요한 `/api/notes` 목록·추가 API, 로그인한 자기 메모의 추가·수정·삭제, `GET|PUT|DELETE /api/notes/:id`, `nosniff` 응답 헤더입니다. 목록과 개별 경로는 로그인 사용자의 `owner_id`로 제한하며, 수정 시 기존 행과 갱신 결과의 소유자도 확인합니다. `identityProvider`에는 Supabase 발급자·대상·JWKS 주소를, `allowedRoutes`에는 실제 자료 API 경로를 기록합니다.

로컬 정적 화면은 `npm run build -- --local`로 다시 만들고, 기존 회귀 확인은 `npm run test:r5`와 `npm run test:package`로 수행합니다. 실제 CRUD 확인은 Vercel 배포에서 수행하며, 로컬 정적 실행과 회귀 테스트는 Vercel 배포나 심판 접수를 증명하지 않습니다. `src/attack-check.mjs`는 실제 배포에서 `/data.json`의 비공개 상태와 비로그인 `/api/notes`의 JSON 401/403 거부를 확인합니다. 4단계의 교차 소유자 GET·PUT·DELETE 점검은 `ALEPH_CHECK_OWNER_A_TOKEN`과 `ALEPH_CHECK_OWNER_B_TOKEN`을 공식 비밀 입력란에 넣었을 때만 실제 요청을 보내며, 값이 없으면 미실행으로 남깁니다. `npm run bundle`은 저장점에서만 실행합니다.

## 5단계 최종 저장점

브라우저의 Supabase JS와 공개 키를 제거하고 `/api/auth` 서버 함수가 로그인·로그아웃·세션 확인을 처리합니다. access token과 refresh token은 `HttpOnly; Secure; SameSite=Lax` 쿠키로만 관리하며, `/api/notes`와 `/api/notes/:id`는 쿠키 인증과 기존 Bearer 인증을 모두 지원하고 서버의 로그인·`owner_id` 검사를 유지합니다. production 상태 변경 요청에는 `Origin` 검사를 적용합니다.

`aleph.config.json`은 `step: 5`, 원본 Supabase Data API `originalApiUrl`, `/api/auth`와 `/api/notes` 관련 `allowedRoutes`를 기록합니다. production 커밋 `898fe84`에서 `/aleph.json`은 HTTP 200과 `step: 5`, 루트 응답은 `nosniff`, 원본 Data API의 공개 키 직접 요청은 HTTP 401로 확인했습니다. production 정적 파일에서 Supabase 공개 키·서버 전용 키·seed marker는 검색되지 않았습니다.

로컬 확인은 `npm run build -- --local`, `npm run test:r5`, `npm run test:package`로 수행합니다. bundle과 실제 제출 묶음 생성은 이 저장점 이후 별도로 실행합니다.

## 6단계 저장점

현재 작동하는 기능은 `request.deviceRegistered`가 정확히 `true`인 요청만 `allow`와 `approved`로 허용하는 `device_registered` 규칙입니다. 값이 `false`이거나 없으면 `deny`와 `device_not_registered`로 거부하며, 기존 로그인·소유자 검사·자료 API 기능은 유지합니다. 미등록 기기 공격의 실제 확인은 심판이 맡습니다.

추가로 설치할 접속 프로그램 없이 저장소 루트의 터미널에서 `npm run decider:test`를 실행합니다. 다음 두 줄이 순서대로 나와야 합니다.

1. `통과 · 등록 기기의 정상 요청`: 등록 기기 요청이 `allow`로 처리됩니다.
2. `통과 · 미등록 기기의 가상 요청`: `deviceRegistered: false` 요청이 `deny`와 `device_not_registered`로 처리되는지 확인합니다.

마지막 안내 문구처럼 이 명령은 가상 요청 연습이며 심판 통과 증거가 아닙니다.

## 7단계 저장점

현재 작동하는 기능은 엔진이 전달한 `signals`의 출처·지역·네트워크·시각과 `recentEvents` 형식을 검사하고, 누락되거나 출처가 불명확한 값은 정상값으로 채우지 않고 `signals_unverified`로 거부하는 것입니다. 등록 기기 검사를 유지하며, 평소와 다른 시각·처음 보는 네트워크·대량 읽기 사건이 함께 오면 지역 하나만으로 차단하지 않고 `step_up_required` 추가 확인을 요구합니다. 엔진이 확인한 `stepUp.verified`와 0~900초의 `authAgeSeconds`가 있는 재판정만 허용합니다.

현재 계약에는 같은 로그인 주체의 새 로그인 시각을 자료 API가 확인했다는 운영 연결이 없으므로 실제 자료 차단과 재로그인은 미실행입니다. `npm run fixture:7`은 정상 사건은 `allow`, 복합 이상 사건은 `step_up`인지 확인하고, `npm run decider:test`는 등록·미등록 기기와 재확인 가상 요청을 연습합니다. 두 명령 모두 심판 판정이나 운영 연결 증거가 아닙니다.

## 8단계 저장점

현재 작동하는 기능은 메모 자원과 강사 공지 자원을 서로 다른 `resourceId`로 표시하고, 판정기가 자기 전용 목록 `GET /api/my/notes`와 자료 ID가 있는 `GET /api/notes/:id`, 엔진 경로 모양 `GET /notes/:id`의 서비스·메서드·정확한 경로를 허용하는 것입니다. 모호한 `GET /api/notes`는 소유 구역이 불분명해 거부하며, 공지·강사 자료 경로는 별도 구역으로 식별하지만 판정기에서 명시적으로 거부합니다. 모든 쓰기 요청도 거부하고, 쿼리로 기능을 고르거나 `:id`와 같은 깊이에 `export` 같은 경로를 둘 수 없으며, 그 밖의 알 수 없는 경로는 `resource_path_unrecognized`로 거부합니다. 등록 기기·신호·추가 확인 규칙은 유지됩니다.

자료 API는 검증된 로그인 주체와 저장된 메모 `owner_id` 또는 공지 `instructor_id`를 조회·수정·삭제마다 다시 대조합니다. 요청 본문의 `owner_id`·`role`이나 화면 메뉴는 권한 판단에 사용하지 않으며, 다른 구역 자료의 거부 사유는 메모 `NOTE_NOT_FOUND`(404)와 공지 `ANNOUNCEMENT_FORBIDDEN`(403)으로 짧게 반환합니다. 화면 메뉴는 이번 단계에서 바꾸지 않았습니다. 운영 교차 사용자 시험은 토큰이 없을 때 미실행으로 남기며, 로컬 테스트는 실제 심판 판정으로 보고하지 않습니다.

로컬 판정기 연습은 `npm run decider:test`로 실행합니다. 이 명령은 가상 요청 연습이며 심판 판정이나 실제 운영 API 연결 증거가 아닙니다. 저장점 제출 묶음은 커밋 후 `npm run bundle`로 만들고, `bundle-notes.json`과 `artifacts/submission.json`은 커밋하지 않습니다.

## 9단계 저장점

현재 작동하는 기능은 9단계 가상 사건 계약의 `at`, `method`, `identity.sub`만 입력으로 정규화·검증하고, 같은 가명 주체의 `GET` 사건이 어느 10분 구간에서든 120건을 넘을 때 `{ action: 'propose_revocation', reasonCode: 'burst_read', subject }`를 반환하는 것입니다. 정확히 120건, 다른 주체의 사건 합산, 10분 밖으로 분산된 사건은 탐지하지 않으며 네트워크·기기 등 계약 밖의 필드는 읽지 않습니다. 회수 API와 실제 권한 변경은 연결하지 않았고, 입력의 메모 내용·토큰·실명은 저장하거나 출력하지 않습니다.

저장소 루트에서 `npm run detect:test`를 실행해 정상 조회·경계값·사용자 분리·시간 창 가상 사건을 연습합니다. 이 명령은 실제 반 엔진 사건 전달·접속 회수·심판 판정의 증거가 아닙니다. 저장점 제출 묶음은 커밋 후 `npm run bundle`로 만들며, `bundle-notes.json`과 `artifacts/submission.json`은 커밋하지 않습니다.

## 10단계 제작 1~2 실습용 정책 기준본과 복원 사전 확인

`policy-baseline/`은 `f780b661665ad8a33c134035acf06699e46b8f0f`에서 추출한 7개 정책·계약 파일과 SHA-256 매니페스트입니다. 로컬 시험 결과와 원본 커밋 내용을 다시 확인한 뒤 생성했으며, 침해 이전에 보관된 백업이나 운영 복구 자료가 아닙니다.

`npm run policy:baseline -- compare`는 기준본 디렉터리·매니페스트·7개 파일의 SHA-256과 원본 커밋을 먼저 검증한 뒤, 기준본과 현재 시험 정책의 변경 파일·항목만 출력합니다. `restore-preview`도 같은 사전 확인만 수행합니다. 기준본이 없거나 검증에 실패하면 비교와 복원을 중단합니다.

`npm run policy:baseline -- restore --confirm <원본 커밋 전체 해시>`는 미리보기 뒤 대화형으로 `RESTORE`를 다시 입력해야만 시험 정책 범위의 변경 파일을 복원합니다. 운영 정책·Supabase·Vercel·자료·감사 기록은 대상이 아니며, 실제 복원은 이 저장점에서 실행하지 않았습니다. `npm run policy:restore-check`는 A의 정상 판정과 B의 A 자료 소유자 불일치 거부를 로컬 fixture로 확인하며, 실제 API·Supabase 교차 사용자 시험은 미실행입니다.

2026-10-13 로컬 확인 결과: 기준본 SHA-256·원본 커밋 검증 통과, `compare`와 `restore-preview`에서 변경 파일·항목 0개, `policy:restore-check`에서 A 정상 요청 `allow`·B의 A 자료 소유자 검사 `deny`, 기존 8단계 정책 시험 8/8 통과, 복원 실행은 미실행입니다. 운영 API·Supabase·Vercel·심판 판정 시험과 제출 묶음 생성도 미실행입니다.

### 10단계 제작 3: 단일 실습 메모 복원

현재 저장소에는 검증된 운영 메모 사본이 없으므로 `practice-restore/`에 생성 시각과 `f780b661665ad8a33c134035acf06699e46b8f0f`를 출처로 적은 synthetic B 메모 한 건만 보관합니다. 이것은 침해 이전 백업이나 실제 학생 자료가 아닙니다. 매니페스트의 고정 ID·B 소유자·`UTF-8 JSON.stringify({title,content})` SHA-256을 서버가 매 요청마다 다시 확인합니다.

서비스 이름은 `note_restore`, 복원 POST 경로는 `POST /api/restore/notes/:id`입니다. 서버는 Supabase 인증 principal이 학생 B인지 확인하고, 고정된 B 메모 ID·빈 요청 본문·동일 소유자 행만 대상으로 삼습니다. 쓰기 후에도 ID·소유자·내용 SHA-256을 다시 대조하며, 다른 메모·다른 소유자·공지·운영 정책은 대상이 아닙니다.

`npm run policy:restore-check`는 로컬 fixture에서 A의 정상 판정과 B가 A 메모를 소유하지 못하는 결과를 확인합니다. 실제 복원 POST, Supabase 데이터 변경, Vercel 배포, 운영 교차 사용자 시험은 미실행입니다.

### 10단계 제작 4: 복원 후 1~9단계 회귀 확인 순서

정책 기준본 복원과 메모 복원을 승인해 실행한 뒤에는 아래 순서로 기존 방어 기능을 다시 확인합니다. 복원 전·후의 기준본과 메모 사본 검증이 먼저이며, 복원 대상 외의 자료와 감사 기록은 확인 과정에서 수정하지 않습니다.

1. 정책·사본 검증: `npm run policy:baseline -- compare`로 기준본 매니페스트·7개 정책 파일·원본 커밋의 SHA-256을 확인하고, `node --test test/practice-note-restore.test.mjs`로 실습용 메모 사본의 ID·소유자·내용 해시와 복원 권한 경계를 확인합니다. 정책 복원 후에는 같은 `compare`를 다시 실행해 예상하지 않은 정책 변경이 없는지 확인합니다.
2. 기존 로컬 회귀: `npm run build -- --local`, `npm run test:r5`, `npm run test:package` 순서로 정적 빌드·배포 식별자·패키지 기준표를 확인합니다. 이 명령들은 로컬 확인이며 운영 배포나 심판 판정을 증명하지 않습니다.
3. 6단계 등록 기기: `npm run decider:test`에서 등록 기기 정상 요청이 `allow`·`approved`, 미등록 기기 요청이 `deny`·`device_not_registered`인지 확인합니다.
4. 7단계 접속 신호와 추가 확인: `npm run fixture:7`에서 정상 신호 요청이 `allow`, 평소와 다른 시각·네트워크·대량 읽기가 결합된 요청이 `step_up`인지 확인합니다. 실제 엔진의 신호 전달·재로그인·권한 변경은 별도 운영 계약이 없어 미실행입니다.
5. 8단계 자료 경로·소유자: `node --test test/stage8-resource-policy.test.mjs`에서 자기 자료 경로는 허용되고, 모호한 목록·공지 구역·쓰기·알 수 없는 경로는 거부되는지 확인합니다. 실제 A 토큰으로 정상 자료 요청을 허용하고 B 토큰으로 A 자료 GET·PUT·DELETE를 거부하는 교차 사용자 시험은 미실행입니다.
6. 인증 없는 요청: 실제 배포 주소의 `/api/notes`에 인증 없이 요청해 JSON `401` 또는 `403`으로 거부되는지 확인합니다. 현재 저장소에서는 운영 주소에 이 요청을 다시 보내지 않았으므로 미실행입니다.
7. A·B 복원 후 자료 확인: 공식적으로 확인된 A·B 인증과 복구 대상 매핑이 제공된 경우에만, A의 정상 자료 요청 허용 → B의 A 자료 접근 거부 → 인증 없는 요청 거부 순서로 확인합니다. 현재 제작3의 synthetic B UUID는 실제 Supabase 시험 계정 B와 연결되지 않았고 심판 B 매핑도 미확인하므로, 복원 POST와 이 운영 시험은 미실행입니다.
8. 9단계 이상 탐지: `npm run detect:test`에서 정상 조회, 120건 경계, 사용자 분리, 10분 창 분리를 확인하고 120건을 초과한 같은 주체의 조회에만 `propose_revocation`이 나오는지 확인합니다. 실제 반 엔진 사건 전달·접속 회수·심판 판정은 미실행입니다.

현재까지 실행한 로컬 확인은 제작1~3에 기록된 기준본 비교, 정책 복원 fixture, 패키지·배포 식별자·8단계 경로·메모 사본 단위 시험과 `decider:test`, `fixture:7`, `detect:test`입니다. 위 순서 중 실제 정책 복원, 실제 메모 복원 POST, Supabase 데이터 확인, A/B 교차 사용자 요청, 인증 없는 배포 요청, 운영 신호·기기·탐지 연동은 미실행입니다.

10단계 제출 준비에서 실제로 확인한 범위는 기준본 SHA-256·원본 커밋 검증, 정책 복원 미리보기, `node --test test/practice-note-restore.test.mjs`의 로컬 복구 사본·권한 경계 시험입니다. 실제 정책 복원, 실제 메모 복원 POST, 심판 인증, 운영 공격 차단은 성공으로 기록하지 않으며 모두 미실행입니다.

제작3의 미해결 사항도 유지합니다. `practice-restore/`는 실제 침해 전 백업이 아닌 synthetic 자료이며, 심판 B 계정과 실제 Supabase 소유자·메모 ID의 공식 매핑이 없습니다. 제출 설정은 `step: 10`, 기존 3개 허용 경로를 유지한 `POST /api/restore/notes/:id` 추가, `restoreRoute: "POST /api/restore/notes/:id"`로 실제 `api/restore/notes/[id].js` 경로와 일치시켰습니다. 다만 이 표기가 공식 심판 제출 형식인지 여부는 여전히 미확인입니다. 공식 계약이 확인되기 전에는 고정 UUID를 실제 계정으로 간주하거나 운영 복원을 실행하지 않습니다.

## 11단계 저장점

현재 작동하는 기능은 설치형 웹앱 `manifest.webmanifest`와 온라인·오프라인 안내, 로그인한 사용자의 기기 승인 요청·상태 확인 화면입니다. 서버는 HttpOnly 기기 식별 쿠키와 Supabase `vault_devices` 등록부를 대조하며, 승인 요청 버튼은 `pending`만 만들고 `approved` 권한을 직접 만들지 않습니다. `approved` 상태를 서버가 확인하기 전에는 메모 목록·메모 편집 영역을 표시하지 않고, `/api/notes`, 개별 메모, 공지 수정, 복원 경로도 `DEVICE_NOT_APPROVED`로 거부합니다. 기기 개인키와 승인 토큰은 브라우저 저장소에 넣지 않습니다.

Supabase SQL Editor에서 `supabase/vault_notes.sql`의 `vault_devices` 테이블 정의를 적용한 뒤, 운영 등록부에서 승인된 기기의 행만 `status = 'approved'`로 관리해야 합니다. 실제 DB 마이그레이션·기기 승인·Vercel 재배포는 이 저장점에서 실행하지 않았습니다. `aleph.config.json`에는 기존 실제 배포 주소·Supabase 발급자·심판 발급자·원본 API 주소를 유지하고 `GET|POST /api/device-approval` 경로를 추가했습니다.

로컬 재확인은 `npm run build -- --local`, `node --test test/device-approval.test.mjs`, `node --test test/stage8-resource-policy.test.mjs`, `npm run test:r5`, `npm run test:package` 순서로 실행합니다. `npm run decider:test`는 가상 요청 연습이며 심판 판정이 아닙니다. 커밋 후 `npm run bundle`을 실행하며, `bundle-notes.json`과 `artifacts/submission.json`은 커밋하지 않습니다.

## 보너스 xdr-01 저장점

`xdr/brute-force/read-alerts.mjs`는 원본 경보에서 시각·출발 주소·계정·규칙 수준·설명만 읽고, `patterns.json`과 `decide.mjs`는 MITRE ATT&CK T1110 근거의 두 무차별 대입 패턴을 판정합니다. `decide.mjs`는 판단만 반환하며, `respond.mjs`는 차단 후보에만 15분 만료·근거 경보 번호가 있는 ZTNA 거부 규칙 후보를 만들고 `xdr/alerts.log`에 민감한 식별값 없이 한 줄 알림을 남깁니다. 기존 `src/decider.mjs` 규칙은 변경하지 않습니다.

경보 결과 묶음은 저장소 루트에서 `npm run xdr:run -- brute-force`로 다시 만들며 `xdr/brute-force/result.json`에 기록합니다. 이 로컬 실행 결과는 심판 판정이나 운영 연결 증명이 아닙니다.

## 12단계 제작 3: 설치·실행·중지·복구 안내

2026-10-14에 확인한 기준 커밋은 `fdc764d531cb11d0097ac441ea4984cc22ac42a4`(「11단계 설정 정정: 판정기 허용 경로 반영」)입니다. 현재 12단계 제작 1~2의 작전실 화면·요약 API·조회 실측 절차는 이 커밋 위의 미커밋 변경입니다. 아래 안내도 아직 저장점 커밋 전이며, 기준 커밋만 새로 받으면 작전실 기능은 포함되지 않습니다. 재현 전에 `git log -1`과 `git status --short`로 실제 검사 대상 커밋과 추가 변경을 함께 확인하세요.

제작 3 확인 당시 설정은 `step: 11`이었으며, 이번 저장점에서 `step: 12`로 올렸습니다. 마지막 커밋은 판정기의 `allowedRoutes`를 `GET /api/my/notes`, `GET /api/notes/:id`, `GET /notes/:id`로 정정했습니다. 위 10·11단계 기록에서 복원·기기 승인 경로를 허용 경로에 추가했다고 적은 부분은 당시 기록이며 현재 설정과 다릅니다. `restoreRoute`는 별도 항목으로 남아 있습니다. 기기 승인·작전실 서버 함수의 존재가 판정기 허용 경로에 추가됐다는 뜻은 아닙니다. 12단계 번호 변경·커밋·bundle 결과는 아래 저장점 기록과 실제 생성 파일을 확인합니다.

### 출처와 실행 범위

| 구성 | 출처·학생 몫 | 실행 범위 |
|---|---|---|
| 제공 엔진 | **ALEPH SDP 엔진 사용**. 요청 계약의 출처는 `student-kit/sdp-core/decision-contract.mjs`이며 이 저장소에서는 `docs/DECIDER_REQUEST.md`로 설명합니다. | 엔진 배포본·설치 프로그램·운영 시작/중지 명령은 이 저장소에 없습니다. 공식 제공 환경에서 운영자가 관리합니다. |
| 학생 판정기 | `src/decider.mjs`의 등록 기기·신호·추가 확인·경로·구역·쓰기 거부 규칙 | `decide(request)`를 호출하는 로컬 가상 시험. 운영 엔진 연결은 별도 확인해야 합니다. |
| 학생 탐지 규칙 | `src/detect.mjs`의 같은 주체·10분·120건 초과 탐지 | 로컬 가상 사건 입력과 회수 제안만 구현했습니다. 사건 전달·실제 회수 집행은 미연결입니다. |
| 접속 앱·자료실 | `public/index.html`, `public/manifest.webmanifest`, `api/`의 로그인·소유자·기기 승인 검사 | 브라우저 설치형 웹앱, Vercel 서버 함수, Supabase Auth·등록부·자료 DB를 사용합니다. 별도 SDP 클라이언트 설치본은 아닙니다. |
| 학생 작전실 | `api/operations-summary.js`, `src/operations-summary.mjs`, `src/operations-checks.mjs` | 가린 요약과 단계별 확인표를 표시하고 실제 GET 응답 상태만 기록합니다. 공식 41종 시험·심판 결과와 구분합니다. |
| 학생 복구 도구 | `scripts/policy-baseline.mjs`, `src/practice-note-restore.mjs` | 검증된 실습 정책 기준본과 synthetic 메모 한 건의 복구 범위만 제공합니다. 운영 백업을 제공하지 않습니다. |

### 설치와 설정

1. 제출 전 확정한 저장점 커밋을 새 폴더에 받아 `git log -1`, `git status --short`로 버전을 확인합니다. 아직 이 안내에는 12단계 저장점 해시가 없습니다. 기존 폴더의 변경이나 DB 자료를 지우지 마세요.
2. Node.js 22 이상과 npm을 준비하고 저장소 루트에서 `npm install`을 실행합니다. 현재 폴더의 로컬 시험 통과와 새 복제본의 설치 성공은 별개입니다. 새 복제본 설치는 이번 단계에서 미실행입니다.
3. Vercel 프로젝트에 저장소를 연결합니다. `vercel.json`의 빌드 명령은 `npm run build`, 공개 폴더는 `public`입니다. 일반 빌드는 Vercel의 Git·커밋·배포 식별자가 필요합니다. `npm run build -- --local`은 그 식별자를 만들지 않는 로컬 빌드이며 서버 함수나 운영 배포를 시작하지 않습니다.
4. 환경변수 `SUPABASE_URL`(프로젝트 주소), `SUPABASE_SECRET_KEY`(서버 인증·DB 조회)를 공식 Vercel 설정 화면에 입력합니다. 로그인용 키를 분리할 경우 `SUPABASE_AUTH_KEY`를 사용하며, 코드의 선택 순서는 `SUPABASE_AUTH_KEY` → `SUPABASE_ANON_KEY` → `SUPABASE_SECRET_KEY`입니다. 실제 값은 공식 비밀 입력란에 직접 넣고 코드·로그·Git·제출 묶음에는 넣지 않습니다.
5. Supabase에서 기존 테이블과 권한을 확인합니다. 새 실습 DB에만 `supabase/vault_notes.sql`의 테이블·RLS·권한 정의를 검토해 적용합니다. 기존 DB의 자료를 초기화하지 않습니다. 실제 DB 적용과 승인 관리는 이번 단계에서 미실행입니다.
6. 설정의 `publicAppUrl`·로그인 발급자·원본 API 주소를 실제 프로젝트와 대조한 뒤 배포합니다. `judgeIssuer`는 운영 측이 정한 접수 주소이므로 교체하지 않습니다. 실측 버튼은 설정된 HTTPS 배포 호스트와 현재 호스트가 같을 때만 동작합니다. 다른 Preview 주소에서는 `CHECK_DEPLOYMENT_MISMATCH`로 거부됩니다.

### 실행과 직접 확인

로컬에서는 아래 명령을 순서대로 실행합니다. 각 명령은 끝나면 종료되며 상주 판정기·탐지 서버를 시작하지 않습니다.

```powershell
npm run build -- --local
npm run decider:test
npm run fixture:7
npm run detect:test
node --test --test-isolation=none test/operations-summary.test.mjs test/operations-checks.test.mjs test/device-approval.test.mjs test/stage8-resource-policy.test.mjs test/practice-note-restore.test.mjs test/r5.test.mjs test/package-starter.test.mjs
```

`decider:test`의 정상 요청은 `allow`, 미등록 기기는 `deny`여야 합니다. `fixture:7`의 정상 요청은 `allow`, 복합 이상 요청은 `step_up`이어야 합니다. `detect:test`는 정상·120건 경계에서 `observe`, 같은 주체의 10분 내 120건 초과에서 `propose_revocation`을 확인합니다. 이것은 가상 요청·사건 연습이며 운영 접속 회수나 심판 판정이 아닙니다.

실제 배포에서는 첫 화면 → 로그인 → **기기 승인 요청** 순서로 진행합니다. 요청은 `pending`만 만들며 승인 권한은 운영자가 공식 등록부에서 관리합니다. 서버가 `approved`를 확인한 뒤 자기 메모 목록·편집 영역이 열려야 하며, 승인 전·회수된 기기는 자료 API에서 `403 DEVICE_NOT_APPROVED`로 거부되어야 합니다. 브라우저가 설치 메뉴를 제공하면 **앱 설치** 또는 **홈 화면에 추가**를 선택합니다. 설치는 기기 승인이 아니며 오프라인에서는 서버 확인을 할 수 없습니다.

작전실의 **작전실 새로고침**은 로그인한 현재 기기 상태·규칙 목록·실습 복구 버전을 조회합니다. 탐지·신원 회수·운영 복구는 미실행으로 남아야 합니다. **메모 목록 정상·무인증 조회 실측**은 같은 배포의 `/api/notes`에 인증 포함 GET과 인증 없는 GET을 순서대로 보냅니다. 승인 기기의 정상 요청은 `200`, 무인증 요청은 `401/403`이어야 합니다. 다른 결과는 기대 불일치이며 오류는 통과로 처리하지 않습니다.

확인표의 전송 기록 ID·확인 시각·HTTP 결과를 Vercel 함수 로그의 `operations_checks`와 대조합니다. 대상 서버의 `x-vercel-id`가 있으면 별도 필드에 표시하며 없으면 미제공입니다. 요약은 `operations_summary` 기록과 대조합니다. 로그와 표에는 응답 본문·메모·인증값을 남기지 않습니다. 실측 결과는 현재 화면과 서버 로그에만 있으며 화면 새로고침·로그아웃 후에는 화면 기록을 지웁니다. 나머지 단계 시험은 공식 계정·대상·운영 연결을 확인한 뒤 별도로 수행하며 22행 절차를 공식 41종 통과 수로 환산하지 않습니다.

### 중지

실행 중인 로컬 시험은 터미널에서 `Ctrl+C`로 중지할 수 있습니다. 접속 앱은 **로그아웃** 후 창을 닫고, 설치 앱 제거는 브라우저의 앱 관리에서 수행합니다. 현재 로그아웃은 이 브라우저의 세션 쿠키를 지우는 동작이며 모든 신원의 접속을 회수하는 기능은 아닙니다. 자료 접근 중지가 필요하면 운영자가 공식 기기 등록부에서 해당 기기를 `revoked`로 관리하고 다음 자료 요청의 `403`을 확인합니다. 이미 화면에 전달된 자료가 원격으로 삭제된다고 보장하지 않습니다.

서비스 전체 중지는 Vercel 공식 관리 화면에서 프로젝트에 제공되는 배포 접근 제한 기능을 적용하고 실제 URL의 접근 거부를 확인합니다. 이 저장소에는 운영 서비스 종료용 CLI가 없습니다. 제공 ALEPH SDP 엔진의 중지는 운영자의 공식 절차를 사용하며, DB나 감사 기록을 삭제하는 방식으로 중지하지 않습니다. 위 운영 조치는 이번 단계에서 실행하지 않았습니다.

### 복구와 재검증

1. 먼저 `git status --short`와 `git diff`로 이번 단계 변경과 다른 변경을 구분하고 복구 시 사라질 내용을 확인합니다. 기준 커밋 해시만 믿고 모든 변경을 덮어쓰지 않습니다. DB 자료·다른 작업·감사 기록을 보존합니다.
2. 앱 배포 문제는 공식 Vercel 화면에서 **실제로 정상 동작을 확인한 배포**를 선택해 제공되는 롤백 절차를 사용합니다. 로컬 기준 커밋이 운영 정상 배포라는 증거는 아닙니다. 코드 복구는 이번 단계의 파일별 변경을 확인받은 뒤 적용하며 `git reset --hard`를 사용하지 않습니다.
3. 시험 정책 복구는 `npm run policy:baseline -- compare` 다음 `npm run policy:baseline -- restore-preview`로 매니페스트·해시·원본 커밋과 복구 범위를 검증합니다. 기준본 `f780b661665ad8a33c134035acf06699e46b8f0f`는 실습용이며 12단계 앱 롤백 기준이 아닙니다. 설정도 복구 범위에 들어 있으므로 단계를 낮추거나 경로를 바꾸는 차이를 반드시 검토합니다.
4. 시험 정책 복구를 승인한 경우에만 `npm run policy:baseline -- restore --confirm f780b661665ad8a33c134035acf06699e46b8f0f`를 실행하고, 표시된 범위를 확인해 `RESTORE`를 입력합니다. 이 명령은 정책 파일을 실제로 쓰므로 단순 확인 명령으로 실행하지 않습니다. 복구 후 `compare`와 `npm run policy:restore-check`를 다시 실행합니다.
5. 메모 복구는 실습 사본의 고정 대상·소유자·내용 해시를 검증합니다. 실제 Supabase B 계정·메모와 synthetic 대상의 공식 매핑이 없으므로 운영 복구 POST는 현재 실행하지 않습니다. `node --test --test-isolation=none test/practice-note-restore.test.mjs`는 로컬 사본 검증일 뿐 실제 DB 복구가 아닙니다.
6. 복구 후 위 로컬 실행 순서와 10단계의 운영 회귀 확인 순서를 반복합니다. 실제 API에서 정상 허용과 금지 거부를 모두 기록하고, 복구 버전·커밋·시각을 대조한 뒤 사용을 재개합니다. 사건 전달·신원 회수·41종 총공세는 운영 증거를 확보하기 전까지 미실행입니다.

12단계 제작 1~2에서 실행한 로컬 확인은 작전실·실측 절차·기기 승인·패키지·배포 식별자 시험 15개, 로컬 빌드, 화면 스크립트 구문 검사입니다. 실제 배포·설치·로그인·GET 실측·DB 변경·회수·복구·새 복제본의 `npm install`·41종 시험은 이번 단계에서 미실행입니다. 제출물에는 비밀번호·토큰·개인키·서버 전용 키·실명·메모 본문을 넣지 않으며 `bundle-notes.json`과 `artifacts/submission.json`은 커밋하지 않습니다.

제작 3에서 안내와 구현을 대조한 뒤 로컬 빌드, `decider:test`·`fixture:7`·`detect:test`의 가상 연습, 위 7개 시험 파일의 26개 로컬 시험을 실행해 통과했습니다. `git diff --check`도 통과했습니다. 운영 시험·설치·중지·복구를 실행한 결과는 아닙니다.

## 12단계 저장점

이 저장점은 작전실 요약, 1~11단계 정상·금지 요청 22행의 확인 절차, 정상·무인증 GET 실측 버튼, 설치·실행·중지·복구 안내를 포함합니다. 학생 판정기·탐지 규칙과 제공 ALEPH SDP 엔진의 출처를 구분하고 운영 사건·회수·복구·공식 41종 결과가 없으면 미실행으로 표시합니다. 규칙 목록은 기존 구현된 6개를 그대로 사용하며 메모 본문을 작전실 응답·기록에 넣지 않습니다.

제출 설정은 `step: 12`이며 기존 배포 주소·Supabase 발급자·원본 API·3개 판정 허용 경로·별도 복원 경로를 구현과 대조해 유지했습니다. 운영 측 `judgeIssuer`도 유지했습니다. 2026-10-14에 실제 배포 `/aleph.json`은 HTTP 200, `step: 11`, 커밋 `fdc764d531cb11d0097ac441ea4984cc22ac42a4`로 확인했습니다. 따라서 이 저장점의 새 코드가 배포됐다고 기록하지 않습니다.

다시 실행하는 순서는 `npm install` → `npm run build -- --local` → 위 로컬 확인 명령 → Vercel 배포 → 로그인·기기 승인 확인 → 작전실 새로고침·GET 실측입니다. 새 복제본 설치와 운영 배포는 미실행이며 실제 비밀값은 공식 설정 화면에서 입력합니다. 저장점 검증으로 27개 로컬 시험·로컬 빌드·diff 형식 검사가 통과했습니다.

커밋 제목은 「12단계 저장점」입니다. 정확한 해시는 커밋 후 `git log -1`과 제출 JSON의 `commit`으로 확인합니다. 위 제작 3의 미커밋 설명은 당시 검사 시점의 기록입니다. 커밋 후 `npm run bundle`을 실행해 `artifacts/submission.json`을 만들며 `bundle-notes.json`과 생성 JSON은 커밋하지 않습니다. 자기 점검은 현재 배포의 정적 파일·무인증 자료/기기/작전실 조회 실제 응답만 기록하고, 정상 승인·타인 자료·회수·복구 후 공격·공식 41종은 증거가 없으면 미실행으로 남깁니다. 자기 점검 결과는 새 커밋의 배포 증명이나 심판 판정이 아닙니다.

### 12단계 실행 기록 대조 정정

`bdcaedd` 제출의 심판 피드백은 직접 조회 4건의 `attackId` 요청 기록이 없다고 지적했습니다. 배포에 직접 보낸 HTTP 결과는 심판 접수 경로의 실행 기록과 다릅니다. 이를 혼동한 기존 제출 표현을 정정합니다. 12단계 `npm run bundle`의 직접 조회 결과는 커밋하지 않는 `artifacts/stage12-self-check.json`에 출처·확인 시각과 함께 보존합니다. 심판 실행 기록과 대조하지 못한 제출 JSON의 `observed`는 모든 해당 항목에 정확히 `not_run`을 기록합니다. 로컬 GET을 실제로 보냈다는 사실은 별도 자기 점검 파일에서 확인하며 공식 41종 실행·통과로 바꾸지 않습니다.

다시 확인할 때는 `npm run bundle` 후 제출 JSON의 `observed: "not_run"`과 별도 파일의 직접 조회 결과를 구분합니다. 작전실 새로고침·조회 실측 버튼은 기존 기능을 유지합니다. 정상 승인 조회의 `200`과 무인증 조회의 JSON `401/403`은 실제 API 확인 항목이며, 심판에 제출할 실행 기록으로 인정되는지는 공식 요청 계약과 심판 기록을 통해 별도로 검증해야 합니다. 이 정정만으로 12단계 통과나 점수 상승을 보장하지 않습니다.

`5056607`의 심판 재실행은 bundle에서 `path_format`으로 중단됐습니다. 직전에 추가한 자기 점검 저장 경로의 URL 객체를, 기존 bundle과 동일한 `node:path`의 `resolve`·`join` 문자열 경로로 변경했습니다. 이는 파일 경로 호환성 수정이며 `not_run` 표기·실제 조회 결과·화면·정책은 그대로 유지합니다. 심판 환경의 재실행 성공 여부는 재판정으로 확인해야 합니다.

`2789316`의 심판 재실행으로 추가 자기 점검 파일 쓰기가 금지된 것이 확인됐습니다(`S12_BUNDLE_UNSUPPORTED`). 앞서 경로 형식으로 추정한 원인과 별도 파일 보존 안내를 정정합니다. 현재 `src/attack-check.mjs`는 파일을 쓰지 않고 민감정보 없는 직접 조회 요약을 표준 출력으로 남깁니다. bundle이 쓰는 파일은 `artifacts/submission.json` 하나이며 심판 실행 기록을 확인하지 못한 `observed`는 `not_run`을 유지합니다. 기존 자기 점검 파일은 이전 로컬 실행의 기록일 뿐 현재 bundle이 생성하는 파일이 아닙니다. 화면·정책·DB는 변경하지 않습니다.

`fc1d1cc`의 심판 재실행에서는 `console.info is not a function`으로 bundle이 중단됐습니다. 자기 점검에 추가했던 `console.info` 출력도 제거했습니다. 현재 12단계 점검기는 추가 파일이나 콘솔 출력을 만들지 않고 결과만 반환하며, 공식 요청 기록과 대조하지 못한 제출 항목은 `not_run`입니다. 앞선 별도 파일·표준 출력 보존 안내는 이전 수정 시점의 기록입니다. 기존 bundle의 제출 JSON 생성만 유지하며 이 수정의 심판 통과 여부는 재판정 전입니다.

## 다음 단계의 코딩 도구에 전달할 규칙

[AGENTS.md](AGENTS.md)를 먼저 읽히고 한 번에 한 제작 단위만 요청하세요. 2단계부터는 자료 보호를 구현할 때 `public/data.json`을 복사하는 1단계 빌드 흐름도 함께 바꿔야 합니다. 4단계에서는 개별 메모 경로의 소유자 검사를 추가하고, 5단계에서는 원본 API 주소를 기록하며, 6단계 이후 정책 규칙은 해당 단계 원고와 계약에 맞춰 추가합니다. 비밀번호·토큰·서버 전용 키·실제 학생 기록을 코드, Git, 제출 묶음에 넣지 않습니다.

`src/decider.mjs`와 `src/detect.mjs`의 로컬 시험은 반 엔진이나 운영 심판의 결과가 아닙니다. 1단계 이후 제출 묶음 계약 `aleph.defense.submission.v2`는 `scripts/bundle.mjs`에 남아 있으며, 코딩 도구가 해당 단계의 최신 배포 주소와 Git 원격을 맞춘 뒤 사용합니다.
