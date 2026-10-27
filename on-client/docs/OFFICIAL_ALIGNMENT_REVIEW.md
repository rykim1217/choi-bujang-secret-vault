# 공식 실행 구조 정합성 점검 · 2026-10-27

## 이후 로컬 복구·통합 결과

사용자가 담당자 도움 없이 복구를 진행하도록 요청한 뒤 수행한 내용입니다. 아래의 ‘필요한 다음 조치’와 초기 중단 상태는 복구 이전 기록으로 보존합니다.

- 기존 student·docs·README·package 파일과 Git bundle을 artifacts/before-official-recovery-20261027-112554에 백업했습니다. 이 폴더는 Git 제외 대상이며 제출용 패키지가 아닙니다.
- 공식 ZIP 전체 SHA-256과 내부 sourceHashes를 검증하고, 학생 파일을 제외한 제공 원문을 0.2.14로 복구했습니다. 누락된 공식 student/engine-adapter.mjs도 기존 파일이 없음을 확인하고 추가했습니다. 기존 학생 extension.mjs는 덮어쓰지 않았습니다.
- 이것은 공식 업데이트 스크립트가 UPDATED를 반환한 것이 아니라, 사용자 승인하에 수행한 검증된 공식 파일의 수동 복구입니다. UPDATE_NOT_PROJECT 초기 결과를 성공으로 바꾸지 않습니다.
- 복구 뒤 제공 sourceHashes와 대조했을 때 별도 차이는 실행 명령을 추가한 package.json과 현재 안내를 덧붙인 README.md입니다. public·src·tools·vendor 제공 코드는 ZIP 원문과 일치합니다.
- 추가 UI는 extension.mjs의 createStudentView가 로드하고 renderIdentity 반환 DOM에 포함하도록 변경했습니다. 별도 왼쪽 메뉴와 제공 HTML에 대한 스크립트 삽입은 제거했습니다. 기존 세 메뉴 및 기존 8개 render 함수는 유지합니다.
- PC 조회 API는 기존 공식 서버의 createOnServer를 재사용하는 student/pc-server.mjs에서 추가합니다. package.json의 npm start는 이 학생 진입점을 실행하며 기본 주소는 5189입니다. start:provided는 공식 서버만 실행하는 비교용 명령입니다.
- appearance.json은 이 공식 배포에 로더·규격이 확인되지 않아 임의로 생성하지 않았습니다. 학생 모듈의 CSS를 별도 파일로 유지합니다.
- 로컬 기능 통합은 승인 host 지원·과제 공식 통과 인증이 아닙니다. 승인 키·실제 SDP/AI 연결·공식 포장은 만들거나 우회하지 않았습니다.
- 5193 시험 포트에서 CPU와 Windows 조회, 기존 세 메뉴, 키보드 재조회, 실제 서버 중단 오류 표시를 확인했습니다. 이후 표준 npm start와 5189로 재실행하고 이전 5190 서버는 종료했습니다.

## 요청과 현재 상태

사용자는 디자인 유지보다 과제 안내 준수를 우선해 수정을 요청했습니다. 기존 앱·학생 코드·Git 기록을 유지한 채 공식 업데이트 미리보기와 배포 원문을 확인했습니다. 이 점검은 과제 통과 판정이나 수정 완료가 아닙니다.

## 실제 수행과 결과

1. 수업 페이지의 공식 업데이트·복구 안내를 읽었습니다.
2. 공식 update-alekov-0.2.14.ps1을 임시 폴더에 내려받고 SHA-256을 대조했습니다.
   - 실제값 및 공식 안내값 일치: a02bc018ef39989cfb7745edcc66aa9065cb0accad7c00b0aa06e965201beb7a
3. 기존 on-client에서 -Apply 없이 -Json 미리보기를 실행했습니다.
   - 결과: UPDATE_NOT_PROJECT
   - 찾지 못한 파일: .on-starter-manifest.json
   - touched=false, changed=[]: 도구에 의한 프로젝트 파일 변경 없음.
