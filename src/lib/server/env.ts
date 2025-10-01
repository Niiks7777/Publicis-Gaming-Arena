import { env } from '$env/dynamic/private';

export const OPENAI_API_KEY = env.OPENAI_API_KEY;
export const SUPABASE_URL = env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
export const SESSION_SECRET = env.SESSION_SECRET ?? 'unsafe_default';
