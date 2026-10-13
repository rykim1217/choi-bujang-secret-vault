// Resource IDs are stable zone labels. The record ID remains in the URL.
export const RESOURCE_IDS = Object.freeze({
  notes: 'notes',
  instructorAnnouncements: 'instructor_announcements',
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RESOURCE_SEGMENT = /^[A-Za-z0-9_-]+$/u;
const RESERVED_FEATURES = new Set(['export']);
const NOTE_COLLECTION_METHODS = new Set(['GET', 'POST']);
const NOTE_ITEM_METHODS = new Set(['GET', 'PUT', 'DELETE']);

function exactRoute(method, path, route) {
  return route === `${method} ${path}`;
}

// This table intentionally has no query-driven feature selectors. A note or
// announcement is selected by its path ID, and export-like sibling paths do
// not match any entry.
export function identifyResource({ service, method, path, route, queryLength } = {}) {
  if (queryLength !== 0 || typeof method !== 'string' || typeof path !== 'string'
      || typeof route !== 'string') return null;

  if (service === 'notes' && path === '/api/notes'
      && NOTE_COLLECTION_METHODS.has(method) && exactRoute(method, path, route)) {
    return RESOURCE_IDS.notes;
  }

  if (service === 'notes' && method === 'GET' && path === '/notes'
      && exactRoute(method, path, route)) {
    return RESOURCE_IDS.notes;
  }

  if (service === 'notes' && NOTE_ITEM_METHODS.has(method)
      && /^\/api\/notes\/([^/]+)$/u.test(path)
      && UUID.test(path.slice('/api/notes/'.length))
      && exactRoute(method, '/api/notes/:id', route)) {
    return RESOURCE_IDS.notes;
  }

  const legacyNoteId = path.startsWith('/notes/') ? path.slice('/notes/'.length) : '';
  if (service === 'notes' && method === 'GET' && RESOURCE_SEGMENT.test(legacyNoteId)
      && !RESERVED_FEATURES.has(legacyNoteId)
      && exactRoute(method, '/notes/:id', route)) {
    return RESOURCE_IDS.notes;
  }

  if (service === 'announcements' && method === 'PUT'
      && /^\/api\/announcements\/([^/]+)$/u.test(path)
      && UUID.test(path.slice('/api/announcements/'.length))
      && exactRoute(method, '/api/announcements/:id', route)) {
    return RESOURCE_IDS.instructorAnnouncements;
  }

  return null;
}

export function formatResource(resourceId, record) {
  return { resourceId, ...record };
}
