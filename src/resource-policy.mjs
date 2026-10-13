// Resource IDs are stable zone labels. The record ID remains in the URL.
export const RESOURCE_IDS = Object.freeze({
  notes: 'notes',
  instructorAnnouncements: 'instructor_announcements',
});

const PATH_SEGMENT = /^[A-Za-z0-9._~-]+$/u;
const ROUTE_SEGMENT = /^(?:[A-Za-z0-9._~-]+|:id)$/u;
const NOTE_COLLECTION_METHODS = new Set(['GET', 'POST']);
const NOTE_ITEM_METHODS = new Set(['GET', 'PUT', 'DELETE']);

function routeParts(route) {
  if (typeof route !== 'string') return null;
  const separator = route.indexOf(' ');
  if (separator <= 0) return null;
  const method = route.slice(0, separator);
  const routePath = route.slice(separator + 1);
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)
      || !routePath.startsWith('/')) return null;
  const segments = routePath.slice(1).split('/');
  if (!segments.length || segments.some((segment) => !ROUTE_SEGMENT.test(segment))) return null;
  return { method, segments };
}

function pathMatchesRoute(method, path, route) {
  const parts = routeParts(route);
  if (!parts || parts.method !== method || typeof path !== 'string' || !path.startsWith('/')) {
    return null;
  }
  const pathSegments = path.slice(1).split('/');
  if (pathSegments.length !== parts.segments.length
      || pathSegments.some((segment) => !PATH_SEGMENT.test(segment))) return null;
  for (let index = 0; index < parts.segments.length; index += 1) {
    const routeSegment = parts.segments[index];
    const pathSegment = pathSegments[index];
    if (routeSegment === ':id') {
      if (pathSegment === 'export') return null;
    } else if (routeSegment !== pathSegment) {
      return null;
    }
  }
  return parts.segments;
}

// The route template supplies the resource boundary. It must contain the
// resource name and, for an item request, one final :id segment. Query data
// is deliberately not used to select a feature.
export function identifyResource({ service, method, path, route } = {}) {
  const segments = pathMatchesRoute(method, path, route);
  if (!segments) return null;

  if (service === 'notes' && segments.at(-1) === 'notes'
      && NOTE_COLLECTION_METHODS.has(method)) {
    return RESOURCE_IDS.notes;
  }

  if (service === 'notes' && segments.at(-2) === 'notes'
      && segments.at(-1) === ':id' && NOTE_ITEM_METHODS.has(method)) {
    return RESOURCE_IDS.notes;
  }

  if (service === 'announcements' && segments.at(-2) === 'announcements'
      && segments.at(-1) === ':id' && method === 'PUT') {
    return RESOURCE_IDS.instructorAnnouncements;
  }

  return null;
}

export function formatResource(resourceId, record) {
  return { resourceId, ...record };
}
