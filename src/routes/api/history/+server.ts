import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionUserId } from '$server/session';
import { supabaseAdmin } from '$server/supabase';

export const GET: RequestHandler = async ({ cookies }) => {
  const userId = getSessionUserId(cookies);
  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabaseAdmin();
  const { data: attempts, error } = await client
    .from('pk_quiz_attempts')
    .select('id, created_at, category_slug, level_slug, total_score, duration_seconds')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !attempts) {
    return json({ error: 'Unable to load history' }, { status: 500 });
  }

  const { data: items } = await client
    .from('pk_attempt_items')
    .select('attempt_id, correct, score_delta, time_taken_seconds, question_id, user_answer_index')
    .in(
      'attempt_id',
      attempts.map((a) => a.id)
    );

  const questionIds = items?.map((item) => item.question_id).filter(Boolean) as string[];
  const { data: questionMeta } = questionIds.length
    ? await client
        .from('pk_questions')
        .select('id, topic_cluster, correct_index, rationale, choices')
        .in('id', questionIds)
    : { data: [] };

  const questionMap = new Map(questionMeta?.map((q) => [q.id, q]));
  const grouped = attempts.map((attempt) => ({
    ...attempt,
    items: (items ?? [])
      .filter((item) => item.attempt_id === attempt.id)
      .map((item) => ({
        correct: item.correct,
        scoreDelta: item.score_delta,
        timeTaken: item.time_taken_seconds,
        correctIndex: item.question_id ? questionMap.get(item.question_id)?.correct_index ?? null : null,
        topic_cluster: item.question_id ? questionMap.get(item.question_id)?.topic_cluster ?? null : null,
        rationale: item.question_id ? questionMap.get(item.question_id)?.rationale ?? null : null,
        choices: item.question_id ? (questionMap.get(item.question_id)?.choices as string[]) ?? [] : [],
        userAnswerIndex: item.user_answer_index
      }))
  }));

  return json({ attempts: grouped });
};
