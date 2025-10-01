import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$server/supabase';

type Scope = 'global' | 'category' | 'level' | 'agency';

export const GET: RequestHandler = async ({ url, locals }) => {
  const scope = (url.searchParams.get('scope') ?? 'global') as Scope;
  const category = url.searchParams.get('category');
  const level = url.searchParams.get('level');
  const agency = url.searchParams.get('agency');
  const limit = Number(url.searchParams.get('limit') ?? 10);

  const client = supabaseAdmin();
  const { data, error } = await client
    .from('pk_leaderboard')
    .select('user_id, agency, score, occurred_at, category_slug, level_slug, pk_users(name)')
    .order('occurred_at', { ascending: false })
    .limit(1000);

  if (error || !data) {
    console.error(error);
    return json({ error: 'Unable to load leaderboard' }, { status: 500 });
  }

  const filtered = data.filter((row) => {
    if (scope === 'category' && category) {
      return row.category_slug === category;
    }
    if (scope === 'level' && level) {
      return row.level_slug === level;
    }
    if (scope === 'agency' && agency) {
      return row.agency === agency;
    }
    return true;
  });

  if (scope === 'agency' && !agency) {
    return json({ error: 'Agency parameter required' }, { status: 400 });
  }

  if (scope === 'agency') {
    const totals = new Map<string, { agency: string; total: number }>();
    for (const row of filtered) {
      const key = row.agency ?? 'Unknown';
      const current = totals.get(key) ?? { agency: key, total: 0 };
      current.total += row.score;
      totals.set(key, current);
    }
    const aggregated = Array.from(totals.values()).sort((a, b) => b.total - a.total);
    const entries = aggregated.slice(0, limit).map((entry, index) => ({
      position: index + 1,
      agency: entry.agency,
      score: entry.total
    }));
    const rankIndex = aggregated.findIndex((entry) => entry.agency === locals.user?.agency);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    return json({ entries, rank });
  }

  const totals = new Map<
    string,
    {
      user_id: string;
      name: string;
      agency: string | null;
      total: number;
      lastPlayed: string;
    }
  >();
  for (const row of filtered) {
    const existing = totals.get(row.user_id) ?? {
      user_id: row.user_id,
      name: row.pk_users?.name ?? 'Anonymous',
      agency: row.agency,
      total: 0,
      lastPlayed: row.occurred_at
    };
    existing.total += row.score;
    existing.lastPlayed = row.occurred_at > existing.lastPlayed ? row.occurred_at : existing.lastPlayed;
    totals.set(row.user_id, existing);
  }

  let aggregated = Array.from(totals.values());
  if (scope === 'category' && category) {
    aggregated = aggregated.filter((entry) =>
      filtered.some((row) => row.user_id === entry.user_id && row.category_slug === category)
    );
  }
  if (scope === 'level' && level) {
    aggregated = aggregated.filter((entry) =>
      filtered.some((row) => row.user_id === entry.user_id && row.level_slug === level)
    );
  }

  aggregated.sort((a, b) => b.total - a.total);
  const entries = aggregated.slice(0, limit).map((entry, index) => ({
    position: index + 1,
    user_id: entry.user_id,
    name: entry.name,
    agency: entry.agency,
    score: entry.total,
    lastPlayed: entry.lastPlayed
  }));
  const rankIndex = aggregated.findIndex((entry) => entry.user_id === locals.user?.id);
  const rank = rankIndex >= 0 ? rankIndex + 1 : null;

  return json({ entries, rank });
};
