# 22단계 재현·릴리스 기록

## 최종 기준

| 항목 | 값 |
|---|---|
| 저장소 | `https://github.com/rykim1217/choi-bujang-secret-vault` |
| 브랜치 | `submission-stage22-repro` |
| 최종 커밋 | 이 문서를 포함한 제출 커밋의 40자리 해시. 제출 화면에 같은 값을 입력합니다. |
| 앱 패키지 버전 | `on-client/package.json`의 `0.2.11` |
| 확인 시각 | `2026-10-22 16:05:45 +09:00` |

원래 작업 폴더와 Git 기록은 보존했습니다. 아래의 새 임시 폴더에 제출 브랜치를 clone하고 HEAD가 제출 화면에 입력한 최종 커밋과 같은지 확인합니다.

```text
C:\Users\user\AppData\Local\Temp\rayeon-stage22-final-4b0ae6f
```

인증·SDP·NativeHost 설정 파일은 복사하지 않았습니다. 최종 커밋에는 제공 런타임과 화면 자산, OSV 스캐너 원문이 포함되어 있습니다.

이 기록을 갱신한 제출 커밋에서는 실행 코드·화면 자산·lockfile은 유지하고, 실행에 사용되지 않는 모듈별 보조 README만 제출 트리에서 제외했습니다. 재현 결과는 실행 코드가 같은 최종 구성이라는 전제에서 기록합니다.

| 확인한 제공 파일 | 역할 |
|---|---|
| `on-client/src/actions/service.mjs` | 보안 조치 상태·AI 설명 연결 |
| `on-client/src/vulnerabilities/project-scan.mjs` | `package-lock.json` 및 설치 메타데이터 대조 |
| `on-client/src/vulnerabilities/osv.mjs` | OSV 조회·결과 정리 |
| `on-client/public/index.html` 및 `public/assets/alekov/*` | 제공 화면·화면 자산 |

## 버전과 지원 범위

- 앱 릴리스 버전은 `on-client/package.json`의 `0.2.11`입니다.
- `package.json`은 Node `24.19.0`을 기준으로 합니다. `tools/start-alekov.ps1`은 Node 22~24를 실행 가능 범위로 검사하고 `v24.19.0`을 권장합니다. 따라서 권장 기준과 실행 허용 범위를 같은 값이라고 쓰지 않습니다.
- `/api/diagnostics` 응답의 `component: "on-client"`, `version: "0.1.0"`은 진단 응답에 기록된 구성요소 버전입니다. 패키지 릴리스 `0.2.11`과 다른 값을 임의로 통일하지 않았으며, 이 기록에서는 두 버전의 의미를 구분합니다.
- 19단계 실제 보안 조치 집행, SDP·XDR·AI·OSV 외부 연결 성공, 운영 인증 및 `v1.0` 자동 인증은 이 기록에서 확인하지 않았습니다.

## 새 환경 재현

최종 커밋을 새 폴더에서 받은 뒤 21단계 설명서의 설치·검사·실행 순서에 맞춰 확인했습니다.

```powershell
git clone --branch submission-stage22-repro --single-branch https://github.com/rykim1217/choi-bujang-secret-vault.git <새-폴더>
Set-Location <새-폴더>\on-client
node --version
npm --version
npm ci --ignore-scripts --no-audit --no-fund
npm run check
```

직접 확인한 결과:

| 절차 | 관찰 결과 | 확인 구분 |
|---|---|---|
| clone | 제출 화면에 입력한 최종 커밋과 HEAD가 일치해야 함 | 새 폴더 실행 확인 |
| `node --version` | `v24.19.0` | 새 폴더 실행 확인 |
| `npm --version` | `11.17.0` | 새 폴더 실행 확인 |
| `npm ci --ignore-scripts --no-audit --no-fund` | 성공 | 새 폴더 실행 확인 |
| `npm run check` | `node --check student/extension.mjs` 성공 | 새 폴더 실행 확인 |
| `npm run demo`와 같은 `node src/server.mjs --demo` 실행 | `케셰브 예제: http://127.0.0.1:5189` 출력 후 종료 | 예제 실행 확인 |
| 일반 실행 `-Port 5193 -WaitSeconds 5` | 서버의 `케셰브 연결 확인` 출력 뒤 5초 대기 실패 | 실행 실패 확인 |
| 브라우저·HTTP 200 | 이 기록에서는 확인하지 못함 | 미확인 |

일반 연결 모드는 SDP·NativeHost 등 운영 설정이 없으면 연결 성공으로 표시하지 않습니다. 예제 출력은 실제 시스템 연결 성공이 아닙니다. 종료는 실행 중인 PowerShell에서 `Ctrl+C`, 재실행은 같은 명령을 다시 입력하는 절차입니다. 기존 폴더의 인증·설정 파일을 무작정 복사하지 않았습니다.

