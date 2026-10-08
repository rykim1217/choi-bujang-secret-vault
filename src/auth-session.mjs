export const ACCESS_COOKIE = 'vault_access';
export const REFRESH_COOKIE = 'vault_refresh';

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
const COOKIE_DATE = 'Thu, 01 Jan 1970 00:00:00 GMT';

function headerValue(request, name) {
  const headers = request?.headers;
  if (headers && typeof headers.get === 'function') return headers.get(name) ?? '';
  if (!headers || typeof headers !== 'object') return '';
  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find(candidate => candidate.toLowerCase() === wanted);
  return key ? String(headers[key] ?? '') : '';
}

function cookieValue(value) {
  try { return decodeURIComponent(value); } catch { return ''; }
}

export function getRequestHeader(request, name) {
  return headerValue(request, name);
}

export function getCookie(request, name) {
  const header = headerValue(request, 'cookie');
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return cookieValue(part.slice(separator + 1).trim());
  }
  return '';
}

function cookieHeader(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

function appendCookies(response, cookies) {
  const existing = typeof response.getHeader === 'function' ? response.getHeader('Set-Cookie') : null;
  const previous = Array.isArray(existing) ? existing : existing ? [existing] : [];
  response.setHeader('Set-Cookie', [...previous, ...cookies]);
}

export function setSessionCookies(response, session) {
  if (typeof session?.access_token !== 'string' || !session.access_token
      || typeof session.refresh_token !== 'string' || !session.refresh_token) {
    throw new TypeError('invalid_auth_session');
  }
  const expiresIn = Number.isSafeInteger(session.expires_in) && session.expires_in > 0
    ? session.expires_in : 3600;
  appendCookies(response, [
    cookieHeader(ACCESS_COOKIE, session.access_token, expiresIn),
    cookieHeader(REFRESH_COOKIE, session.refresh_token, REFRESH_MAX_AGE),
  ]);
}

export function clearSessionCookies(response) {
  appendCookies(response, [
    `${ACCESS_COOKIE}=; Path=/; Max-Age=0; Expires=${COOKIE_DATE}; HttpOnly; Secure; SameSite=Lax`,
    `${REFRESH_COOKIE}=; Path=/; Max-Age=0; Expires=${COOKIE_DATE}; HttpOnly; Secure; SameSite=Lax`,
  ]);
}

export function sameOriginRequest(request, config) {
  let expected;
  try { expected = new URL(config?.publicAppUrl).origin; } catch { return false; }
  if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.NODE_ENV === 'production') {
    return headerValue(request, 'origin') === expected;
  }
  return true;
}
