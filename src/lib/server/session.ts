import { createHmac, timingSafeEqual } from 'crypto';
import type { Cookies } from '@sveltejs/kit';
import { SESSION_SECRET } from './env';

const COOKIE_NAME = 'pka_session';

export interface SessionUser {
  id: string;
  name: string;
  agency: string;
  function: string;
}

const sign = (payload: string) => {
  const h = createHmac('sha256', SESSION_SECRET);
  h.update(payload);
  return h.digest('hex');
};

export const encodeSession = (userId: string) => {
  const value = `${userId}`;
  const signature = sign(value);
  return Buffer.from(`${value}.${signature}`).toString('base64url');
};

export const decodeSession = (cookie: string | undefined): string | null => {
  if (!cookie) return null;
  try {
    const decoded = Buffer.from(cookie, 'base64url').toString('utf8');
    const [value, signature] = decoded.split('.');
    if (!value || !signature) return null;
    const expected = sign(value);
    const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    return valid ? value : null;
  } catch (error) {
    console.error('Failed to decode session', error);
    return null;
  }
};

export const setSessionCookie = (cookies: Cookies, userId: string) => {
  cookies.set(COOKIE_NAME, encodeSession(userId), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 30
  });
};

export const clearSessionCookie = (cookies: Cookies) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
};

export const getSessionUserId = (cookies: Cookies): string | null => {
  const raw = cookies.get(COOKIE_NAME);
  return decodeSession(raw);
};
