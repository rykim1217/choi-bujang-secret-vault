# BYTE BACK 방어전 시작 틀 R5

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

`aleph.config.json`의 현재 제출 준비 `step`은 10이며, `repoUrl`, 실제 `publicAppUrl`, Supabase `identityProvider`, 자료 API `allowedRoutes`, 쿼리 없는 원본 `originalApiUrl`을 기록합니다. `npm run bundle`과 `bundle-notes.json`은 저장점에서만 사용하며, 생성된 `artifacts/submission.json`은 커밋하지 않습니다.

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

## 보너스 xdr-01 저장점

`xdr/brute-force/read-alerts.mjs`는 원본 경보에서 시각·출발 주소·계정·규칙 수준·설명만 읽고, `patterns.json`과 `decide.mjs`는 MITRE ATT&CK T1110 근거의 두 무차별 대입 패턴을 판정합니다. `decide.mjs`는 판단만 반환하며, `respond.mjs`는 차단 후보에만 15분 만료·근거 경보 번호가 있는 ZTNA 거부 규칙 후보를 만들고 `xdr/alerts.log`에 민감한 식별값 없이 한 줄 알림을 남깁니다. 기존 `src/decider.mjs` 규칙은 변경하지 않습니다.

경보 결과 묶음은 저장소 루트에서 `npm run xdr:run -- brute-force`로 다시 만들며 `xdr/brute-force/result.json`에 기록합니다. 이 로컬 실행 결과는 심판 판정이나 운영 연결 증명이 아닙니다.

## 다음 단계의 코딩 도구에 전달할 규칙

[AGENTS.md](AGENTS.md)를 먼저 읽히고 한 번에 한 제작 단위만 요청하세요. 2단계부터는 자료 보호를 구현할 때 `public/data.json`을 복사하는 1단계 빌드 흐름도 함께 바꿔야 합니다. 4단계에서는 개별 메모 경로의 소유자 검사를 추가하고, 5단계에서는 원본 API 주소를 기록하며, 6단계 이후 정책 규칙은 해당 단계 원고와 계약에 맞춰 추가합니다. 비밀번호·토큰·서버 전용 키·실제 학생 기록을 코드, Git, 제출 묶음에 넣지 않습니다.

`src/decider.mjs`와 `src/detect.mjs`의 로컬 시험은 반 엔진이나 운영 심판의 결과가 아닙니다. 1단계 이후 제출 묶음 계약 `aleph.defense.submission.v2`는 `scripts/bundle.mjs`에 남아 있으며, 코딩 도구가 해당 단계의 최신 배포 주소와 Git 원격을 맞춘 뒤 사용합니다.