4. 공식 ZIP도 임시 폴더에 받아 SHA-256을 확인하고 압축 내부 파일을 읽기만 했습니다. 프로젝트에 풀거나 덮어쓰지 않았습니다.
   - 실제값 및 공식 안내값 일치: 88294d21948386e7be2b01cb895e69722a1401e88a51183e55a326bd4700d66b
   - package.json: start, demo, check만 있음. package-app은 이 공식 배포에도 없음.
   - student/extension.mjs: 기존 8개 render* 함수 형식. PC 자원 조회용 추가 함수나 appearance.json 파일은 이 배포에서 확인되지 않음.

## 업데이트가 기대하지만 현재 폴더에서 없는 파일

- .on-starter-manifest.json
- docs/AI_SETUP_GUIDE.md
- docs/CONNECTION_TROUBLESHOOT.md
- docs/STUDENT_LAUNCH_GUIDE.md
- tools/prepare-native-host.ps1
- vendor/clco-http.mjs

파일이 현재 없다는 관찰이며, 누가 언제 삭제했는지나 모두 업데이트 실패의 직접 원인이라고 추정하지 않습니다. 실제 중단은 첫 식별 파일 누락에서 발생했습니다. README.md와 package.json에는 이번 완성본 작업에서 추가한 안내와 start:pc도 있으므로 전체 ZIP 덮어쓰기는 작업 손실 위험이 있습니다.

## 현재 완성본과 공식 안내의 차이

- 공식 완성본 안내는 추가 화면·기능을 student/extension.mjs에서, 허용된 꾸밈을 student/appearance.json에서 구성하도록 설명합니다.
- 현재 로컬 PC 기능은 student/pc-* 파일과 별도 pc-server.mjs의 API에서 동작합니다. 기존 제공 서버와 public/app.js를 직접 고치지는 않았지만, 기본 npm start의 학생 입력으로 기능이 전달되는 구조는 아닙니다.
- 단순히 모듈을 extension.mjs에서 import하는 것으로는 해결되지 않습니다. 제공 서버는 해당 추가 파일·PC 조회 API를 지원하지 않으며, 제공 브라우저 코드는 학생 조회 경로를 제한하고 있습니다.
- 현재 실행 성공을 공식 host·설치형 지원이나 공식 과제 통과로 바꾸어 쓰지 않습니다. 다른 사람과 메뉴 배치가 같아야 한다는 조건도 확인되지 않았습니다.
- 업데이트 완료가 SDP·AI 연결 성공을 뜻하지 않는다는 공식 안내도 확인했습니다.

## 필요한 다음 조치

공식 업데이트 안내는 제공 파일 누락·수정 상황에서 현재 작업을 보존하고 담당 강사에게 목록을 제시하도록 안내합니다. 임의 manifest 생성, 검사 우회, ZIP 통째 덮어쓰기 없이 복구 방법과 제공 파일 범위를 확인해야 합니다.

담당자 확인 요청 요약:

> 기존 0.2.11 학생 프로젝트에서 공식 0.2.14 업데이트를 미리보기로 실행하니 .on-starter-manifest.json 누락으로 UPDATE_NOT_PROJECT가 나왔습니다. 학생 코드와 커밋은 보존 중입니다. 공식 누락 파일 복구 방법을 확인 부탁드립니다. 또한 최신 공식 ZIP의 학생 입력에는 로컬 CPU·메모리·네트워크 조회 계약이 보이지 않습니다. 완성본 추가 기능을 extension.mjs에 연결하는 공식 실행 환경·입력 계약과 꾸밈 파일 규격을 확인 부탁드립니다.

복구·입력 계약 확인 뒤 수행할 수정:

1. 공식 업데이트 변경 목록 확인 후 적용 범위 결정. 기존 작업과 제출 기록 보존.
2. 제공 입력을 학생 extension.mjs가 표시하도록 연동. 기존 8개 함수 및 필수 속성·버튼 계약 유지. 승인 환경 없이 기능이 된 것처럼 꾸미지 않음.
3. 지원되는 경우 appearance.json으로 꾸밈 통합. 확인되지 않은 필드를 발명하지 않음.
4. 화면의 두 조회 경로와 시각 구분, 측정 출처·디스크 대상·실패 조회 시각 표시 정리.
5. 새 기본 실행 경로에서 전체 시연·오류 복구·키보드 확인 후 문서 갱신.

포장 명령 부재는 최신 수업 안내에 따라 생략 가능하며 제출을 막는 조건과 구분합니다. 문서 작성 외 앱 코드·원본·기존 제출물은 이번 점검에서 변경하지 않았습니다.
