import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  getCookie,
  sameOriginRequest,
  setSessionCookies,
} from '../src/auth-session.mjs';

const config = JSON.parse(readFileSync(new URL('../aleph.config.json', import.meta.url), 'utf8'));

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body !== 'string') return null;
  try { return JSON.parse(request.body); } catch { return null; }
}

function createAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const authKey = process.env.SUPABASE_AUTH_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !authKey) return null;
  return createClient(supabaseUrl, authKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function safeUser(user) {
  return { email: typeof user?.email === 'string' ? user.email : null };
}

function csrfRejected(request, response) {
  if (sameOriginRequest(request, config)) return false;
  response.status(403).json({ error: 'CSRF_ORIGIN_REJECTED' });
  return true;
}

async function currentUser(client, request, response) {
  const accessToken = getCookie(request, ACCESS_COOKIE);
  if (accessToken) {
    const { data, error } = await client.auth.getUser(accessToken);
    if (!error && data?.user) return data.user;
  }

  const refreshToken = getCookie(request, REFRESH_COOKIE);
  if (!refreshToken) return null;
  const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data?.session?.access_token || !data.session.refresh_token) return null;
  setSessionCookies(response, data.session);
  return data.session.user ?? null;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST, DELETE');
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  if (request.method !== 'GET' && csrfRejected(request, response)) return;

  const client = createAuthClient();
  if (!client) return response.status(500).json({ error: 'SERVER_CONFIGURATION_ERROR' });

  if (request.method === 'POST') {
    const input = parseBody(request);
    if (typeof input?.email !== 'string' || !input.email.trim()
        || typeof input.password !== 'string' || !input.password) {
      return response.status(400).json({ error: 'INVALID_LOGIN' });
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: input.email.trim(), password: input.password,
    });
    if (error || !data?.session || !data.user) {
      clearSessionCookies(response);
      return response.status(401).json({ error: 'AUTHENTICATION_FAILED' });
    }

    setSessionCookies(response, data.session);
    return response.status(200).json({ authenticated: true, user: safeUser(data.user) });
  }

  if (request.method === 'DELETE') {
    clearSessionCookies(response);
    return response.status(200).json({ authenticated: false });
  }

  const user = await currentUser(client, request, response);
  if (!user) {
    clearSessionCookies(response);
    return response.status(200).json({ authenticated: false });
  }
  return response.status(200).json({ authenticated: true, user: safeUser(user) });
}
