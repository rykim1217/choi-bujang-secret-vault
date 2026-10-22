# 라요 보안 Agent 0.2.11

목적: 계정·기기·현재 세션, 알림·도움정보, 업무 앱 판정, 보안 기록/XDR, OSV·AI 상태와 보안 조치 상태를 표시합니다.

학생 구현은 `student/extension.mjs`의 8개 `render*` 함수입니다. `public/`·`src/`는 요청·검증·상태 전달을 제공하고 학생 코드는 DOM을 표시합니다. 범위는 근거·규칙에 연결된 기록, AI 참고 설명, 조치 준비·사람 확인·결과 조회입니다.

Windows PowerShell에서 Node `v24.19.0`, npm `11.17.0`, 포트 `5189`를 확인했습니다. 서버 기동·브라우저 접속은 이 검토에서 실행하지 않았습니다.

```powershell
Set-Location "C:\Users\user\Desktop\choi-bujang-secret-vault\on-client"
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

주소는 http://127.0.0.1:5189/입니다. 주요 폴더는 `public/`(제공 화면), `src/`(제공 서버·연동), `student/`(학생 표시), `tools/`(실행), `docs/`(문서)입니다. 설치·구성도·장애 안내는 [학생 실행 설명서](docs/STUDENT_RUNBOOK.md)에 있습니다. `package-lock.json`과 `npm ci`를 사용하며 외부 연결·OSV는 미확인입니다.
