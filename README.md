# BYTE BACK 방어전 시작 틀 R5

이 저장소는 1단계에서 학생 본인이 GitHub 저장소와 Vercel 배포를 만드는 출발점입니다. 2단계에서 가상 메모를 보호하고, 3단계 「진짜 로그인을 붙입니다」에서 Supabase Auth 로그인과 로그인 사용자용 메모 기능을 연결했으며, 4단계 「로그인해도 내 자료만 보이게 합니다」에서 메모 소유자 검사를 추가했습니다. 실제 학생 자료, 토큰, 비밀키를 넣지 마세요.

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

`aleph.config.json`의 `step`은 현재 구현에 맞춰 4이며, `repoUrl`, 실제 `publicAppUrl`, Supabase `identityProvider`, 자료 API `allowedRoutes`를 기록합니다. `npm run bundle`과 `bundle-notes.json`은 저장점에서만 사용하며, 생성된 `artifacts/submission.json`은 커밋하지 않습니다.

## 4단계 저장점

현재 작동하는 기능은 메모 없는 `/data.json`, Supabase Auth 이메일·비밀번호 로그인·로그아웃, 검증된 Bearer 토큰이 필요한 `/api/notes` 목록·추가 API, 로그인한 자기 메모의 추가·수정·삭제, `GET|PUT|DELETE /api/notes/:id`, `nosniff` 응답 헤더입니다. 목록과 개별 경로는 로그인 사용자의 `owner_id`로 제한하며, 수정 시 기존 행과 갱신 결과의 소유자도 확인합니다. `identityProvider`에는 Supabase 발급자·대상·JWKS 주소를, `allowedRoutes`에는 실제 자료 API 경로를 기록합니다.

로컬 정적 화면은 `npm run build -- --local`로 다시 만들고, 기존 회귀 확인은 `npm run test:r5`와 `npm run test:package`로 수행합니다. 실제 CRUD 확인은 Vercel 배포에서 수행하며, 로컬 정적 실행과 회귀 테스트는 Vercel 배포나 심판 접수를 증명하지 않습니다. `src/attack-check.mjs`는 실제 배포에서 `/data.json`의 비공개 상태와 비로그인 `/api/notes`의 JSON 401/403 거부를 확인합니다. 4단계의 교차 소유자 GET·PUT·DELETE 점검은 `ALEPH_CHECK_OWNER_A_TOKEN`과 `ALEPH_CHECK_OWNER_B_TOKEN`을 공식 비밀 입력란에 넣었을 때만 실제 요청을 보내며, 값이 없으면 미실행으로 남깁니다. `npm run bundle`은 저장점에서만 실행합니다.

## 다음 단계의 코딩 도구에 전달할 규칙

[AGENTS.md](AGENTS.md)를 먼저 읽히고 한 번에 한 제작 단위만 요청하세요. 2단계부터는 자료 보호를 구현할 때 `public/data.json`을 복사하는 1단계 빌드 흐름도 함께 바꿔야 합니다. 4단계에서는 개별 메모 경로의 소유자 검사를 추가하고, 5단계에서는 원본 API 주소를 기록하며, 6단계 이후 정책 규칙은 해당 단계 원고와 계약에 맞춰 추가합니다. 비밀번호·토큰·서버 전용 키·실제 학생 기록을 코드, Git, 제출 묶음에 넣지 않습니다.

`src/decider.mjs`와 `src/detect.mjs`의 로컬 시험은 반 엔진이나 운영 심판의 결과가 아닙니다. 1단계 이후 제출 묶음 계약 `aleph.defense.submission.v2`는 `scripts/bundle.mjs`에 남아 있으며, 코딩 도구가 해당 단계의 최신 배포 주소와 Git 원격을 맞춘 뒤 사용합니다.
