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
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
