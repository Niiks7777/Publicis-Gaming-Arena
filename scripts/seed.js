import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });

const seed = async () => {
  await client.from('pk_categories').upsert(
    [
      { slug: 'media-planning', label: 'Media Planning' },
      { slug: 'performance', label: 'Performance' },
      { slug: 'seo', label: 'SEO' },
      { slug: 'creative', label: 'Creative' },
      { slug: 'strategy', label: 'Strategy' }
    ],
    { onConflict: 'slug' }
  );

  await client.from('pk_levels').upsert(
    [
      { slug: 'beginner', label: 'Beginner' },
      { slug: 'intermediate', label: 'Intermediate' },
      { slug: 'expert', label: 'Expert' }
    ],
    { onConflict: 'slug' }
  );

  console.log('Seeded categories and levels');
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
