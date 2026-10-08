import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  getCookie,
  getRequestHeader,
  sameOriginRequest,
  setSessionCookies,
} from '../src/auth-session.mjs';
import { createLoginVerifier } from '../src/verify-login.mjs';

const config = JSON.parse(readFileSync(new URL('../aleph.config.json', import.meta.url), 'utf8'));
let loginVerifier;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function getLoginVerifier(supabaseSecretKey) {
  loginVerifier ??= createLoginVerifier({ config, supabaseSecretKey });
  return loginVerifier;
}

export async function getAuthenticatedContext(request, response) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    response.status(500).json({ error: 'SERVER_CONFIGURATION_ERROR' });
    return null;
  }

  const authorization = getRequestHeader(request, 'authorization');
  const accessToken = getCookie(request, ACCESS_COOKIE);
  const cookieAuthorization = accessToken ? `Bearer ${accessToken}` : '';
  const candidateAuthorization = authorization || cookieAuthorization;
  const verifyLogin = getLoginVerifier(supabaseSecretKey);
  let principal = candidateAuthorization ? await verifyLogin(candidateAuthorization) : null;

  if (!principal && !authorization) {
    const refreshToken = getCookie(request, REFRESH_COOKIE);
    if (refreshToken) {
      const refresh = await createClient(supabaseUrl, supabaseSecretKey, {
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      }).auth.refreshSession({ refresh_token: refreshToken });
      if (!refresh.error && refresh.data?.session?.access_token
          && refresh.data.session.refresh_token) {
        setSessionCookies(response, refresh.data.session);
        principal = await verifyLogin(`Bearer ${refresh.data.session.access_token}`);
      }
    }
  }

  if (!principal) {
    response.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
    return null;
  }

  return { principal, supabase: createClient(supabaseUrl, supabaseSecretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  }) };
}

export function requireSameOrigin(request, response) {
  if (sameOriginRequest(request, config)) return true;
  response.status(403).json({ error: 'CSRF_ORIGIN_REJECTED' });
  return false;
}

export function formatNote(note) {
  return { id: note.id, title: note.title, body: note.content };
}

function parseBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body !== 'string') return null;
  try { return JSON.parse(request.body); } catch { return null; }
}

function validText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');

  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  if (request.method === 'POST' && !requireSameOrigin(request, response)) return;

  const context = await getAuthenticatedContext(request, response);
  if (!context) return;

  if (request.method === 'POST') {
    const input = parseBody(request);
    if (!input || !validText(input.title) || !validText(input.body)
        || (input.id !== undefined && (!validText(input.id) || !UUID.test(input.id)))) {
      return response.status(400).json({ error: 'INVALID_NOTE' });
    }
    const id = input.id ?? randomUUID();
    const { data, error } = await context.supabase
      .from('vault_notes')
      .insert({ id, owner_id: context.principal.userId, title: input.title, content: input.body })
      .select('id')
      .single();
    if (error) return response.status(502).json({ error: 'NOTE_CREATE_FAILED' });
    return response.status(201).json({ id: data.id });
  }

  const { data, error } = await context.supabase
    .from('vault_notes')
    .select('id, title, content')
    .eq('owner_id', context.principal.userId)
    .order('created_at', { ascending: true });

  if (error) {
    return response.status(502).json({ error: 'NOTES_LOOKUP_FAILED' });
  }

  return response.status(200).json({ notes: (data ?? []).map(formatNote) });
}
