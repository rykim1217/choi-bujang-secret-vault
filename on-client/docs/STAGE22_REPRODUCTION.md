# 22단계 재현·릴리스 기록

## 최종 기준

| 항목 | 값 |
|---|---|
| 저장소 | `https://github.com/rykim1217/choi-bujang-secret-vault` |
| 브랜치 | `main` |
| 재현 기준 커밋 | `9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62` |
| 새 폴더에서 관찰한 `git rev-parse HEAD` | `9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62` |
| 최종 제출 커밋 | 재현 뒤 이 문서만 갱신해 만든 새 커밋. 제출 화면에는 그 커밋의 실제 40자리 해시를 입력합니다. |
| 앱 패키지 버전 | `on-client/package.json`의 `0.2.11` |
| 확인 시각 | `2026-10-22 16:27:53 +09:00` |

원래 작업 폴더와 Git 기록은 보존했습니다. 이번 재현은 `main`의 위 커밋을 대상으로 새 임시 폴더에서 실제로 수행했습니다. 이후 이 문서만 갱신하므로 재현 기준 커밋과 최종 제출 커밋은 다를 수 있으며, 두 커밋을 하나의 실행 성공으로 합쳐 쓰지 않습니다.

```text
C:\Users\user\AppData\Local\Temp\rayeon-stage22-final-9e8ebf
```

인증·SDP·NativeHost 설정 파일은 복사하지 않았습니다. 최종 커밋에는 제공 런타임과 화면 자산, OSV 스캐너 원문이 포함되어 있습니다.

이 기록을 갱신한 제출 커밋에서는 실행 코드·화면 자산·lockfile은 유지하고, 실행에 사용되지 않는 모듈별 보조 README만 제출 트리에서 제외했습니다. 재현 결과는 실행 코드가 같은 최종 구성이라는 전제에서 기록합니다.

## 재현 기준 커밋과 제출본의 변경 내역

재현은 `9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62`에서 수행했고, 그 결과를 기록한 제출본은 `2778a760705086a6abfceaa4d95aa21d188a70cd`입니다. 두 커밋의 실제 Git 비교 결과는 다음과 같습니다.

```text
$ git diff --name-status 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 2778a760705086a6abfceaa4d95aa21d188a70cd
M       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --stat 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 2778a760705086a6abfceaa4d95aa21d188a70cd
 on-client/docs/STAGE22_REPRODUCTION.md | 40 ++++++++++++++++++++++++----------
 1 file changed, 29 insertions(+), 11 deletions(-)
```

위 비교에서 실행 코드, 화면 자산, `package-lock.json`은 변경되지 않았습니다. `2778...` 이후 이 문서를 다시 갱신하는 커밋이 생기면 그 커밋은 문서 변경만 포함하며, `9e8...`에서 수행한 실행 결과를 새 커밋에서 다시 실행했다고 주장하지 않습니다.

검토 직전 제출본 `350a4195085f3ef77aa5759768fbd2aade2dfc9d`까지 재현 기준 커밋부터 누적 비교한 결과도 확인했습니다.

```text
$ git diff --name-status 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 350a4195085f3ef77aa5759768fbd2aade2dfc9d
M       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --stat 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 350a4195085f3ef77aa5759768fbd2aade2dfc9d
 on-client/docs/STAGE22_REPRODUCTION.md | 55 +++++++++++++++++++++++++++-------
 1 file changed, 44 insertions(+), 11 deletions(-)
```

그 뒤 제출한 `6be1d45727f6786d616a0bbf7c8d08a7f4d136ff`까지의 추가 변경도 확인했습니다.

```text
$ git diff --name-status 350a4195085f3ef77aa5759768fbd2aade2dfc9d 6be1d45727f6786d616a0bbf7c8d08a7f4d136ff
M       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --numstat 350a4195085f3ef77aa5759768fbd2aade2dfc9d 6be1d45727f6786d616a0bbf7c8d08a7f4d136ff
18      0       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --stat 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 6be1d45727f6786d616a0bbf7c8d08a7f4d136ff
 on-client/docs/STAGE22_REPRODUCTION.md | 73 +++++++++++++++++++++++++++++-----
 1 file changed, 62 insertions(+), 11 deletions(-)
```

그 뒤 제출한 `1884c7bde66711ad6ce6f16a509a584eb3ac2400`까지의 추가 변경도 확인했습니다.

