# 라요 학생 실행 설명서

이 문서는 로컬 보안 Agent 실행법과 제공 코드·학생 표시 코드의 경계를 적습니다. 비밀번호·토큰·API 키·실제 설정값은 적지 않습니다.

## 목적과 현재 기능

학생 화면은 계정·기기·현재 세션, 업무 앱 접근 판정, 본인 최근 보안 기록/XDR 경보, 설치 패키지 OSV 조회, 앱 내부 AI 연결·사건 설명, 보안 조치 상태를 표시합니다. 학생 구현은 `student/extension.mjs`의 다음 함수입니다.

| 함수 | 입력/표시 |
|---|---|
| `renderIdentity` | `{ me, devices, sessions }`의 계정·기기·세션 |
| `renderDecision` | `{ status, data?, error?, appId }`의 접근 판정 |
| `renderEvents` | `{ status, data?, error? }`의 기록·필터·상세 |
| `renderStatus` | `{ devices, sessions, notifications, diagnostics, mode }` |
| `renderVulnerabilities` | `{ status, mode, data?, error? }`의 정확한 설치 버전·OSV 상태 |
| `renderAiConnection` | AI 연결 점검 상태 |
| `renderExplanation` | `{ event, explanation, checkedAt }`의 참고용 설명 |
| `renderAction` | 조치 준비·접수·효과 관측 상태 |

기록·패키지·설명·조치 표식은 계약의 `data-student-event-id`, `data-student-event-detail`, `data-student-package-name`, `data-student-package-version`, `data-student-explanation-event`, `data-student-action-event`, `data-student-action-request`를 유지합니다. 학생 함수는 서버에 직접 요청하거나 비밀 입력·실제 조치 실행을 추가하지 않습니다.

## 환경과 폴더

실제로 확인한 버전은 Windows PowerShell, Node.js `v24.19.0`, npm `11.17.0`입니다. `on-client/package.json`은 앱 버전 `0.2.11`, Node.js `24.19.0`을 기록하고 `start`, `demo`, `check`를 제공합니다. 기본 포트는 `5189`입니다. 저장소에는 `package-lock.json`이 없고 `.env.example`의 프로젝트 경로·허용 공개 패키지 목록은 비어 있으므로 OSV 조회 완료나 취약점 없음을 가정하지 않습니다.

```text
C:\Users\user\Desktop\choi-bujang-secret-vault\
└─ on-client\
   ├─ package.json · public/app.js · src/server.mjs
   ├─ src/engine.mjs · src/engine/sdp-host.mjs · src/engine/sdp-host-config.mjs
   ├─ src/vulnerabilities/project-scan.mjs · osv.mjs
   ├─ student/extension.mjs · tools/start-alekov.ps1
   └─ docs/STUDENT_RUNBOOK.md
```

## 실행 절차

새 PowerShell 창에서 다음 위치로 이동합니다.

```powershell
Set-Location "C:\Users\user\Desktop\choi-bujang-secret-vault\on-client"
node --version
npm --version
npm run check
```

`npm run check`가 오류 없이 끝나면 학생 파일 문법을 확인한 것입니다. 서버·AI·OSV 연결이나 공식 판정까지 확인한 것은 아닙니다.

기본 실행:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

