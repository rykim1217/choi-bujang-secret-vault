# 라요 보안 Agent 0.2.11

## 목적과 현재 기능

이 프로젝트는 계정·업무 앱 접근 판정·본인 보안 기록/XDR 경보·기기·세션·설치 패키지 OSV 상태·앱 내부 AI 연결/설명·보안 조치 상태를 표시하는 학생용 로컬 화면입니다. 학생 구현은 `student/extension.mjs`의 `renderIdentity`, `renderDecision`, `renderEvents`, `renderStatus`, `renderVulnerabilities`, `renderAiConnection`, `renderExplanation`, `renderAction`입니다.

`public/app.js`와 `src/server.mjs`는 제공 코드로서 요청·응답 검증과 상태 전달을 담당합니다. `student/extension.mjs`는 전달받은 입력만 DOM으로 표시하며 서버 요청, 비밀 입력, 실제 조치 실행을 추가하지 않습니다. 주요 폴더는 `public/`(제공 화면), `src/`(로컬 서버·연동·OSV·AI 경계), `student/`(학생 표시 함수), `tools/`(실행 도구), `docs/`(문서)입니다.

## 실행

`on-client`에서 Windows PowerShell로 다음을 실행합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

기본 주소는 http://127.0.0.1:5189/이며 포트가 사용 중이면 `-Port 5190`과 주소 http://127.0.0.1:5190/을 함께 사용합니다. Node.js 실제 확인값은 `v24.19.0`, npm은 `11.17.0`입니다. 자세한 경로·버전·구성도·장애 대응은 [학생 실행 설명서](docs/STUDENT_RUNBOOK.md)를 따릅니다.

실제 SDP·XDR·AI 연결과 OSV 조회는 운영 설정과 계정 권한이 필요하며, 기본 실행·예제 화면은 성공을 보장하지 않습니다. 저장소에는 `package-lock.json`이 없고 기본 OSV 허용 목록도 비어 있습니다. 비밀번호·토큰·API 키는 코드·문서·커밋에 넣지 않습니다.
