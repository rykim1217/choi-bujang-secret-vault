# 라요 보안 Agent 0.2.11

목적: 업무 앱 판정·보안 기록/XDR·OSV·AI 상태를 표시합니다.

학생 구현은 `student/extension.mjs`의 8개 `render*` 함수입니다. 제공 `public/app.js`·`src/server.mjs`가 상태를 전달하고 학생 코드는 DOM으로 표시합니다.

Windows PowerShell, Node `v24.19.0`, npm `11.17.0`, 포트 `5189`를 확인했습니다.

```powershell
Set-Location "C:\Users\user\Desktop\choi-bujang-secret-vault\on-client"
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

주소는 http://127.0.0.1:5189/입니다. 포트·절차·구성도·장애 안내는 [학생 실행 설명서](docs/STUDENT_RUNBOOK.md)에 있습니다. `package-lock.json`은 없고 외부 연결·OSV는 미확인입니다.
