# 내 보안 Agent 시작 틀 0.2.11

이 보안 Agent는 회사 직원이 자기 로그인 상태, 업무 앱 접속 결과, 최근 접속 기록과 보안 경보를 보는 보안 앱입니다. 13단계부터 22단계까지 이 프로젝트 하나로 화면을 채워 가며 완성합니다. 처음이라면 docs/GETTING_STARTED_STUDENT.md부터 읽습니다. 무엇을 왜 만드는지와 단계별 순서가 그 문서에 있습니다.

이 시작 틀을 받은 것만으로 단계를 통과하지 않습니다. 단계마다 docs/STUDENT_PROMPTS.md의 안내를 수업용 AI에 붙여 넣어 student/extension.mjs를 고치고, 화면에서 확인하고, 커밋한 뒤 ALEPH에 제출합니다. 제출하면 서버가 그 커밋의 코드를 받아 AI가 단계 과제 기준으로 읽고 판정합니다. 코드를 실행해서 판정하지 않습니다.

## 켜기

검수 환경은 Node.js 24.19.0이며 외부 npm 의존성이 없습니다. 이 폴더의 PowerShell에서 아래를 실행하고 PC 브라우저로 http://127.0.0.1:5189 를 엽니다. 자세한 켜기·끄기·다시 켜기는 docs/STUDENT_LAUNCH_GUIDE.md에 있습니다.

    powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1

npm start도 같은 서버를 켭니다. 기본 실행은 실제 회사 시스템(기존 엔진)에 연결되지 않은 상태입니다. npm run demo는 예제 자료로 화면을 보여 줄 뿐이며 실제 연결이나 성취가 아닙니다. npm run check는 student/extension.mjs의 문법만 확인합니다.

## 현재 완성 기능과 구성

현재 학생 화면은 `student/extension.mjs`의 `renderIdentity`, `renderDecision`, `renderEvents`, `renderStatus`, `renderVulnerabilities`, `renderAiConnection`, `renderExplanation`, `renderAction`이 제공 화면에서 정리된 입력을 받아 계정·업무 앱 판정·본인 보안 기록·기기·세션·설치 패키지 조회·앱 내부 AI 상태·조치 상태를 글자로 표시합니다. 앞 단계의 입력 계약과 `data-student-*` 속성은 유지합니다. 실제 SDP·XDR·AI·OSV 연결 성공이나 보안 조치 실행은 별도 확인 대상이며 이 화면의 표시만으로 확정하지 않습니다.

주요 폴더는 `public/`(브라우저 화면과 제공 `app.js`), `src/`(로컬 서버·접근 제어/XDR 경계·AI·OSV 조회), `student/`(학생 표시 함수), `tools/`(PowerShell 실행 도구), `docs/`(학생 실행 설명서와 제공 문서)입니다. 제공 `public/app.js`와 `src/server.mjs`가 요청·응답 검증과 상태 전달을 담당하고, 학생 `student/extension.mjs`는 전달받은 입력을 DOM으로 표시합니다. 학생 함수는 서버 요청·비밀 입력·실제 조치 POST를 추가하지 않습니다.

실행 위치·현재 확인한 Node.js/npm 버전·폴더 구조·구성도·오류 대응은 [학생 실행 설명서](docs/STUDENT_RUNBOOK.md)를 읽으세요. 현재 저장소에는 `package-lock.json`이 없고 기본 OSV 허용 목록도 비어 있으므로 설치 패키지 조회 완료나 취약점 없음을 가정하지 않습니다.

## 지킬 것

- 기존 1~3차 프로젝트와 학생 파일은 지우거나 덮어쓰지 않습니다. 새 폴더에서 시작하거나, 이미 하던 프로젝트를 이어 씁니다.
- AI 열쇠·비밀번호·토큰을 코드, 커밋, 캡처, 도움정보에 넣지 않습니다. 주소나 열쇠를 직접 입력하는 칸도 만들지 않습니다.
- .env.example에는 비밀 없는 설정만 있습니다.

## 더 읽을 곳

- 단계별 안내와 AI에 붙여 넣을 문장: docs/STUDENT_PROMPTS.md
- 단계별 확인 항목: docs/CURRICULUM.json, docs/IMPLEMENTATION_CONTRACT.md
- 오류 코드별 해결: docs/CONNECTION_TROUBLESHOOT.md
- 시작 틀 업데이트(내 파일 보존): docs/STARTER_UPDATE.md
- 실제 회사 시스템(SDP)·앱 안 AI 연결은 담당자가 따로 안내할 때만 씁니다: docs/SDP_HOST_CONNECTION.md, docs/AI_SETUP_GUIDE.md. 이 연결은 앱을 처음 켜고 13~16단계 화면을 만들거나 공식 AI 코드 판정을 받기 위한 전제 조건은 아닙니다. 다만 17단계 이후의 실제 연결과 새 환경 재현은 해당 단계의 기준에 따라 따로 확인합니다.
