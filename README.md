# BYTE BACK 방어전 시작 틀 R5

이 저장소는 1단계에서 학생 본인이 GitHub 저장소와 Vercel 배포를 만드는 출발점입니다. 2단계에서는 가상 메모 네 건을 Supabase에 보관하고 Vercel 서버 함수로 읽습니다. 실제 학생 자료, 토큰, 비밀키를 넣지 마세요.

## 학생이 하는 일: 세 걸음

1. GitHub 계정을 만듭니다.
2. 방어전 1단계 카드의 **Deploy** 버튼을 누릅니다. Vercel에 GitHub로 로그인하고, 새 저장소가 **본인 계정의 Public 저장소**인지 확인한 뒤 Deploy를 누릅니다.
3. 배포가 끝나면 화면에 나온 `https://…vercel.app` 주소를 방어전 1단계 카드에 붙여넣고 제출합니다. 저장소 주소나 설정 파일은 적지 않습니다.

배포가 끝나면 `/`에서 점령된 가상 자료실을 볼 수 있습니다. 화면은 `/api/notes` 서버 함수를 호출하며, `/data.json`에는 메모를 남기지 않습니다. 다만 `/api/notes` 자체는 아직 로그인 없이 공개된 주소라 누구나 요청할 수 있다는 약점이 있습니다. 실제 키는 Vercel 환경변수의 비밀 입력란에만 넣고 브라우저 파일·응답·로그에 넣지 않습니다.

## 시작 틀의 자동 처리

`vercel.json`은 정적 결과물 `public`을 배포하고 `api/notes.js`를 서버 함수로 제공합니다. 빌드 명령 `npm run build`는 Vercel이 제공하는 GitHub 저장소 소유자·이름, 커밋 SHA, 배포 URL을 검증하고 `public/aleph.json`을 생성합니다. 이 값이 없으면 빌드가 실패하므로, 성공한 것처럼 빈 주소를 내보내지 않습니다. `aleph.json`의 내용만으로 저장소 소유권이나 방어 성공을 인정하지 않습니다. 심판이 공개 저장소의 실제 커밋과 배포된 자료를 따로 대조해야 합니다.

`api/notes.js`는 `SUPABASE_URL`과 서버 전용 `SUPABASE_SECRET_KEY`를 환경변수에서 읽어 `vault_notes`의 제목·본문만 반환합니다. 두 값은 Vercel 환경변수에 직접 입력하고 저장소에 기록하지 않습니다. 현재 함수에는 로그인·사용자별 접근 제어가 없으므로, 주소를 아는 비로그인 방문자도 같은 자료를 요청할 수 있습니다.

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

현재 Vercel 배포의 정적 공개 파일은 `/data.json`을 대상으로 확인합니다. `/api/notes`는 아직 공개 API라 네 건을 반환하는 것이 정상이며, 이 주소를 검색 성공으로 간주하지 않습니다.

```powershell
$patternFile = Join-Path ([System.IO.Path]::GetTempPath()) 'vault-note-patterns.txt'
$deployUrl = Read-Host 'Vercel deployment URL'
$patterns = Get-Content -LiteralPath $patternFile | Where-Object { $_.Trim() }
$body = (Invoke-WebRequest -UseBasicParsing "$deployUrl/data.json").Content
$hits = $patterns | Where-Object { $body.Contains($_) }
if ($hits) { 'FAIL: 현재 배포의 data.json에서 메모 문장이 검색됨' } else { 'PASS: 현재 배포의 data.json에서 메모 문장이 검색되지 않음' }
```

`$deployUrl`에는 실제 Vercel 주소를 확인해 넣습니다. GitHub의 과거 공개 커밋·브랜치·태그와 Vercel의 과거 공개 배포 URL도 같은 방식으로 확인합니다. 옛 공개 커밋이나 옛 배포가 남아 있거나 메모 문장을 계속 제공하는 동안에는 과거 노출이 해소됐다고 쓰지 않습니다. 현재 `origin/main`과 현재 배포가 깨끗한 것은 과거 노출 해소의 증명이 아닙니다.

`aleph.config.json`의 `repoUrl`은 현재 GitHub 원격과 맞춰 두었습니다. `publicAppUrl`은 실제 배포 뒤에만 채우며, 주소를 모른 채 임의로 만들지 않습니다. 2단계 이후 코딩 도구가 필요한 설정과 보호 기능을 단계별로 작성합니다. `npm run bundle`과 `bundle-notes.json`은 저장점에서만 사용하며, 생성된 제출 JSON은 커밋하지 않습니다.

## 2단계 저장점

현재 작동하는 기능은 메모 없는 공개 `/data.json`, Supabase `vault_notes`를 읽는 공개 `/api/notes` 서버 함수, `nosniff` 응답 헤더, 그리고 이 상태를 확인하는 로컬 테스트입니다. 로컬 정적 화면은 `npm run build -- --local`로 다시 만들고, 실제 배포 주소와 Vercel의 `SUPABASE_URL`·`SUPABASE_SECRET_KEY`를 설정한 뒤 화면과 `/data.json`을 확인합니다. `npm run bundle`은 실제 `publicAppUrl`과 직접 실행한 점검 결과가 있어야 통과합니다.

로컬에서 가상 화면만 확인할 때는 `npm run build -- --local`을 사용합니다. 로컬 실행은 Vercel 배포나 심판 접수를 증명하지 않습니다. 저장소의 `src/attack-check.mjs`는 실제 배포가 된 뒤 `/data.json`을 비로그인으로 요청해 공개 가상 메모의 확인 표시를 읽습니다.

## 다음 단계의 코딩 도구에 전달할 규칙

[AGENTS.md](AGENTS.md)를 먼저 읽히고 한 번에 한 제작 단위만 요청하세요. 2단계부터는 자료 보호를 구현할 때 `public/data.json`을 복사하는 1단계 빌드 흐름도 함께 바꿔야 합니다. 3단계 이후의 로그인, 허용 경로, 5단계의 원본 API 주소, 6단계 이후 정책 규칙은 해당 단계 원고와 계약에 맞춰 추가합니다. 비밀번호·토큰·서버 전용 키·실제 학생 기록을 코드, Git, 제출 묶음에 넣지 않습니다.

`src/decider.mjs`와 `src/detect.mjs`의 로컬 시험은 반 엔진이나 운영 심판의 결과가 아닙니다. 1단계 이후 제출 묶음 계약 `aleph.defense.submission.v2`는 `scripts/bundle.mjs`에 남아 있으며, 코딩 도구가 해당 단계의 최신 배포 주소와 Git 원격을 맞춘 뒤 사용합니다.
