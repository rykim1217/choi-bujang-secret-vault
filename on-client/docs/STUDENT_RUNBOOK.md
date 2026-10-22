# 라요 학생 실행 설명서

## 범위와 실행

학생 `render*` 8개 함수는 입력을 DOM으로 표시합니다. 화면 범위는 계정·기기·현재 세션, 알림·도움정보, 앱 판정, 근거·규칙에 연결된 기록과 AI 참고 설명, 조치 준비·사람 확인·결과 조회입니다. AI 설명은 참고 정보이고 조치를 자동 실행하지 않으며 효과는 결과 조회로 확인합니다. `public/app.js`는 요청·검증·`studentData(kind)`, `src/server.mjs`는 API 라우팅을 제공합니다.

환경은 Windows PowerShell, Node `v24.19.0`, npm `11.17.0`, 앱 `0.2.11`입니다. 작업 폴더는 `C:\Users\user\Desktop\choi-bujang-secret-vault\on-client`, 기본 포트는 `5189`입니다. `public/`, `src/`, `student/`, `tools/`, `docs/`와 `package-lock.json`이 대상입니다.

```powershell
Set-Location "C:\Users\user\Desktop\choi-bujang-secret-vault\on-client"
npm ci --ignore-scripts --no-audit --no-fund
npm run check
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

`npm ci`는 lockfile 일치 여부를 확인하는 설치 준비입니다. HTTP 200과 `케셰브가 켜졌습니다`가 시작 신호이며 브라우저 주소는 http://127.0.0.1:5189/입니다. 포트 변경은 `-Port 5190`, 종료·재실행은 `Ctrl+C` 후 위 명령 재실행입니다. SDP/NativeHost 설정은 담당자 파일만 씁니다. 이 검토에서는 `npm ci`, 서버 기동·브라우저 접속을 실행하지 않았습니다.

## 구성과 경계

```mermaid
flowchart LR
 B[브라우저\npublic/app.js] -->|HTTP| S[src/server.mjs]
 S --> E[접근 제어·XDR\nsrc/engine*]
 S --> V[project-scan.mjs] --> O[osv.mjs]
 S --> A[AI 게이트웨이]
 S -->|응답| B2[브라우저 검증·상태 정리]
 B2 -->|studentData(kind)| P[student/extension.mjs]
 P -->|DOM| B
```

실제 흐름은 브라우저 요청→로컬 서버→연동/스캐너/AI→브라우저 검증·상태 정리→학생 함수→DOM입니다. 서버 응답을 학생 함수에 직접 전달하지 않으며 OSV·AI 직접 접속도 없습니다. 스캐너는 `package-lock.json`, `ON_PROJECT_DIRECTORY`, `ON_APPROVED_PUBLIC_PACKAGES`를 대조합니다.

| 구분 | 실제 경계 |
|---|---|
| 제공 | `public/app.js`, `src/server.mjs`, `src/engine*`, `src/vulnerabilities/*` |
| 학생 | `student/extension.mjs`의 DOM 표시 |

## 장애 확인과 복구

| 상태 | 확인·복구 |
|---|---|
| 시작 실패/포트 사용 | 작업 위치·Node 확인 후 `-Port` 변경 |
| 연결 없음/SDP | 설정 없으면 성공으로 보지 말고 담당자 확인 |
| OSV `not_configured`·`not_checked` | 담당자에게 `ON_PROJECT_DIRECTORY` 절대 경로·`ON_APPROVED_PUBLIC_PACKAGES` 확인; 취약점 없음 아님 |
| OSV `partial`·`unverifiable` | 받은 취약점 ID·`modified`는 유지하고 전체 확인 불가로 해석 |
| AI 실패 | 화면의 안전한 `error.code`·`message` 확인 후 「현재 API 연결 점검」을 직접 누름; 자동 재시도 없음 |
| 조치 `pending`·`unknown`/`ACTION_TIMEOUT` | 실행 반복 금지; 「결과 조회」 버튼으로 `/api/actions/result` 재조회 |

확인: Node/npm 버전 조회. 미확인: `npm ci`, 서버 기동·브라우저 접속, SDP·XDR·AI·OSV·조치.
