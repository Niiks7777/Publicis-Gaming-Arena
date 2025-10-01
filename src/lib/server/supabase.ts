import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './env';

export const supabaseAdmin = () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are not set');
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false
    }
  });
};