PowerShell에 `케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요.`가 나오고 HTTP 200 응답이 확인되면 로컬 서버 시작 신호입니다. 브라우저 주소는 [http://127.0.0.1:5189/](http://127.0.0.1:5189/)입니다. `연결 없음`은 로컬 서버 응답과 별개이며 운영 시스템 연결 성공이 아닙니다.

5189가 사용 중이면 기존 프로그램을 종료하지 않고 다음처럼 포트를 바꿉니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5190
```

이때 주소도 `http://127.0.0.1:5190/`으로 바꿉니다. `-SdpHostConfig`와 `-NativeHostConfig`는 담당자가 준 실제 일반 파일의 정규화된 Windows 절대 경로가 있을 때만 사용합니다. 예시 문구·폴더 경로를 넣지 않습니다. 실제 파일이 없으면 옵션 없이 실행합니다. 종료는 서버 창에서 `Ctrl+C`, 재실행은 새 PowerShell에서 같은 위치와 명령을 다시 실행하는 방식입니다. 예제 자료만 보려면 `.	ools\start-alekov.ps1 -Demo`를 사용하지만 실제 연결·성취를 뜻하지 않습니다.

## 시스템 구성도와 경계

```mermaid
flowchart LR
  B[브라우저\npublic/index.html + public/app.js]
  S[로컬 앱 서버\nsrc/server.mjs]
  E[접근 제어·XDR\nsrc/engine.mjs + sdp-host.mjs]
  V[프로젝트 스캐너\nsrc/vulnerabilities/project-scan.mjs + osv.mjs]
  O[OSV 공개 조회\n허용된 공개 패키지만]
  A[AI 게이트웨이 경계\n서버의 /api/ai/check·explain]
  P[학생 표시 함수\nstudent/extension.mjs]
  B -->|HTTP GET/POST| S
  S -->|응답| B
  B -->|검증·상태 정리 후 studentData(kind)| P
  S --> E
  S --> V --> O
  S --> A
  P -->|DOM 반환·표시| B
```

실제 호출 경계는 브라우저 → `src/server.mjs` → 제공 연동/스캐너/AI 경계 → 응답 → `public/app.js`의 검증·상태 정리 → 학생 함수 → DOM입니다. 학생 브라우저가 OSV나 AI에 직접 접속하지 않습니다. `project-scan.mjs`는 `package-lock.json`과 설치 메타데이터·운영자가 허용한 공개 패키지를 대조하고, 허용된 경우 `osv.mjs`를 통해 조회합니다. 서버 경로에는 `/api/me`, `/api/apps`, `/api/events`, `/api/devices`, `/api/sessions`, `/api/access`, `/api/vulnerabilities`, `/api/diagnostics`, `/api/ai/check`, `/api/ai/explain` 등이 있습니다.

| 제공 코드 | 학생 작성 코드 |
|---|---|
| `public/app.js`: 요청, 취소·세대 검사, 응답 검증, `studentData(kind)` 전달 | `student/extension.mjs`: 전달받은 입력을 `createElement`·`textContent`로 표시 |
| `src/server.mjs`: 로컬 API 라우팅과 엔진·스캐너·AI 경계 | 서버 라우트·비밀 입력·조치 POST를 추가하지 않음 |
| `src/engine*`, `src/vulnerabilities/*`: 연결·OSV 상태 제공 | 상태값·원래 ID·확인 불가를 정상으로 바꾸지 않음 |

## 장애와 확인 범위

| 상황 | 확인·복구 |
|---|---|
| 서버 시작 실패/포트 사용 | `on-client` 위치와 Node 버전을 확인하고 `-Port 5190`처럼 직접 다른 포트로 재실행 |
| `연결 없음`/SDP 오류 | 실제 설정 파일이 없으면 성공으로 기록하지 않고 담당자에게 경로 확인 |
| OSV `not_configured`·`not_checked` | 조회 대상·허용 목록 미준비이며 취약점 없음이 아님. 설정을 임의 변경하지 않음 |
| OSV `partial`·`unverifiable` | 받은 취약점 ID·`modified`를 보존하고 전체 확인 불가로 표시 |
| AI 연결/설명 실패 | 오류와 기록·접근 판정을 분리하고 자동 재시도하지 않음 |
| 조치 `pending`·`unknown` | 접수와 실제 효과를 구분하고 성공으로 단정하지 않음 |

확인한 것은 Node/npm 버전, package.json 스크립트·버전, 포트/HTTP 검사, `package-lock.json` 부재, 서버와 학생 함수의 입력 경계입니다. 실제 SDP·XDR·AI 권한, 설정 파일, OSV 결과, 새 PowerShell 재실행 화면, 보안 조치 실행은 확인하지 않았습니다.
