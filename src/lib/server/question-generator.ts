import NodeCache from 'node-cache';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from './env';
import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  topic_cluster: string | null;
  rationale: string | null;
}

const cache = new NodeCache({ stdTTL: 60 });

const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

export const hashQuestion = (stem: string) =>
  crypto.createHash('sha256').update(stem).digest('hex').slice(0, 16);

type GenerationPayload = {
  category: string;
  level: string;
};

export const ensureQuestions = async (
  payload: GenerationPayload,
  desiredCount = 10
): Promise<QuizQuestion[]> => {
  const client = supabaseAdmin();
  const { data: existing } = await client
    .from('pk_questions')
    .select('*')
    .eq('category_slug', payload.category)
    .eq('level_slug', payload.level)
    .limit(desiredCount);

  const result: QuizQuestion[] = [];
  if (existing && existing.length >= desiredCount) {
    return existing.slice(0, desiredCount).map((row) => ({
      id: row.id,
      question: row.question,
      choices: row.choices as string[],
      topic_cluster: row.topic_cluster,
      rationale: row.rationale
    }));
  }

  const needed = desiredCount - (existing?.length ?? 0);
  const recentHashes = (existing ?? []).map((q) => q.hash_hint).filter(Boolean) as string[];

  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const generated: QuizQuestion[] = [];

  const avoidList = recentHashes.join(',');

  const tasks = Array.from({ length: needed }).map(async () => {
    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: `You are an assessment designer for Publicis Knowledge Arena.\nGenerate exactly 1 multiple-choice question for:\nCategory: ${payload.category}\nLevel: ${payload.level}\n\nConstraints:\n- 1 question stem, 4 plausible options (A–D), exactly 1 correct answer\n- No trick wording, no vague absolutes\n- Difficulty calibrated to the Level\n- Include a "topic_cluster" (e.g., “Bidding Strategy”, “Attribution”, “Keyword Research”)\n- Provide a brief one-sentence rationale explaining why the correct option is right\n- Strict JSON, no commentary, schema:\n{\n  "question": "string",\n  "choices": ["A", "B", "C", "D"],\n  "correctIndex": 0,\n  "topic_cluster": "string",\n  "rationale": "string",\n  "hash_hint": "short unique string"\n}\n\nAvoid these hashes: ${avoidList}`
        }
      ]
    });

    const content = response.output?.[0]?.content?.[0];
    if (content?.type !== 'output_text') {
      throw new Error('Unexpected OpenAI response format');
    }
    const parsed = JSON.parse(content.text);

    const hash = parsed.hash_hint ?? hashQuestion(parsed.question);
    if (recentHashes.includes(hash)) {
      throw new Error('Duplicate hash encountered');
    }

    const { data: inserted, error } = await client
      .from('pk_questions')
      .insert({
        category_slug: payload.category,
        level_slug: payload.level,
        question: parsed.question,
        choices: parsed.choices,
        correct_index: parsed.correctIndex,
        topic_cluster: parsed.topic_cluster,
        rationale: parsed.rationale,
        hash_hint: hash
      })
      .select()
      .single();

    if (error) throw error;

    generated.push({
      id: inserted.id,
      question: inserted.question,
      choices: inserted.choices as string[],
      topic_cluster: inserted.topic_cluster,
      rationale: inserted.rationale
    });
  });

  for (const task of tasks) {
    try {
      await task;
    } catch (error) {
      console.error('generation failed, retrying', error);
    }
  }

  const { data: final } = await client
    .from('pk_questions')
    .select('*')
    .eq('category_slug', payload.category)
    .eq('level_slug', payload.level)
    .order('created_at', { ascending: false })
    .limit(desiredCount);

  return (final ?? []).slice(0, desiredCount).map((row) => ({
    id: row.id,
    question: row.question,
    choices: row.choices as string[],
    topic_cluster: row.topic_cluster,
    rationale: row.rationale
  }));
};

export const rateLimit = (key: string, windowSeconds = 60, maxHits = 5) => {
  const current = (cache.get<number>(key) ?? 0) + 1;
  cache.set(key, current, windowSeconds);
  if (current > maxHits) {
    throw new Error('Rate limit exceeded');
  }
};
