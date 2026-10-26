# 라요 보안 Agent 0.2.11

## 지금 만든 라요 실행하기 · PC 대시보드

처음 사용하는 분은 [처음 실행 안내](docs/START_HERE.md)를 따라 주세요. Windows의 일반 권한 PowerShell에서 **이 README와 package.json이 들어 있는 on-client 폴더**를 열고 실행합니다.

```powershell
node --version
npm.cmd --version
npm.cmd run check
npm.cmd run start:pc
```

Node.js 기준 버전은 24.19.0, 현재 PC에서 확인한 npm은 11.17.0입니다. 서버에 `라요 PC 대시보드: http://127.0.0.1:5190/`가 나오면 브라우저에서 해당 주소를 엽니다. 창은 켜 둡니다. 종료는 Ctrl+C, 재실행은 같은 명령입니다. `npm.cmd`는 PowerShell의 npm.ps1 실행 정책 문제를 피하기 위해 사용하며 실행 정책을 변경하지 않습니다.

- 내 PC 상태: 실제 CPU·메모리·시스템 드라이브 여유 공간, 시각·단위·직전 비교·기록.
- 연결·Windows 기록: 네트워크 구성, 방화벽 설정 읽기, 최근 24시간 System/Application의 경고·오류 건수. 침해나 공격 탐지 결과가 아닙니다.
- 읽을 수 없으면 확인 불가와 이유를 표시합니다. 예시 데이터로 대체하지 않으며 관리자 권한을 요구하거나 보안 설정을 변경하지 않습니다.
- 기존 보호 현황·업무 앱·보안 기록은 실제 서버 연결이 없는 현재 구성에서 조회되지 않습니다. 상단 연결 없음 및 SDP 미연결은 로컬 PC 조회와 별개입니다.
- 아직 설치 묶음과 `package-app`은 구현하지 않았습니다. 현재는 프로젝트 폴더에서 실행하는 버전입니다.

학생 추가 파일은 `student/pc-*`이며, 실행 진입점은 `student/pc-server.mjs`입니다. `extension.mjs`만 복사하면 대시보드가 포함되지 않습니다. 전체 프로젝트 구조를 유지하세요. 확인 범위와 남은 검증은 [5일차 기록](docs/DAY5_RUN_REVIEW.md)에 있습니다.

## 기존 22단계 실행 안내 · 별도 화면

아래 안내는 기존 제공 화면(5189)을 위한 기록입니다. 위의 PC 대시보드(5190) 실행 방법과 구분하세요. 과거 확인 시점의 미확인 표시는 그 당시 기록을 뜻합니다.

목적: 계정·기기·현재 세션, 알림·도움정보, 업무 앱 판정, 보안 기록/XDR, OSV·AI 상태와 보안 조치 상태를 표시합니다.

학생 구현은 `student/extension.mjs`의 8개 `render*` 함수입니다. `public/`·`src/`는 요청·검증·상태 전달을 제공하고 학생 코드는 DOM을 표시합니다. 범위는 근거·규칙에 연결된 기록, AI 참고 설명, 조치 준비·사람 확인·결과 조회입니다.

Windows PowerShell에서 Node `v24.19.0`, npm `11.17.0`, 포트 `5189`를 확인했습니다. 서버 기동·브라우저 접속은 이 검토에서 실행하지 않았습니다.

```powershell
Set-Location "C:\Users\user\Desktop\choi-bujang-secret-vault\on-client"
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

주소는 http://127.0.0.1:5189/입니다. 주요 폴더는 `public/`(제공 화면), `src/`(제공 서버·연동), `student/`(학생 표시), `tools/`(실행), `docs/`(문서)입니다. 설치·구성도·장애 안내는 [학생 실행 설명서](docs/STUDENT_RUNBOOK.md)에 있습니다. `package-lock.json`과 `npm ci`를 사용하며 외부 연결·OSV는 미확인입니다.
