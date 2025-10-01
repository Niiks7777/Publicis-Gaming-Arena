import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabaseAdmin } from '$server/supabase';
import { getSessionUserId } from '$server/session';
import { clampLevel, computeScoreDelta } from '$lib/utils/score';
import { z } from 'zod';

const submitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        userAnswerIndex: z.number().min(0).max(3).nullable(),
        timeTaken: z.number().min(0).max(60)
      })
    )
    .length(10)
});

export const POST: RequestHandler = async ({ request, cookies }) => {
  const userId = getSessionUserId(cookies);
  if (!userId) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = submitSchema.safeParse(body);

  if (!parsed.success) {
    return json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client = supabaseAdmin();

  const { data: attempt, error: attemptError } = await client
    .from('pk_quiz_attempts')
    .select('*')
    .eq('id', parsed.data.attemptId)
    .eq('user_id', userId)
    .single();

  if (attemptError || !attempt) {
    return json({ error: 'Attempt not found' }, { status: 404 });
  }

  const { data: questions, error: questionsError } = await client
    .from('pk_questions')
    .select('id, correct_index, topic_cluster, rationale')
    .in(
      'id',
      parsed.data.answers.map((a) => a.questionId)
    );

  if (questionsError) {
    return json({ error: 'Unable to fetch questions' }, { status: 500 });
  }

  const questionMap = new Map(questions?.map((q) => [q.id, q]));
  const level = clampLevel(attempt.level_slug);

  let totalScore = 0;
  let totalDuration = 0;

  const itemsPayload = parsed.data.answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    const correct = question ? question.correct_index === answer.userAnswerIndex : false;
    const scoreDelta = computeScoreDelta(level, correct);
    totalScore += scoreDelta;
    totalDuration += answer.timeTaken;
    return {
      attempt_id: attempt.id,
      question_id: question?.id ?? null,
      user_answer_index: answer.userAnswerIndex,
      correct,
      time_taken_seconds: answer.timeTaken,
      score_delta: scoreDelta
    };
  });

  const { error: insertItemsError } = await client.from('pk_attempt_items').insert(itemsPayload);

  if (insertItemsError) {
    console.error(insertItemsError);
    return json({ error: 'Unable to persist attempt items' }, { status: 500 });
  }

  const { error: updateAttemptError } = await client
    .from('pk_quiz_attempts')
    .update({ total_score: totalScore, duration_seconds: totalDuration })
    .eq('id', attempt.id);

  if (updateAttemptError) {
    console.error(updateAttemptError);
  }

  const { data: user } = await client
    .from('pk_users')
    .select('agency')
    .eq('id', userId)
    .single();

  await client.from('pk_leaderboard').insert({
    user_id: userId,
    agency: user?.agency ?? 'unknown',
    category_slug: attempt.category_slug,
    level_slug: attempt.level_slug,
    score: totalScore
  });

  const breakdown = itemsPayload.map((item) => ({
    questionId: item.question_id,
    correct: item.correct,
    scoreDelta: item.score_delta,
    timeTaken: item.time_taken_seconds,
    correctIndex: item.question_id ? questionMap.get(item.question_id)?.correct_index ?? null : null,
    topic_cluster: item.question_id ? questionMap.get(item.question_id)?.topic_cluster ?? null : null,
    rationale: item.question_id ? questionMap.get(item.question_id)?.rationale ?? null : null
  }));

  return json({
    totalScore,
    durationSeconds: totalDuration,
    breakdown
  });
};
