import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$server/supabase';

export const GET: RequestHandler = async () => {
  const client = supabaseAdmin();
  const [{ data: categories, error: catError }, { data: levels, error: lvlError }] = await Promise.all([
    client.from('pk_categories').select('id, slug, label').order('label'),
    client.from('pk_levels').select('id, slug, label').order('label')
  ]);

  if (catError || lvlError) {
    return json({ error: 'Unable to fetch catalog' }, { status: 500 });
  }

  return json({ categories, levels });
};
