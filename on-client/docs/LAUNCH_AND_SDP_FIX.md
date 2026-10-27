# 공식 실행 도구·SDP 경로 수정 · 2026-10-27

## 현재 실행 방법

on-client 폴더의 일반 권한 PowerShell에서 실행합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
```

기본 주소는 http://127.0.0.1:5189/ 입니다. 종료는 해당 창에서 Ctrl+C입니다. npm start/start:pc도 같은 실행 도구를 호출하는 별칭으로 바꿨으므로 더 이상 Node 서버를 직접 실행하지 않습니다.

## 변경 범위

- tools/start-alekov.ps1: 공식 보안 준비·경로 검증·비밀 환경변수 제외·포트 검사·기다림 절차는 유지. 존재하는 student/pc-server.mjs를 실행 진입점으로 선택하는 부분만 추가.
- student/pc-server.mjs: 공식 서버 CLI와 같은 --native-host-config/--sdp-host-config/조치 설정 파싱·검증·공식 host 생성·소유 객체 전달·종료 정리를 유지해 받은 설정을 실제 createOnServer에 전달. 기존에 설정을 받지 않고 서버를 만들던 부분 수정.
- SDP 카드는 하드코딩한 미연결 대신 실제 상태 판별. 설정 미지정은 미연결과 이유, 설정된 공식 SDP host에서 현재 신원·활성 세션을 확인한 경우만 연결 확인, 조회 실패·검증 불충분은 확인 불가.
- 학생 Windows 조회 화면은 SDP 확인 시각을 상세에 표시하고 첫 조회 전에는 조회 전으로 표시.
- README·START_HERE·문제 해결 안내의 현재 실행 경로 정정.

제공 src/server.mjs·인증 검증·TLS 검증 로직은 수정하지 않았습니다. 새 포장 도구·승인 파일·임의 개인 인증서는 만들지 않았습니다. 공식 도구가 본인 Windows 사용자 전용 경로에 준비하는 계정 연결용 설정만 정식 절차로 생성·재사용합니다. 그 값은 코드·Git·문서·대화에 출력하지 않습니다.

## 실제 확인

5193 시험 포트에서 위 실행 도구를 실제 실행해 ‘계정 연결 준비가 끝났습니다’와 서버 시작을 확인했습니다. PC 상태 API HTTP 200, CPU·메모리·디스크 세 항목 ok를 확인했습니다. 원문 자격을 출력하지 않고 현재 로그인 조회를 실행한 결과 NATIVE_HOST_DISABLED가 아니라 NATIVE_HOST_UNVERIFIED를 받았습니다. 보안 준비는 적용됐지만 사용자의 실제 계정 로그인은 아직 확인되지 않은 상태입니다. 실제 로그인·AI 앱 승인은 제공 화면의 별도 사용자 절차입니다.

## SDP에서 남은 것

현재 실행에는 개인 SDP 설정 경로가 지정되지 않았습니다. 임의로 개인 자격 경로를 검색하거나 인증서·토큰을 생성하지 않았습니다. 제공 문서상 실제 연결에는 기존 승인 발급 경로의 개인 CA·인증서·키·토큰과 SDP 설정이 필요합니다.

실제 받은 SDP 설정 파일이 있을 때만 아래 형식으로 실행합니다. 아래 경로는 문법 설명용 자리이며 존재하는 실제 경로가 아닙니다. 키나 토큰 원문을 입력하는 명령이 아닙니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -SdpHostConfig "<발급받은 SDP 설정 파일의 실제 절대 경로>"
```

파일은 프로젝트 밖에 있어야 하며 공식 로더가 경로·권한·형식·자격을 검증합니다. 설정 오류를 무시하거나 HTTP/인증서 검증 해제로 바꾸지 않습니다. 계정 로그인·AI 승인 성공을 SDP 연결 성공으로 간주하지 않습니다. 실제 운영 SDP 성공 경로는 자격이 지정되지 않아 미확인입니다.
