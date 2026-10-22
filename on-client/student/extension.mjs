// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  let eventViewState = {
    filters: { kind: 'all', appId: 'all', access: 'all' },
    selectedId: null,
  };

  return {
    renderIdentity({ me, devices, sessions }) {
      const root = document.createElement('section');
      const deviceStates = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const sessionStates = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const showDevice = (parent, device) => {
        appendText(parent, 'p', `기기: ${device.label} · ID: ${device.id} · 상태: ${deviceStates[device.status] ?? '확인 불가'} (${device.status})`);
      };
      const showSession = (parent, session) => {
        appendText(parent, 'p', `세션 ID: ${session.id} · 상태: ${sessionStates[session.status] ?? '확인 불가'} (${session.status})`);
      };
      const showResource = (title, resource, showData) => {
        const section = document.createElement('section');
        appendText(section, 'h3', title);
        const modeText = { demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가' }[resource.mode];
        if (modeText) appendText(section, 'p', modeText);
        if (resource.status === 'loading') {
          appendText(section, 'p', '불러오는 중');
        } else if (resource.status === 'error') {
          appendText(section, 'p', `연결 실패: ${resource.error?.message ?? '확인 불가'}`);
        } else if (resource.status === 'ok') {
          showData(section, resource.data);
        } else {
          appendText(section, 'p', '확인 불가');
        }
        root.appendChild(section);
      };
      showResource('현재 계정·기기·세션', me, (section, data) => {
        appendText(section, 'p', `사용자: ${data.user.label} · ID: ${data.user.id}`);
        showDevice(section, data.device);
        showSession(section, data.session);
      });
      showResource('기기 목록', devices, (section, data) => {
        if (data.length === 0) appendText(section, 'p', '기기 목록이 비어 있습니다.');
        for (const device of data) showDevice(section, device);
      });
      showResource('세션 목록', sessions, (section, data) => {
        if (data.length === 0) appendText(section, 'p', '세션 목록이 비어 있습니다.');
        for (const session of data) showSession(section, session);
      });
      return root;
    },
    renderDecision({ status, data, error, appId }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };

      appendText(root, 'h3', '업무 앱 접근 요청 결과');

      if (status === 'idle') {
        appendText(root, 'p', '앱을 골라 접속을 요청하세요.');
        return root;
      }

      if (status === 'loading') {
        appendText(root, 'p', '판정 확인 중');
        if (appId) appendText(root, 'p', `앱 ID: ${appId}`);
        return root;
      }

      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '확인 불가';
        appendText(root, 'p', `요청 실패: ${message}`);
        appendText(root, 'p', '요청 실패는 접근 거부 판정이 아닙니다.');
        return root;
      }

      if (status !== 'ok') {
        appendText(root, 'p', '확인 불가(unknown)');
        appendText(root, 'p', '허용으로 간주하지 않습니다.');
        return root;
      }

      const decisionLabels = {
        allow: '허용',
        deny: '거부',
        challenge: '추가 확인 필요',
        unknown: '확인 불가',
      };
      const decision = Object.hasOwn(decisionLabels, data?.decision) ? data.decision : 'unknown';
      const selectedAppId = data?.appId ?? appId ?? '확인 불가';
      appendText(root, 'p', `앱 ID: ${selectedAppId}`);
      appendText(root, 'p', `${decisionLabels[decision]}(${decision})`);

      if (decision === 'challenge') {
        appendText(root, 'p', '추가 확인이 필요합니다. 이 앱이 확인 절차를 대신 수행하지 않습니다.');
      } else if (decision === 'unknown') {
        appendText(root, 'p', '판정을 확인할 수 없습니다. 허용으로 간주하지 않습니다.');
      }

      appendText(root, 'p', `판정 이유: ${data?.reason ?? '확인 불가'}`);
      appendText(root, 'p', `판정 시각: ${data?.checkedAt ?? '확인 불가'}`);
      return root;
    },
    renderEvents({ status, data, error }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const safeMessage = typeof error?.message === 'string' && error.message.length > 0
        ? error.message
        : '확인 불가';

      eventViewState = {
        filters: { kind: 'all', appId: 'all', access: 'all' },
        selectedId: null,
      };
      appendText(root, 'h3', '접속 기록·XDR 경보');

      if (status === 'loading') {
        appendText(root, 'p', '기록을 불러오는 중');
        return root;
      }

      if (status === 'error') {
        if (error?.code === 'CONTRACT_MISMATCH') {
          appendText(root, 'p', `확인 불가: ${safeMessage}`);
        } else {
          appendText(root, 'p', `기록을 불러오지 못했습니다: ${safeMessage}`);
        }
        return root;
      }

      if (status !== 'ok' || !Array.isArray(data)) {
        appendText(root, 'p', '확인 불가');
        return root;
      }

      const events = [...data].sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
      if (events.length === 0) {
        appendText(root, 'p', '표시할 기록이 없습니다');
        return root;
      }

      const kindLabels = { access: '접속 기록(access)', xdr: 'XDR 경보(xdr)' };
      const accessLabels = { allowed: '허용(allowed)', denied: '거부(denied)', unknown: '확인 불가(unknown)' };
      const stateLabels = {
        access: { allowed: '허용', denied: '거부', unknown: '확인 불가' },
        session: { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' },
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' },
      };
      const stateText = (kind, value) => `${stateLabels[kind]?.[value] ?? '확인 불가'}(${value ?? 'unknown'})`;
      const optionValues = (values) => [...new Set(values)];
      const appValue = (event) => event.appId ?? '';
      const filteredEvents = () => events.filter((event) => (
        (eventViewState.filters.kind === 'all' || event.kind === eventViewState.filters.kind)
        && (eventViewState.filters.appId === 'all' || appValue(event) === eventViewState.filters.appId)
        && (eventViewState.filters.access === 'all' || event.state.access === eventViewState.filters.access)
      ));

      const makeFilter = (labelText, id, values, labels, filterKey) => {
        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;
        const select = document.createElement('select');
        select.id = id;
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '전체';
        select.appendChild(allOption);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = labels(value);
          select.appendChild(option);
        }
        select.value = eventViewState.filters[filterKey];
        select.addEventListener('change', () => {
          eventViewState.filters[filterKey] = select.value;
          renderList();
        });
        label.appendChild(select);
        return label;
      };

      const filters = document.createElement('div');
      filters.className = 'student-event-filters';
      filters.appendChild(makeFilter('기록 종류', 'student-event-kind', optionValues(events.map((event) => event.kind)), (value) => kindLabels[value] ?? `확인 불가(${value})`, 'kind'));
      filters.appendChild(makeFilter('업무 앱', 'student-event-app', optionValues(events.map(appValue)), (value) => value || '앱 확인 불가', 'appId'));
      filters.appendChild(makeFilter('접속 상태', 'student-event-access', optionValues(events.map((event) => event.state.access)), (value) => accessLabels[value] ?? `확인 불가(${value})`, 'access'));
      root.appendChild(filters);

      const list = document.createElement('ul');
      list.className = 'student-event-list';
      const detailSlot = document.createElement('div');
      detailSlot.className = 'student-event-detail-slot';
      root.appendChild(list);
      root.appendChild(detailSlot);

      const showListItem = (event) => {
        const item = document.createElement('li');
        item.setAttribute('data-student-event-id', event.id);
        appendText(item, 'p', `사건 ID: ${event.id}`);
        appendText(item, 'p', `시각: ${event.at}`);
        appendText(item, 'p', `종류: ${kindLabels[event.kind] ?? `확인 불가(${event.kind})`}`);
        appendText(item, 'p', `업무 앱: ${event.appId || '앱 확인 불가'}`);
        appendText(item, 'p', `요약: ${event.summary}`);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${event.id} 상세`;
        button.addEventListener('click', () => {
          eventViewState.selectedId = event.id;
          showDetail(event);
        });
        item.appendChild(button);
        return item;
      };

      const showDetail = (event) => {
        detailSlot.textContent = '';
        if (!event) return;
        const detail = document.createElement('section');
        detail.setAttribute('data-student-event-detail', event.id);
        appendText(detail, 'h4', `${event.id} 상세`);
        appendText(detail, 'p', `사건 ID: ${event.id}`);
        appendText(detail, 'p', `업무 앱: ${event.appId || '앱을 확인할 수 없습니다'}`);

        appendText(detail, 'h5', '근거(evidence)');
        const evidenceList = document.createElement('ul');
        for (const evidence of event.evidence) appendText(evidenceList, 'li', `${evidence.id}: ${evidence.text}`);
        detail.appendChild(evidenceList);

        appendText(detail, 'h5', '규칙(rules)');
        const rulesList = document.createElement('ul');
        for (const rule of event.rules) appendText(rulesList, 'li', `${rule.id}: ${rule.text}`);
        detail.appendChild(rulesList);

        appendText(detail, 'h5', '상태(state)');
        appendText(detail, 'p', `접속 상태: ${stateText('access', event.state.access)}`);
        appendText(detail, 'p', `세션 상태: ${stateText('session', event.state.session)}`);
        appendText(detail, 'p', `기기 상태: ${stateText('device', event.state.device)}`);
        if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
          appendText(detail, 'h5', '미지원 조치');
          for (const action of event.supportedActions) {
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = true;
            button.textContent = `${action} 미지원`;
            detail.appendChild(button);
          }
          appendText(detail, 'p', '조치 실행 연결은 아직 지원하지 않습니다. 요청을 보내지 않습니다.');
        }
        detailSlot.appendChild(detail);
      };

      const renderList = () => {
        list.textContent = '';
        const visibleEvents = filteredEvents();
        if (visibleEvents.length === 0) {
          appendText(list, 'li', '표시할 기록이 없습니다');
          detailSlot.textContent = '';
          return;
        }
        for (const event of visibleEvents) list.appendChild(showListItem(event));
        const selectedEvent = visibleEvents.find((event) => event.id === eventViewState.selectedId);
        showDetail(selectedEvent);
      };

      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const safeMessage = (resource) => typeof resource?.error?.message === 'string' && resource.error.message.length > 0
        ? resource.error.message
        : '확인 불가';
      const statusText = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const statusValue = (value) => `${statusText[value] ?? '확인 불가'}(${value ?? 'unknown'})`;

      appendText(root, 'h3', '알림·연결 상태·도움정보');

      const showResource = (title, resource, emptyText, showData) => {
        const section = document.createElement('section');
        appendText(section, 'h4', title);
        if (resource?.status === 'loading') {
          appendText(section, 'p', '불러오는 중');
        } else if (resource?.status === 'error') {
          const code = typeof resource.error?.code === 'string' ? resource.error.code : '';
          const timeout = code.includes('TIMEOUT');
          appendText(section, 'p', `${title}${timeout ? ' 조회 시간 초과' : ' 조회 실패'}: ${safeMessage(resource)}`);
          appendText(section, 'p', '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.');
        } else if (resource?.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) appendText(section, 'p', emptyText);
          else showData(section, resource.data);
        } else {
          appendText(section, 'p', '확인 불가');
        }
        root.appendChild(section);
      };

      showResource('기기', devices, '등록된 기기가 없습니다.', (section, rows) => {
        for (const device of rows) {
          appendText(section, 'p', `기기: ${device.label} · 상태: ${statusValue(device.status)}`);
        }
      });
      showResource('세션', sessions, '현재 연결 없음', (section, rows) => {
        appendText(section, 'p', '현재 검증된 연결 1개만 표시합니다. 과거 세션 목록이 아닙니다.');
        for (const session of rows) {
          appendText(section, 'p', `세션 ID: ${session.id} · 상태: ${statusValue(session.status)}`);
        }
      });

      const notificationSection = document.createElement('section');
      appendText(notificationSection, 'h4', '알림');
      if (!Array.isArray(notifications) || notifications.length === 0) {
        appendText(notificationSection, 'p', '주의할 알림이 없습니다.');
      } else {
        const list = document.createElement('ul');
        for (const notification of notifications) {
          appendText(list, 'li', `자료: ${notification.resource} · 코드: ${notification.code} · 내용: ${notification.message}`);
        }
        notificationSection.appendChild(list);
      }
      root.appendChild(notificationSection);

      const diagnosticsSection = document.createElement('section');
      appendText(diagnosticsSection, 'h4', '도움정보');
      if (diagnostics?.status === 'loading') {
        appendText(diagnosticsSection, 'p', '도움정보를 불러오는 중');
      } else if (diagnostics?.status === 'error') {
        appendText(diagnosticsSection, 'p', `도움정보를 불러오지 못했습니다: ${safeMessage(diagnostics)}`);
      } else if (diagnostics?.status === 'ok' && diagnostics.data) {
        const data = diagnostics.data;
        const safeHelp = {
          requestId: data.requestId ?? '확인 불가',
          component: data.component ?? '확인 불가',
          version: data.version ?? '확인 불가',
          checkedAt: data.checkedAt ?? '확인 불가',
          engine: {
            mode: data.engine?.mode ?? '확인 불가',
            code: data.engine?.code ?? '확인 불가',
          },
        };
        appendText(diagnosticsSection, 'p', '도움 요청에 사용할 비밀 없는 진단 정보입니다.');
        appendText(diagnosticsSection, 'p', `requestId: ${safeHelp.requestId}`);
        appendText(diagnosticsSection, 'p', `component: ${safeHelp.component}`);
        appendText(diagnosticsSection, 'p', `version: ${safeHelp.version}`);
        appendText(diagnosticsSection, 'p', `checkedAt: ${safeHelp.checkedAt}`);
        appendText(diagnosticsSection, 'p', `engine.mode: ${safeHelp.engine.mode}`);
        appendText(diagnosticsSection, 'p', `engine.code: ${safeHelp.engine.code}`);
        const safeHelpText = [
          `requestId: ${safeHelp.requestId}`,
          `component: ${safeHelp.component}`,
          `version: ${safeHelp.version}`,
          `checkedAt: ${safeHelp.checkedAt}`,
          `engine.mode: ${safeHelp.engine.mode}`,
          `engine.code: ${safeHelp.engine.code}`,
        ].join('\n');
        const copyStatus = appendText(diagnosticsSection, 'p', '복사 전에는 어디에도 전송하지 않습니다.');
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.textContent = '도움정보 복사';
        copyButton.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(safeHelpText);
            copyStatus.textContent = '도움정보를 클립보드에 복사했습니다.';
          } catch {
            copyStatus.textContent = '도움정보를 복사하지 못했습니다.';
          }
        });
        diagnosticsSection.appendChild(copyButton);
      } else if (diagnostics?.status === 'ok') {
        appendText(diagnosticsSection, 'p', '도움정보를 확인할 수 없습니다.');
      } else {
        appendText(diagnosticsSection, 'p', '도움정보 조회 전입니다.');
      }
      root.appendChild(diagnosticsSection);
      return root;
    },
    renderVulnerabilities({ status, mode, data, error }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const displayValue = (value, fallback = '확인 불가') => (
        value === null || value === undefined || value === '' ? fallback : String(value)
      );
      const scanStatusLabels = {
        complete: '모두 조회',
        partial: '일부 조회 실패',
        not_checked: '아직 조회 안 함',
        not_configured: '조회 준비 미완료',
        unverifiable: 'lock 파일 확인 불가',
      };
      const packageStatusLabels = {
        known_vulnerabilities: '알려진 항목 있음',
        none_found: '조회 범위에서 알려진 항목 없음',
        unverifiable: '조회 확인 불가',
      };

      appendText(root, 'h3', '설치 패키지 취약점 조회');

      if (status === 'idle') {
        appendText(root, 'p', '설치 패키지 취약점 조회 전(idle)');
        return root;
      }

      if (status === 'loading') {
        appendText(root, 'p', '설치 패키지 취약점 조회 중(loading)');
        appendText(root, 'p', '조회가 끝날 때까지 이전 결과를 현재 결과로 표시하지 않습니다.');
        return root;
      }

      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message.length > 0
          ? error.message
          : '설치 패키지 취약점 조회에 실패했습니다.';
        appendText(root, 'p', '설치 패키지 취약점 조회 실패(error)');
        appendText(root, 'p', `조회 실패: ${message}`);
        appendText(root, 'p', '취약점 없음으로 간주하지 않습니다. 필요하면 직접 다시 조회하세요.');
        return root;
      }

      if (status !== 'ok' || !data || typeof data !== 'object') {
        appendText(root, 'p', `설치 패키지 취약점 조회 결과를 확인할 수 없습니다(${displayValue(status, 'unknown')}).`);
        return root;
      }

      const scanStatus = typeof data.status === 'string' ? data.status : 'unknown';
      appendText(root, 'p', `${scanStatusLabels[scanStatus] ?? '확인 불가'}(${scanStatus})`);

      if (data.lockfileVersion !== undefined) {
        appendText(root, 'p', `lockfileVersion: ${displayValue(data.lockfileVersion)}`);
      }
      if (data.lockfileHash !== undefined) {
        appendText(root, 'p', `lockfileHash: ${displayValue(data.lockfileHash)}`);
      }
      if (data.checkedAt !== undefined) {
        appendText(root, 'p', `전체 확인 시각: ${displayValue(data.checkedAt)}`);
      }

      const packages = Array.isArray(data.packages) ? data.packages : [];
      if (packages.length === 0) {
        appendText(root, 'p', '표시할 패키지 조회 결과가 없습니다. 조회하지 않음·설정 미완료·확인 불가일 수 있습니다.');
        return root;
      }

      const packageList = document.createElement('ul');
      for (const packageData of packages) {
        const packageItem = document.createElement('li');
        if (packageData && packageData.name !== undefined) {
          packageItem.setAttribute('data-student-package-name', String(packageData.name));
        }
        if (packageData && packageData.version !== undefined) {
          packageItem.setAttribute('data-student-package-version', String(packageData.version));
        }

        appendText(packageItem, 'p', `패키지: ${displayValue(packageData?.name)}`);
        appendText(packageItem, 'p', `설치 버전: ${displayValue(packageData?.version)}`);
        const packageStatus = typeof packageData?.status === 'string' ? packageData.status : 'unknown';
        appendText(packageItem, 'p', `조회 상태: ${packageStatusLabels[packageStatus] ?? '확인 불가'}(${packageStatus})`);
        appendText(packageItem, 'p', `출처: ${displayValue(packageData?.source)}`);
        appendText(packageItem, 'p', `패키지 확인 시각: ${displayValue(packageData?.checkedAt)}`);

        const vulnerabilities = Array.isArray(packageData?.vulnerabilities) ? packageData.vulnerabilities : [];
        if (packageStatus === 'none_found' && vulnerabilities.length === 0) {
          appendText(packageItem, 'p', '조회 범위에서 알려진 취약점 항목이 없습니다. 전체 시스템의 안전을 보장하는 뜻은 아닙니다.');
        } else if (packageStatus === 'unverifiable') {
          appendText(packageItem, 'p', vulnerabilities.length > 0
            ? '일부 확인·전체 조회 확인 불가: 이미 받은 취약점 ID를 표시합니다.'
            : '이 패키지의 취약점 조회 결과를 확인할 수 없습니다.');
        }

        if (vulnerabilities.length > 0) {
          const vulnerabilityList = document.createElement('ul');
          for (const vulnerability of vulnerabilities) {
            appendText(vulnerabilityList, 'li', `취약점 ID: ${displayValue(vulnerability?.id)} · 수정 시각: ${displayValue(vulnerability?.modified)}`);
          }
          packageItem.appendChild(vulnerabilityList);
        }
        packageList.appendChild(packageItem);
      }
      root.appendChild(packageList);
      return root;
    },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const safeCode = typeof error?.code === 'string' && error.code.length > 0
        ? error.code
        : 'AI_REQUEST_UNVERIFIED';
      const safeMessage = typeof error?.message === 'string' && error.message.length > 0
        ? error.message
        : 'AI 연결 또는 응답을 확인할 수 없습니다.';
      const codeGuidance = {
        ON_AI_PROVISIONING_PENDING: '권한 준비 중·확인 불가: 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        ON_AI_AUTHORIZATION_CHANGED: '권한 준비 중·확인 불가: 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        WB_CLCO_AUTH_REQUIRED: '인증 실패: 계정 연결과 앱 전용 권한을 다시 확인하세요. Workbench 열쇠를 복사하지 마세요.',
        WB_CLCO_ACCESS_BLOCKED: '접근 제한: 학생 앱 이용 권한을 담당자와 확인하세요.',
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: '사용량·한도: 담당자에게 확인하세요.',
        WB_CLCO_LIMIT_REACHED: '사용량·한도: 담당자에게 확인하세요.',
        WB_CLCO_SESSION_CLOSED: '이용 시간이 아닙니다: 이용 시간을 확인하세요.',
        WB_CLCO_RATE_LIMITED: '요청 제한: 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_TIMEOUT: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        TIMEOUT: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        REQUEST_TIMEOUT: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        ENGINE_TIMEOUT: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_NETWORK_ERROR: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_SERVER_UNAVAILABLE: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_REQUEST_FAILED: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        AI_REQUEST_UNVERIFIED: '시간 초과·네트워크·확인 불가: 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_CANCELLED: '취소됨: 이전 결과는 현재 결과가 아닙니다.',
        CANCELLED: '취소됨: 이전 결과는 현재 결과가 아닙니다.',
        REQUEST_CANCELLED: '취소됨: 이전 결과는 현재 결과가 아닙니다.',
        ON_AI_MODEL_LIST_EMPTY: '모델 없음: 담당자에게 모델 허용 설정 확인을 요청하세요.',
        MODEL_NOT_CONFIGURED: '모델 없음: 담당자에게 모델 허용 설정 확인을 요청하세요.',
      };

      appendText(root, 'h3', '앱 내부 AI 연결 점검');
      appendText(root, 'p', '이 화면은 앱 안 수업용 AI 연결만 점검합니다. Workbench 수업용 AI와 ALEPH 공식 과제 판정 AI의 결과가 아닙니다.');

      if (status === 'idle') {
        appendText(root, 'p', 'AI 연결 점검 전');
        appendText(root, 'p', '연결 점검은 제공 화면의 버튼을 직접 눌러 시작하세요. 자동으로 점검하지 않습니다.');
        return root;
      }

      if (status === 'loading') {
        appendText(root, 'p', 'AI 연결 점검 중');
        appendText(root, 'p', '점검이 끝날 때까지 기다리세요. 다시 점검하거나 취소하는 동작은 제공 화면의 버튼을 직접 누르세요.');
        return root;
      }

      if (status === 'error') {
        appendText(root, 'p', `오류 코드: ${safeCode}`);
        appendText(root, 'p', `오류 메시지: ${safeMessage}`);
        appendText(root, 'p', codeGuidance[safeCode] ?? '원인을 확인할 수 없습니다. 담당자에게 확인하세요.');
        appendText(root, 'p', '다시 점검하려면 제공 화면의 점검 버튼을 직접 누르세요. 자동으로 다시 점검하지 않습니다.');
        return root;
      }

      if (status !== 'ok' || !data) {
        appendText(root, 'p', 'AI 연결 점검 결과를 확인할 수 없습니다.');
        return root;
      }

      const authorizationLabels = {
        test: '시험 연결 점검(test)',
        verified: '앱 권한 확인 후 점검(verified)',
      };
      const authorization = typeof data.audienceAuthorization === 'string'
        ? data.audienceAuthorization
        : 'unknown';
      appendText(root, 'p', authorizationLabels[authorization] ?? `확인 불가(${authorization})`);
      appendText(root, 'p', `응답 모델 수: ${data.modelCount ?? '확인 불가'}`);
      appendText(root, 'p', `점검 시각: ${checkedAt ?? '확인 불가'}`);
      appendText(root, 'p', '연결만 점검했으며 사건 설명은 아직 실행하지 않았습니다.');
      appendText(root, 'p', explanationAccepted === true
        ? '사건 설명 실행 여부는 별도 결과로 확인합니다.'
        : '사건 설명은 보안 기록에서 별도로 요청하고 확인합니다.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const displayValue = (value, fallback = '확인 불가') => (
        typeof value === 'string' && value.length > 0 ? value : fallback
      );
      const safeCode = typeof explanation?.error?.code === 'string' && explanation.error.code.length > 0
        ? explanation.error.code
        : 'AI_REQUEST_UNVERIFIED';
      const safeMessage = typeof explanation?.error?.message === 'string' && explanation.error.message.length > 0
        ? explanation.error.message
        : '사건 설명을 확인할 수 없습니다.';
      const stateLabels = { access: '접속', session: '세션', device: '기기' };
      const stateDescriptions = {
        access: { allowed: '허용', denied: '거부', unknown: '확인 불가' },
        session: { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' },
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' },
      };

      appendText(root, 'h3', '보안 기록 사건 설명');
      if (!event) {
        appendText(root, 'p', '보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }

      if (explanation?.status === 'loading') {
        appendText(root, 'p', `사건 ${displayValue(event.id)} 설명 요청 중`);
        return root;
      }

      if (explanation?.status === 'error') {
        appendText(root, 'p', `사건 설명 실패(${safeCode})`);
        appendText(root, 'p', `오류 메시지: ${safeMessage}`);
        appendText(root, 'p', '기록은 그대로입니다. AI 설명 실패는 접근 거부 판정이나 보안 조치 실행을 뜻하지 않습니다.');
        return root;
      }

      if (explanation?.status !== 'ok' || !explanation.data || typeof explanation.data.summary !== 'string') {
        appendText(root, 'p', '사건 설명을 확인할 수 없습니다.');
        return root;
      }

      const eventId = typeof event.id === 'string' && event.id.length > 0 ? event.id : null;
      if (!eventId) {
        appendText(root, 'p', '사건 ID를 확인할 수 없어 AI 설명을 표시하지 않습니다.');
        return root;
      }

      const data = explanation.data;
      const eventEvidence = Array.isArray(event.evidence) ? event.evidence : [];
      const evidenceIds = Array.isArray(data.evidenceIds) ? data.evidenceIds : [];
      const evidenceById = new Map(eventEvidence.map(item => [item?.id, item]));
      const missingEvidenceIds = evidenceIds.filter(id => !evidenceById.has(id));
      const proposals = Array.isArray(data.proposals) ? data.proposals : [];
      const missingProposalEvidence = proposals.flatMap(proposal => {
        const proposalEvidenceIds = Array.isArray(proposal?.evidenceIds) ? proposal.evidenceIds : [];
        return proposalEvidenceIds.filter(id => !evidenceById.has(id));
      });

      if (data.executed !== false) {
        appendText(root, 'p', 'AI 설명의 실행 상태를 확인할 수 없어 내용을 표시하지 않습니다.');
        appendText(root, 'p', '이 화면에서는 보안 조치를 실행하지 않습니다.');
        return root;
      }

      if (evidenceIds.length === 0 || missingEvidenceIds.length > 0 || missingProposalEvidence.length > 0) {
        const missing = [...new Set([...missingEvidenceIds, ...missingProposalEvidence])];
        appendText(root, 'p', missing.length > 0
          ? `근거 ID ${missing.map(id => displayValue(id)).join(', ')}를 현재 기록에서 찾을 수 없습니다.`
          : '인용된 근거가 없어 AI 설명을 표시할 수 없습니다.');
        appendText(root, 'p', '근거가 맞지 않아 설명 내용을 지어내지 않습니다.');
        return root;
      }

      root.setAttribute('data-student-explanation-event', eventId);
      appendText(root, 'p', `사건 ID: ${eventId}`);
      appendText(root, 'h4', 'AI 설명(참고용)');
      appendText(root, 'p', `요약: ${data.summary}`);

      appendText(root, 'h4', '인용한 근거');
      const evidenceList = document.createElement('ul');
      for (const id of evidenceIds) {
        const item = evidenceById.get(id);
        appendText(evidenceList, 'li', `${displayValue(item.id)} — ${displayValue(item.text)}`);
      }
      root.appendChild(evidenceList);

      appendText(root, 'h4', '규칙');
      const rules = Array.isArray(event.rules) ? event.rules : [];
      if (rules.length === 0) {
        appendText(root, 'p', '연결된 규칙이 없습니다.');
      } else {
        const ruleList = document.createElement('ul');
        for (const rule of rules) {
          appendText(ruleList, 'li', `${displayValue(rule?.id)} — ${displayValue(rule?.text)}`);
        }
        root.appendChild(ruleList);
      }

      appendText(root, 'h4', '현재 상태');
      const state = event.state ?? {};
      const stateList = document.createElement('ul');
      const unknownStates = [];
      for (const key of ['access', 'session', 'device']) {
        const value = displayValue(state[key], 'unknown');
        const description = stateDescriptions[key][value] ?? '확인 불가';
        if (value === 'unknown' || description === '확인 불가') unknownStates.push(`${stateLabels[key]}: 확인 불가(${value})`);
        appendText(stateList, 'li', `${stateLabels[key]}: ${description}(${value})`);
      }
      root.appendChild(stateList);
      appendText(root, 'p', `확인 불가 상태: ${unknownStates.length > 0 ? unknownStates.join(' · ') : '없음'}`);

      appendText(root, 'h4', '제안');
      if (proposals.length === 0) {
        const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : [];
        appendText(root, 'p', supportedActions.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
          : 'AI가 제안한 조치가 없습니다.');
      } else {
        const proposalList = document.createElement('ul');
        for (const proposal of proposals) {
          const action = displayValue(proposal?.action);
          const proposalEvidenceIds = Array.isArray(proposal?.evidenceIds) ? proposal.evidenceIds : [];
          appendText(proposalList, 'li', `조치: ${action} · 이유: ${displayValue(proposal?.reason)} · 근거 ID: ${proposalEvidenceIds.map(id => displayValue(id)).join(', ')}`);
          appendText(proposalList, 'li', '사람 확인이 필요하며 실행되지 않았습니다.');
        }
        root.appendChild(proposalList);
      }
      appendText(root, 'p', `사람 확인 필요: ${data.requiresHumanConfirmation === true ? '예(true)' : '확인 불가'}`);
      appendText(root, 'p', '실행 상태: 미실행(false)');
      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error }) {
      const root = document.createElement('section');
      const appendText = (parent, tag, text) => {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.appendChild(element);
        return element;
      };
      const value = (input, fallback = '확인 불가') => (
        input === null || input === undefined || input === '' ? fallback : String(input)
      );
      const safeCode = typeof error?.code === 'string' && error.code.length > 0
        ? error.code
        : 'ACTION_RESULT_UNVERIFIED';
      const safeMessage = typeof error?.message === 'string' && error.message.length > 0
        ? error.message
        : (typeof message === 'string' && message.length > 0 ? message : '조치 결과를 확인할 수 없습니다.');
      const hasEventId = typeof event?.id === 'string' && event.id.length > 0;
      const requestId = typeof receipt?.requestId === 'string' && receipt.requestId.length > 0
        ? receipt.requestId
        : null;

      appendText(root, 'h3', '보안 조치 상태');

      if (hasEventId) {
        root.setAttribute('data-student-action-event', event.id);
      }
      if (requestId) {
        root.setAttribute('data-student-action-request', requestId);
      }

      const statusLabels = {
        idle: '아직 미실행(idle)',
        loading: '조치 준비 또는 결과 조회 중(loading)',
        prepared: '준비됨·미실행(prepared)',
        executing: '서버에 전달 중(executing) · 결과가 아직 확인되지 않았습니다',
        pending: '서버 접수·처리 중(pending) · ACK는 효과가 아닙니다',
        denied: '거절(denied)',
        failed: '실패(failed)',
        unknown: '결과 불명(unknown)',
        expired: '확인 기한 지남(expired)',
        error: '요청 처리 안 됨(error)',
      };
      appendText(root, 'p', statusLabels[status] ?? `확인 불가(${value(status, 'unknown')})`);

      if (status === 'idle') {
        appendText(root, 'p', '아직 조치를 실행하지 않았습니다. 제공 화면의 조치 흐름을 사용하세요.');
        return root;
      }

      if (status === 'loading') {
        appendText(root, 'p', '조치 준비 또는 연동 시스템 결과를 확인하는 중입니다. 결과는 아직 확인되지 않았습니다.');
      }

      if (hasEventId) appendText(root, 'p', `사건 ID: ${event.id}`);
      const evidenceIds = Array.isArray(event?.evidence)
        ? event.evidence.map(item => item?.id).filter(id => id !== undefined && id !== null && id !== '')
        : [];
      if (evidenceIds.length > 0) appendText(root, 'p', `근거 ID: ${evidenceIds.map(id => value(id)).join(', ')}`);
      if (actionId !== undefined && actionId !== null && actionId !== '') {
        appendText(root, 'p', `조치 ID: ${value(actionId)}`);
      }
      if (target) {
        appendText(root, 'p', `실제 대상 ID: ${value(target.id)} · 세대: ${value(target.generation)}`);
      }
      if (requestId || receipt?.receiptId || receipt?.version !== undefined) {
        appendText(root, 'p', `요청 ID: ${value(requestId)} · 영수증 ID: ${value(receipt?.receiptId)} · 버전: ${value(receipt?.version)}`);
      }
      if (confirmationExpiresAt !== undefined && confirmationExpiresAt !== null) {
        appendText(root, 'p', `확인 기한: ${value(confirmationExpiresAt)}`);
      }

      if (status === 'prepared') {
        appendText(root, 'p', '사건·근거·실제 대상을 확인한 뒤 사람 확인을 거쳐야 하며, 현재는 미실행입니다.');
      } else if (status === 'executing') {
        appendText(root, 'p', '서버에 전달 중이며 결과가 아직 없습니다. 완료 또는 효과 확인으로 표시하지 않습니다.');
      } else if (status === 'pending') {
        appendText(root, 'p', '서버가 요청을 접수해 처리 중입니다. 접수 응답(ACK)은 실행 성공이나 효과 확인이 아닙니다.');
      } else if (status === 'succeeded') {
        if (observation?.effectApplied === true) {
          appendText(root, 'p', '효과 확인(succeeded)');
          appendText(root, 'p', `관측 시각: ${value(observation.observedAt)}`);
          appendText(root, 'p', 'effectApplied: true');
        } else {
          appendText(root, 'p', '결과 불명(unknown): 효과가 적용되지 않았다고 판단하지 않습니다.');
          appendText(root, 'p', '연동 시스템 결과를 직접 재조회하세요.');
        }
      } else if (status === 'unknown') {
        appendText(root, 'p', '효과 없음으로도 성공으로도 판단하지 않습니다. 연동 시스템 결과를 직접 재조회하세요.');
      } else if (status === 'denied') {
        appendText(root, 'p', `연동 시스템이 조치를 거절했습니다: ${safeMessage}`);
      } else if (status === 'failed') {
        appendText(root, 'p', `연동 시스템 조치가 실패했습니다: ${safeMessage}`);
      } else if (status === 'expired') {
        appendText(root, 'p', '확인 기한이 지나 현재 준비로는 집행할 수 없습니다. 조치를 다시 준비하세요.');
      } else if (status === 'error') {
        appendText(root, 'p', `요청이 처리되지 않았습니다. 오류 코드: ${safeCode}`);
        appendText(root, 'p', `오류 메시지: ${safeMessage}`);
      }

      if (observation && status !== 'succeeded') {
        appendText(root, 'p', `관측 시각: ${value(observation.observedAt)} · effectApplied: ${value(observation.effectApplied)}`);
      }
      return root;
    },
  };
}