```text
$ git diff --name-status 6be1d45727f6786d616a0bbf7c8d08a7f4d136ff 1884c7bde66711ad6ce6f16a509a584eb3ac2400
M       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --numstat 6be1d45727f6786d616a0bbf7c8d08a7f4d136ff 1884c7bde66711ad6ce6f16a509a584eb3ac2400
26      0       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --stat 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 1884c7bde66711ad6ce6f16a509a584eb3ac2400
 on-client/docs/STAGE22_REPRODUCTION.md | 99 ++++++++++++++++++++++++++++++----
 1 file changed, 88 insertions(+), 11 deletions(-)
```

그 뒤 제출한 `35a808ccf0ec84831f409d79150278525b4f633a`까지의 추가 변경도 확인했습니다.

```text
$ git diff --name-status 1884c7bde66711ad6ce6f16a509a584eb3ac2400 35a808ccf0ec84831f409d79150278525b4f633a
M       on-client/docs/STAGE22_REPRODUCTION.md

$ git diff --numstat 1884c7bde66711ad6ce6f16a509a584eb3ac2400 35a808ccf0ec84831f409d79150278525b4f633a
16      2       on-client/docs/STAGE22_REPRODUCTION.md
```

재현 기준과 `6be...`의 실행 코드·제공 화면·설정·잠금 파일이 같은지 확인한 파일 해시는 다음과 같습니다.

| 파일 | `9e8...` | `6be...` |
|---|---|---|
| `on-client/student/extension.mjs` | `d69b8436050734ef03f3b07cd90545e038fa8271` | `d69b8436050734ef03f3b07cd90545e038fa8271` |
| `on-client/public/app.js` | `002bfdf421f0005c14bb98dcbf3d0163f4be091d` | `002bfdf421f0005c14bb98dcbf3d0163f4be091d` |
| `on-client/src/server.mjs` | `42774051fa29614e28f4f823db41fe33942166ed` | `42774051fa29614e28f4f823db41fe33942166ed` |
| `on-client/package.json` | `1a4bd0c7c9f4e2ae335bea28f28926ac015f225f` | `1a4bd0c7c9f4e2ae335bea28f28926ac015f225f` |
| `on-client/package-lock.json` | `757789652fad37f59b50214aea8f3cf983bdc7dd` | `757789652fad37f59b50214aea8f3cf983bdc7dd` |

예제 실행 종료 절차는 `on-client`에서 `node src/server.mjs --demo`를 실행하고 `케셰브 예제: http://127.0.0.1:5189` 출력으로 수신 대기를 확인하는 것입니다. `server.mjs`는 `listen` 뒤 자동 종료하지 않으므로, 같은 PowerShell에서 `Ctrl+C`를 눌러 종료합니다. 이번 직접 확인에서는 Windows 종료 코드 `-1073741510`이 관찰되었고, 재실행은 같은 명령을 다시 입력합니다. 이 기록은 종료 조작과 관찰된 코드를 남긴 것이며, 새 환경에서 서버가 실행했다는 추가 증명은 아닙니다.

기본 설정 예시의 `ON_ENGINE_ADAPTER`는 비워 두었습니다. 제출본에는 `student/engine-adapter.mjs`가 없으므로, 이 예시를 그대로 사용하면 demo 또는 연결 끊김 상태로 시작합니다. 실제 연결은 담당자가 제공한 어댑터 파일을 별도로 받아 절대 경로로 지정해야 하며, 그 파일과 인증·SDP 설정은 제출본에 포함하지 않습니다.

이 문서와 설정 예시를 포함한 다음 제출 커밋은 `on-client/docs/STAGE22_REPRODUCTION.md`와 `on-client/.env.example`만 변경하며, 실행 코드·화면 자산·`package-lock.json`은 유지합니다. 최종 제출 커밋에서의 실제 범위는 다음 명령으로 확인할 수 있습니다.

```powershell
git diff --name-status 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 HEAD
git diff --stat 9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62 HEAD
```

| 확인한 제공 파일 | 역할 |
|---|---|
| `on-client/src/actions/service.mjs` | 보안 조치 상태·AI 설명 연결 |
| `on-client/src/vulnerabilities/project-scan.mjs` | `package-lock.json` 및 설치 메타데이터 대조 |
| `on-client/src/vulnerabilities/osv.mjs` | OSV 조회·결과 정리 |
| `on-client/public/index.html` 및 `public/assets/alekov/*` | 제공 화면·화면 자산 |

## 버전과 지원 범위

- 앱 릴리스 버전은 `on-client/package.json`의 `0.2.11`입니다.
- `package.json`은 Node `24.19.0`을 기준으로 합니다. `tools/start-alekov.ps1`은 Node 22~24를 실행 가능 범위로 검사하고 `v24.19.0`을 권장합니다. 따라서 권장 기준과 실행 허용 범위를 같은 값이라고 쓰지 않습니다.
- `/api/diagnostics` 응답의 `component: "on-client"`, `version: "0.1.0"`은 진단 응답에 기록된 구성요소 버전입니다. 패키지 릴리스 `0.2.11`과 다른 값을 임의로 통일하지 않았으며, 이 기록에서는 두 버전의 의미를 구분합니다.
- 19단계 실제 보안 조치 집행, SDP·XDR·AI·OSV 외부 연결 성공, 운영 인증 및 `v1.0` 자동 인증은 이 기록에서 확인하지 않았습니다.

