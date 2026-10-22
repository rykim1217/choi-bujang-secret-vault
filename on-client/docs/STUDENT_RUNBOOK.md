# 라요 학생 실행 설명서

학생 `render*` 8개 함수는 입력을 DOM으로 표시합니다. `public/app.js`는 요청·검증·`studentData(kind)`, `src/server.mjs`는 API 라우팅입니다. 학생 함수는 서버 요청·조치를 추가하지 않습니다.

환경: Windows PowerShell, Node `v24.19.0`, npm `11.17.0`, 앱 `0.2.11`, 포트 `5189`. 작업 폴더는 `C:\Users\user\Desktop\choi-bujang-secret-vault\on-client`입니다. 원본은 `public/`, `src/`, `student/`, `tools/`, lockfile은 없습니다.

```powershell
Set-Location "C:\Users\user\Desktop\choi-bujang-secret-vault\on-client"
npm run check
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

문법 오류 없음은 학생 파일 확인입니다. HTTP 200과 `케셰브가 켜졌습니다`가 시작 신호입니다. 포트는 `-Port 5190`, 종료·재실행은 `Ctrl+C`입니다. SDP/NativeHost는 담당자 파일만 씁니다.

```mermaid
flowchart LR
 B[브라우저\npublic/app.js] -->|HTTP| S[src/server.mjs]
 S --> E[접근 제어·XDR\nsrc/engine*]
 S --> V[project-scan.mjs] --> O[osv.mjs]
 S --> A[AI 게이트웨이]
 S -->|응답| B
 B -->|검증·상태 정리 후 studentData(kind)| P[student/extension.mjs]
 P -->|DOM| B
```

흐름은 브라우저→서버→연동/스캐너/AI→검증→학생 함수→DOM입니다. OSV·AI 직접 접속은 없습니다. 스캐너가 lockfile·허용 목록을 대조해 `osv.mjs`를 호출합니다.

| 구분 | 경계 |
|---|---|
| 제공 | `public/app.js`, `src/server.mjs`, `src/engine*`, `src/vulnerabilities/*` |
| 학생 | `student/extension.mjs` DOM 표시 |

| 상태 | 확인·복구 |
|---|---|
| 시작 실패/포트 사용 | 위치·Node 확인 후 포트 변경 |
| 연결 없음/SDP | 설정 없으면 성공 아님; 담당자 확인 |
| OSV `not_configured`·`not_checked` | 조회 미준비, 취약점 없음 아님 |
| OSV `partial`·`unverifiable` | ID·`modified` 보존, 전체 확인 불가 |
| AI 실패/조치 `pending`·`unknown` | 기록·판정·접수·효과 분리 |

SDP·XDR·AI·OSV·PowerShell·조치는 미확인입니다.