## 13~21단계 기능·근거·확인 상태

| 단계 | 기능·결과 | 원문 근거 | 확인 상태 |
|---|---|---|---|
| 13 | 계정·기본 식별 표시 | `student/extension.mjs`의 `renderIdentity` | 코드 확인, 새 브라우저 화면 미확인 |
| 14 | 업무 앱 접근 판정·이유·시각 | `renderDecision` | 코드 확인, 실제 연결 미확인 |
| 15 | 접속 기록/XDR 목록·필터·상세 | `renderEvents` | 코드 확인, 실제 목록 미확인 |
| 16 | 빈 상태·오류·진단·미지원 조치 안내 | `renderStatus` 및 이벤트 상세 | 코드 확인, 실제 버튼 미확인 |
| 17 | AI 연결 점검과 사건 설명 실행 구분 | `renderAiConnection`·`renderExplanation` | 코드 확인, 실제 AI 연결 미확인 |
| 18 | 근거·규칙·현재 상태에 연결된 AI 설명 | `renderExplanation` | 코드 확인, 실제 설명 미확인 |
| 19 | 조치 준비·사람 확인·결과 조회 구분 | 제공 `public/app.js` 및 학생 표시 | 코드 확인, 실제 집행 미확인 |
| 20 | 정확한 설치 버전·OSV 조회 상태 | `renderVulnerabilities`, `project-scan.mjs`, `osv.mjs`, lockfile | 코드 확인, 외부 OSV 미확인 |
| 21 | 실행 설명서·구성도·제공/학생 경계 | `README.md`·`docs/STUDENT_RUNBOOK.md` | 원문 대조, 브라우저 미확인 |

위 표에서 코드 확인은 커밋 원문을 읽은 결과이며, 모의 데이터 성공이나 실제 시스템 연결 성공을 뜻하지 않습니다. 13~21단계의 실제 운영 연결·외부 서비스 결과는 확인하지 않은 항목으로 남깁니다.

## 구성과 제공·학생 경계

이번 최종 커밋의 실행 흐름은 `docs/STUDENT_RUNBOOK.md`의 구성도와 같습니다.

```mermaid
flowchart LR
  B[브라우저\npublic/app.js] -->|HTTP 요청| S[src/server.mjs]
  S --> E[접근 제어·XDR\nsrc/engine*]
  S --> V[vulnerabilities/project-scan.mjs]
  V --> O[vulnerabilities/osv.mjs]
  S --> A[AI 게이트웨이\n제공 연동]
  S -->|서버 응답| C[브라우저의 검증·상태 정리]
  C -->|studentData(kind)| P[student/extension.mjs]
  P -->|DOM 표시| B
```

`src/server.mjs`가 서버 응답을 만들고, 브라우저 `public/app.js`가 검증·상태를 정리한 뒤 `studentData(kind)`를 학생 함수에 전달합니다. 학생 함수가 서버에 직접 요청하거나 OSV·AI에 직접 접속하지 않습니다.

| 구분 | 커밋에서 확인한 범위 |
|---|---|
| 제공 코드 | `public/app.js`, `src/server.mjs`, `src/engine*`, `src/actions/*`, `src/connection/*`, `src/vulnerabilities/*`, 화면 자산 |
| 학생 작성 | `student/extension.mjs`의 DOM 표시 함수 |
| 실행 진입점 | `tools/start-alekov.ps1`, `package.json`의 `start`·`demo`·`check` |
| 문서 | `README.md`, `docs/STUDENT_RUNBOOK.md`, 이 재현 기록 |

## 보존·복원과 제한

- 원래 작업 폴더·학생 코드·앞 단계 Git 기록·미추적 파일은 보존했습니다.
- 새 환경 복원은 저장소 URL과 최종 커밋을 clone하는 방식입니다. 미커밋 파일, 인증 정보, 외부 서비스 데이터는 백업되지 않습니다.
- `npm ci`와 예제 실행은 새 임시 폴더에서 수행했습니다. 일반 연결 모드의 대기 실패와 브라우저·HTTP 미확인은 성공으로 바꾸지 않았습니다.
- 설명서의 명령·구성도·지원 범위는 현재 최종 커밋의 파일 경로와 대조했습니다. 서버가 이 기록의 명령을 대신 실행했다는 뜻은 아닙니다.
- 22단계 통과는 원문 검토 기준의 수료이며 실제 운영 인증이나 `v1.0` 자동 인증이 아닙니다.
