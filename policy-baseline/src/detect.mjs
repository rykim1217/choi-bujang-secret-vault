const WINDOW_MS = 10 * 60 * 1000;
const BURST_LIMIT = 120;

function readEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;

  const subject = event.identity?.sub;
  if (typeof event.at !== 'string' || !event.at.trim()
      || event.method !== 'GET'
      || typeof subject !== 'string' || !subject.trim()) return null;

  const timestamp = Date.parse(event.at);
  if (!Number.isFinite(timestamp)) return null;

  return { timestamp, subject };
}

function hasBurst(timestamps) {
  const sorted = timestamps.toSorted((left, right) => left - right);
  let first = 0;

  for (let last = 0; last < sorted.length; last += 1) {
    while (sorted[last] - sorted[first] > WINDOW_MS) first += 1;
    if (last - first + 1 > BURST_LIMIT) return true;
  }
  return false;
}

// The practice contract supplies only at, method, and identity.sub.
// Ignore all other input fields and never log or return their contents.
export function detect(events) {
  if (!Array.isArray(events)) throw new TypeError('invalid_detection_events');

  const readsBySubject = new Map();
  for (const event of events) {
    const read = readEvent(event);
    if (!read) continue;

    const timestamps = readsBySubject.get(read.subject) ?? [];
    timestamps.push(read.timestamp);
    readsBySubject.set(read.subject, timestamps);
  }

  for (const [subject, timestamps] of readsBySubject) {
    if (hasBurst(timestamps)) {
      return { action: 'propose_revocation', reasonCode: 'burst_read', subject };
    }
  }

  return { action: 'observe' };
}
