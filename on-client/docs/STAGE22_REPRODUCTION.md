# 22단계 재현·릴리스 기록

## 기준 버전

| 항목 | 값 |
|---|---|
| 저장소 | `https://github.com/rykim1217/choi-bujang-secret-vault` |
| 브랜치 | `submission-stage21-compact-v7` |
| 커밋 | `34cb13f3272cb5eab70f05c62bda9018c82d7e3b` |
| 앱 버전 | `0.2.11` |
| 기록 시각 | `2026-10-22 15:57:25 +09:00` |

원래 작업 폴더와 Git 기록은 보존했습니다. 새 임시 폴더에서 위 브랜치를 clone하고 HEAD가 같은 커밋인지 확인했습니다. 인증·SDP·NativeHost 설정 파일은 복사하지 않았습니다.

## 새 환경 재현

재현 폴더에서 다음 순서로 실행했습니다.

```powershell
git clone --branch submission-stage21-compact-v7 --single-branch https://github.com/rykim1217/choi-bujang-secret-vault.git <새-폴더>
Set-Location <새-폴더>\on-client
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run check
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5191
```

확인 결과: clone과 동일 커밋 확인, Node `v24.19.0`, npm `11.17.0`, `npm ci`, `npm run check`는 성공했습니다. 서버 기동은 `ERR_MODULE_NOT_FOUND`와 함께 실패했습니다. `src/server.mjs`가 가져오는 `src/actions/service.mjs`가 해당 커밋에 없어 20초 시작 대기 후 종료됐습니다. 따라서 HTTP 200·브라우저 화면·정상 시작 신호·종료·재실행은 미확인입니다. 이 커밋을 실행 성공이나 외부 연결 성공으로 표시하지 않습니다.

## 13~21단계 확인 범위

| 단계 | 기능·결과 | 근거 | 현재 확인 상태 |
|---|---|---|---|
| 13 | 계정·기본 식별 표시 | `student/extension.mjs` | 코드 확인, 새 화면 미확인 |
| 14 | 업무 앱 접근 판정·이유·시각 | `renderDecision` | 코드 확인, 실제 연결 미확인 |
| 15 | 접속 기록/XDR 목록·필터·상세 | `renderEvents` | 코드 확인, 실제 목록 미확인 |
| 16 | 빈 상태·오류·진단·미지원 조치 안내 | `renderStatus`·상세 표시 | 코드 확인, 실제 버튼 미확인 |
| 17 | AI 연결 점검과 설명 실행 구분 | `renderAiConnection`·`renderExplanation` | 코드 확인, AI 연결 미확인 |
| 18 | 근거·규칙·상태에 연결된 설명 | `renderExplanation` | 코드 확인, 실제 설명 미확인 |
| 19 | 조치 준비·사람 확인·결과 조회 구분 | 제공 `public/app.js`·학생 표시 | 코드 확인, 실집행 미확인 |
| 20 | 정확한 설치 버전·OSV 상태 | `renderVulnerabilities`·lockfile | 코드 확인, 외부 OSV 미확인 |
| 21 | 실행 설명서·구성도·경계 | `README.md`·`STUDENT_RUNBOOK.md` | 원문 확인, 새 서버 실행 실패 |

위 표의 코드 확인은 원문을 읽은 결과이며, 모의 데이터 결과나 실제 시스템 연결 성공을 뜻하지 않습니다. 이 기록은 22단계 재현 중 확인한 동일 커밋 기준입니다.

## 보존·복원과 제한

- 원래 작업 폴더의 학생 코드·앞 단계 기록·미추적 파일은 변경하지 않았습니다. clone에는 커밋된 파일만 포함됩니다.
- 복원은 위 저장소와 커밋을 새 폴더에 clone하는 방식입니다. 미커밋 파일, 인증 정보, 외부 서비스 데이터는 백업되지 않습니다.
- `npm ci`는 재현 폴더에서만 실행했습니다. 외부 SDP·XDR·AI·OSV와 19단계 실제 조치는 실행하지 않았습니다.
- 22단계 통과는 원문 검토 기준의 수료이며 운영 인증이나 v1.0 자동 인증이 아닙니다. 누락된 `src/actions/service.mjs` 때문에 현재 기준 버전은 재현 검증 미완료입니다.
