// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
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
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