## 새 환경 재현

재현 기준 커밋을 새 폴더에서 받은 뒤 21단계 설명서의 설치·검사·실행 순서에 맞춰 확인했습니다.

```powershell
git clone --branch main --single-branch https://github.com/rykim1217/choi-bujang-secret-vault.git C:\Users\user\AppData\Local\Temp\rayeon-stage22-final-9e8ebf
Set-Location C:\Users\user\AppData\Local\Temp\rayeon-stage22-final-9e8ebf
git rev-parse HEAD
Set-Location <새-폴더>\on-client
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

직접 확인한 결과:

| 절차 | 관찰 결과 | 확인 구분 |
|---|---|---|
| clone | `main`에서 완료 | 새 폴더 실행 확인 |
| `git rev-parse HEAD` | `9e8ebfcb5cbbbc9a7283a994a2b24732ec8a2c62` | 새 폴더 실행 확인 |
| `node --version` | `v24.19.0` | 새 폴더 실행 확인 |
| `npm --version` | `11.17.0` | 새 폴더 실행 확인 |
| `npm ci --ignore-scripts --no-audit --no-fund` | 성공 | 새 폴더 실행 확인 |
| `npm run check` | `node --check student/extension.mjs` 성공 | 새 폴더 실행 확인 |
| `npm run demo`와 같은 `node src/server.mjs --demo` 실행 | `케셰브 예제: http://127.0.0.1:5189` 출력 후 수신 대기, `Ctrl+C`로 종료·Windows 종료 코드 `-1073741510` 관찰 | 예제 실행·종료 직접 확인 |
| 일반 실행 `-Port 5193 -WaitSeconds 5` | 서버의 `케셰브 연결 확인` 출력 뒤 5초 대기 실패 | 실행 실패 확인 |
| 브라우저·HTTP 200 | 이 기록에서는 확인하지 못함 | 미확인 |

일반 연결 모드는 SDP·NativeHost 등 운영 설정이 없으면 연결 성공으로 표시하지 않습니다. 예제 출력은 실제 시스템 연결 성공이 아닙니다. 종료는 실행 중인 PowerShell에서 `Ctrl+C`, 재실행은 같은 명령을 다시 입력하는 절차입니다. 기존 폴더의 인증·설정 파일을 무작정 복사하지 않았습니다.

## 13~21단계 기능·근거·확인 상태

| 단계 | 기능·결과 | 원문 근거 | 확인 상태 |
|---|---|---|---|
| 13 | 계정·기본 식별 표시 | `student/extension.mjs`의 `renderIdentity` | 코드 확인, 새 브라우저 화면 미확인 |
| 14 | 업무 앱 접근 판정·이유·시각 | `renderDecision` | 코드 확인, 실제 연결 미확인 |
| 15 | 접속 기록/XDR 목록·필터·상세 | `renderEvents` | 코드 확인, 실제 목록 미확인 |
| 16 | 빈 상태·오류·진단·미지원 조치 안내 | `renderStatus` 및 이벤트 상세 | 코드 확인, 실제 버튼 미확인 |
| 17 | AI 연결 점검과 사건 설명 실행 구분 | `renderAiConnection`·`renderExplanation` | 코드 확인, 실제 AI 연결 미확인 |
| 18 | 근거·규칙·현재 상태에 연결된 AI 설명 | `renderExplanation` | 코드 확인, 실제 설명 미확인 |
| 19 | 조치 준비·사람 확인·결과 조회 구분 | 제공 `public/app.js` 및 학생 표시 | 코드 확인, 실제 집행 미확인 |
| 20 | 정확한 설치 버전·OSV 조회 상태 | `renderVulnerabilities`, `project-scan.mjs`, `osv.mjs`, lockfile | 코드 확인, 외부 OSV 미확인 |
| 21 | 실행 설명서·구성도·제공/학생 경계 | `README.md`·`docs/STUDENT_RUNBOOK.md` | 원문 대조, 브라우저 미확인 |

위 표에서 코드 확인은 커밋 원문을 읽은 결과이며, 모의 데이터 성공이나 실제 시스템 연결 성공을 뜻하지 않습니다. 13~21단계의 실제 운영 연결·외부 서비스 결과는 확인하지 않은 항목으로 남깁니다.

