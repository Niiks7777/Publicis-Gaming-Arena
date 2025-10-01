import type { LayoutServerLoad } from './$types';
import { supabaseAdmin } from '$server/supabase';

export const load: LayoutServerLoad = async ({ locals }) => {
  const client = supabaseAdmin();
  const [{ data: categories }, { data: levels }] = await Promise.all([
    client.from('pk_categories').select('id, slug, label').order('label'),
    client.from('pk_levels').select('id, slug, label').order('label')
  ]);

  return {
    user: locals.user,
    categories: categories ?? [],
    levels: levels ?? []
  };
};
