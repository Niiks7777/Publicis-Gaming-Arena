import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ensureQuestions, rateLimit } from '$server/question-generator';
import { supabaseAdmin } from '$server/supabase';
import { getSessionUserId } from '$server/session';
import { z } from 'zod';

const startSchema = z.object({
  categorySlug: z.string(),
  levelSlug: z.string()
});

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const userId = getSessionUserId(cookies);
  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = startSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const ip = getClientAddress();
  try {
    rateLimit(`${ip}:${userId}:start`, 60, 3);
  } catch (error) {
    return json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const client = supabaseAdmin();
  const questions = await ensureQuestions({
    category: parsed.data.categorySlug,
    level: parsed.data.levelSlug
  });

  const { data: attempt, error } = await client
    .from('pk_quiz_attempts')
    .insert({
      user_id: userId,
      category_slug: parsed.data.categorySlug,
      level_slug: parsed.data.levelSlug,
      total_score: 0,
      duration_seconds: 0
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return json({ error: 'Could not create attempt' }, { status: 500 });
  }

  return json({
    attemptId: attempt.id,
    questions: questions.map((q) => ({
      id: q.id,
      question: q.question,
      choices: q.choices,
      topic_cluster: q.topic_cluster
    }))
  });
};