## 구성과 제공·학생 경계

이번 최종 커밋의 실행 흐름은 `docs/STUDENT_RUNBOOK.md`의 구성도와 같습니다.

```mermaid
flowchart LR
  B[브라우저\npublic/app.js] -->|HTTP 요청| S[src/server.mjs]
  S --> E[접근 제어·XDR\nsrc/engine*]
  S --> V[vulnerabilities/project-scan.mjs]
  V --> O[vulnerabilities/osv.mjs]
  S --> A[AI 게이트웨이\n제공 연동]
  S -->|서버 응답| C[브라우저의 검증·상태 정리]
  C -->|studentData(kind)| P[student/extension.mjs]
  P -->|DOM 표시| B
```

`src/server.mjs`가 서버 응답을 만들고, 브라우저 `public/app.js`가 검증·상태를 정리한 뒤 `studentData(kind)`를 학생 함수에 전달합니다. 학생 함수가 서버에 직접 요청하거나 OSV·AI에 직접 접속하지 않습니다.

| 구분 | 커밋에서 확인한 범위 |
|---|---|
| 제공 코드 | `public/app.js`, `src/server.mjs`, `src/engine*`, `src/actions/*`, `src/connection/*`, `src/vulnerabilities/*`, 화면 자산 |
| 학생 작성 | `student/extension.mjs`의 DOM 표시 함수 |
| 실행 진입점 | `tools/start-alekov.ps1`, `package.json`의 `start`·`demo`·`check` |
| 문서 | `README.md`, `docs/STUDENT_RUNBOOK.md`, 이 재현 기록 |

## 데이터 보존·복원 계획과 제한

- 원래 작업 폴더·학생 코드·앞 단계 Git 기록·미추적 파일은 보존했습니다. 이번 실행 당시 원본 `git status --short`에서 확인된 미추적 파일은 `alekov-starter-0.2.11.zip`, `make_topic_pngs.py`, `team-topic-1-university-api.svg`, `team-topic-2-forensics.svg`이며, 학생 소스의 미커밋 변경은 확인되지 않았습니다.
- 학생 소스와 Git 기록을 별도로 보존할 때는 원래 폴더에서 다음 순서로 백업합니다. 이 백업 명령 자체는 이번 재현에서 실행하지 않았으며, 절차로만 기록합니다.

  ```powershell
  $project = 'C:\Users\user\Desktop\choi-bujang-secret-vault'
  $backup = 'C:\Users\user\AppData\Local\Temp\rayeon-stage22-backup-9e8ebf'
  New-Item -ItemType Directory -Force -Path $backup | Out-Null
  git -C $project bundle create (Join-Path $backup 'repository.bundle') --all
  git -C $project status --short | Set-Content (Join-Path $backup 'status.txt')
  Copy-Item -LiteralPath (Join-Path $project 'on-client\student') -Destination (Join-Path $backup 'student') -Recurse
  ```

  `status.txt`에 미추적 학생 파일이 따로 기록되면 그 파일만 원래 상대 경로를 유지해 `backup` 아래에 복사합니다. `.env`, 토큰, 비밀번호, API 키와 인증 파일은 복사하거나 백업 묶음에 넣지 않습니다.
- 복원할 때는 `repository.bundle`을 별도 폴더에 clone하고, 백업한 학생 파일을 같은 상대 경로에 복사한 뒤 `git -C <복원 폴더> rev-parse HEAD`, `git status --short`, 필요한 파일의 `Get-FileHash`를 원본 기록과 대조합니다. 해시가 맞지 않으면 실행하지 않고 복원을 중단합니다.
- `src/actions/store.mjs`는 운영자가 명시적으로 제공한 기존 SQLite 파일에 조치·상태·감사 기록을 저장할 수 있습니다. 이번 새 환경 재현에서는 운영 DB를 지정하거나 복사하지 않았습니다. 운영 DB의 백업·복원은 학생 코드가 아니라 담당 운영자가 승인된 저장소 정책에 따라 수행하며, 인증 정보와 DB 원문은 Git이나 제출 문서에 넣지 않습니다.
- `npm ci`와 예제 실행은 새 임시 폴더에서 수행했습니다. 일반 연결 모드의 대기 실패와 브라우저·HTTP 미확인은 성공으로 바꾸지 않았습니다.
- 설명서의 명령·구성도·지원 범위는 현재 최종 커밋의 파일 경로와 대조했습니다. 서버가 이 기록의 명령을 대신 실행했다는 뜻은 아닙니다.
- 22단계 통과는 원문 검토 기준의 수료이며 실제 운영 인증이나 `v1.0` 자동 인증이 아닙니다.
