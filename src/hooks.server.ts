import type { Handle } from '@sveltejs/kit';
import { getSessionUserId } from '$server/session';
import { supabaseAdmin } from '$server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  const userId = getSessionUserId(event.cookies);
  if (userId) {
    const client = supabaseAdmin();
    const { data, error } = await client
      .from('pk_users')
      .select('id, name, agency, function')
      .eq('id', userId)
      .maybeSingle();
    if (!error && data) {
      event.locals.user = {
        id: data.id,
        name: data.name,
        agency: data.agency,
        function: data.function
      };
    } else {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};
