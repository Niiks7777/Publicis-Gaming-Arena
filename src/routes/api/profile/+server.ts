import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$server/supabase';
import { setSessionCookie, getSessionUserId } from '$server/session';
import { z } from 'zod';
import crypto from 'crypto';

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  agency: z.string().min(2).max(120),
  function: z.string().min(2).max(120)
});

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = supabaseAdmin();
  const existingId = getSessionUserId(cookies);

  const userId = existingId ?? crypto.randomUUID();

  const { error } = await client.from('pk_users').upsert(
    {
      id: userId,
      name: parsed.data.name,
      agency: parsed.data.agency,
      function: parsed.data.function
    },
    { onConflict: 'id' }
  );

  if (error) {
    console.error(error);
    return json({ error: 'Unable to save profile' }, { status: 500 });
  }

  setSessionCookie(cookies, userId);

  return json({ userId });
};
