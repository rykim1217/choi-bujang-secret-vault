# 현재 실행 구조 · 2026-10-27 통합본

> 후속 공지 반영: 실행 방법은 docs/LAUNCH_AND_SDP_FIX.md와 START_HERE.md를 우선합니다. npm start는 이제 공식 PowerShell 실행 도구를 호출하며, 공식 보안 준비 결과와 SDP 설정을 학생 서버에 전달합니다. 아래의 직접 Node 실행·start:provided 설명은 직전 통합 단계의 이력입니다.

## 실행

on-client 폴더의 일반 권한 PowerShell에서 `npm.cmd start`, 브라우저 주소 http://127.0.0.1:5189/ 입니다. 종료는 같은 창에서 Ctrl+C입니다. 기존 5190 분리 화면은 종료했습니다.

## 제공 영역과 학생 영역

- public·src·tools·vendor와 공식 설명 파일은 해시가 검증된 공식 0.2.14 ZIP 원문으로 복구했습니다. 학생 extension.mjs는 덮어쓰지 않았습니다. 기존 작업·Git bundle 백업은 artifacts/before-official-recovery-20261027-112554에 있습니다.
- package.json의 start만 학생 실행 진입점 pc-server.mjs로 연결하고, start:provided에는 공식 src/server.mjs 실행을 유지합니다. README에 현재 실행 안내를 추가했습니다. 이 두 파일은 제공본과 의도적으로 다릅니다.
- student/pc-server.mjs는 공식 createOnServer를 재사용하며 로컬 실제 조회 경로와 학생 모듈 정적 파일만 추가합니다. 제공 HTML의 스크립트 삽입은 제거했습니다. 새 포장 도구가 아닙니다.
- student/extension.mjs의 createStudentView가 추가 모듈을 로드하고 renderIdentity의 반환 DOM 안에 PC 화면을 넣습니다. 기존 8개 render 함수·입력 계약·필수 속성과 기존 세 메뉴를 유지합니다. 외부 독립 사이드바는 제거했습니다.
- 추가 학생 파일: pc-dashboard.mjs, pc-dashboard.css, pc-system-view.mjs, pc-metrics.mjs, pc-system.mjs, pc-server.mjs. 기존 제공 student/engine-adapter.mjs가 없어서 공식 원문을 추가했습니다. 운영 연결을 임의로 켜지는 않습니다.
- appearance.json은 이 배포에서 지원 규격이 확인되지 않아 발명하지 않았습니다. 이름과 CSS는 학생 모듈에서 처리합니다.

## 확인한 범위

2026-10-27 5193 시험 포트에서 CPU·메모리·디스크, 네트워크·방화벽·Windows 기록 조회를 브라우저로 확인했습니다. Windows 기록은 경고 55건·오류 4건으로 나왔으며 조회 시각 기준 실제 결과입니다. 기존 세 메뉴 전환과 Enter 재조회, 서버 실제 중단 시 두 추가 화면의 실패 항목·이유·다음 행동 표시를 확인했습니다. 이후 npm start로 기본 5189에서 재실행하고 CPU 재조회를 확인했습니다. 기존 학생 문법 검사와 변경 모듈 문법 검사가 통과했습니다.

보호 현황의 학생 구현 표시에서 ‘내 PC 상태’와 ‘연결·Windows 기록’을 선택합니다. 값의 시각·단위·측정 범위, 디스크 대상, Windows 기록 조회 범위를 확인할 수 있습니다. 실패 시 예제 값으로 대체하지 않습니다. 일반 권한만 사용하고 방화벽·인증 설정을 바꾸지 않습니다.

## 검증되지 않은 범위

- 실제 SDP·AI·보안 조치 집행 연결은 여전히 미연결 또는 미확인입니다.
- 공식 기본 서버만 쓰는 start:provided/start-alekov 경로는 학생 추가 PC API를 제공하지 않습니다. 그 경로에서 추가 모듈을 읽지 못하면 학생 영역에 확인 불가 안내가 나오도록 했습니다.
- 승인 host·설치형·공식 과제 자동 판정의 수용은 미검증입니다. 로컬 학생 실행 구조를 정리한 것이 승인 환경 인증은 아닙니다.
- 공식 업데이트 스크립트는 처음 UPDATE_NOT_PROJECT로 중단됐습니다. 이후 진행한 것은 사용자 승인에 따른 공식 원문 수동 복구이며, 스크립트 UPDATED 결과를 받았다고 기록하지 않습니다.
- package-app은 최신 공식 ZIP에도 없어 포장하지 않았습니다. 승인 파일이나 키를 생성·우회하지 않았습니다. 최신 수업 안내에 따라 GitHub 저장소 주소·커밋으로 제출할 수 있습니다.
- 전체 제출 상태는 실제 커밋·GitHub 반영·과제 접수 결과를 따릅니다. 이 문서가 통과를 증명하지 않습니다.

기존 DAY1~DAY5 기록은 당시 독립 5190 실행 이력이며, 현재 실행은 본 문서와 START_HERE.md를 기준으로 합니다.
