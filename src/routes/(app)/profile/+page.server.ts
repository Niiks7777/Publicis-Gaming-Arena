import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabaseAdmin } from '$server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/');
  }

  const client = supabaseAdmin();
  const { data: attempts } = await client
    .from('pk_quiz_attempts')
    .select('id, created_at, total_score, level_slug, category_slug, duration_seconds')
    .eq('user_id', locals.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    user: locals.user,
    attempts: attempts ?? []
  };
};
