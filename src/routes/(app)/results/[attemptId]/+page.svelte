<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  type Question = {
    id: string;
    question: string;
    choices: string[];
    topic_cluster: string | null;
  };

  type BreakdownItem = {
    questionId: string | null;
    correct: boolean;
    scoreDelta: number;
    timeTaken: number;
    correctIndex: number | null;
    topic_cluster: string | null;
    rationale: string | null;
  };

  type ResultPayload = {
    totalScore: number;
    durationSeconds: number;
    breakdown: BreakdownItem[];
    questions: Question[];
    answers: { questionId: string; userAnswerIndex: number | null; timeTaken: number }[];
  };

  let result: ResultPayload | null = null;
  let loading = true;
  let error: string | null = null;

  const loadFromSession = () => {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(`result:${data.attemptId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ResultPayload;
  };

  onMount(async () => {
    const sessionResult = loadFromSession();
    if (sessionResult) {
      result = sessionResult;
      loading = false;
      return;
    }
    try {
      const res = await fetch('/api/history');
      if (!res.ok) throw new Error('Unable to load history');
      const payload = await res.json();
      const attempt = payload.attempts.find((a) => a.id === data.attemptId);
      if (attempt) {
        result = {
          totalScore: attempt.total_score,
          durationSeconds: attempt.duration_seconds,
          breakdown: attempt.items.map((item: any) => ({
            questionId: null,
            correct: item.correct,
            scoreDelta: item.scoreDelta,
            timeTaken: item.timeTaken,
            correctIndex: item.correctIndex,
            topic_cluster: item.topic_cluster,
            rationale: item.rationale
          })),
          questions: attempt.items.map((item: any, index: number) => ({
            id: `${data.attemptId}-${index}`,
            question: `Question ${index + 1}`,
            choices: item.choices ?? [],
            topic_cluster: item.topic_cluster
          })),
          answers: attempt.items.map((item: any) => ({
            questionId: '',
            userAnswerIndex: item.userAnswerIndex,
            timeTaken: item.timeTaken
          }))
        };
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to load results';
    } finally {
      loading = false;
    }
  });

  $: accuracy = result
    ? Math.round((result.breakdown.filter((item) => item.correct).length / result.breakdown.length) * 100)
    : 0;

  $: topics = result
    ? result.questions.reduce<Record<string, { correct: number; total: number }>>((acc, question, index) => {
        const key = question.topic_cluster ?? 'General';
        if (!acc[key]) acc[key] = { correct: 0, total: 0 };
        acc[key].total += 1;
        const item = result?.breakdown[index];
        if (item?.correct) {
          acc[key].correct += 1;
        }
        return acc;
      }, {})
    : {};
</script>

{#if loading}
  <div class="skeleton h-32 w-full"></div>
{:else if error}
  <div class="alert alert-error">{error}</div>
{:else if result}
  <div class="space-y-8">
    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-8">
      <h1 class="text-3xl font-bold">Round complete</h1>
      <p class="text-slate-300">Attempt ID {data.attemptId}</p>
      <div class="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <div class="text-sm uppercase tracking-widest text-slate-400">Score</div>
          <div class="text-4xl font-black text-primary">{result.totalScore}</div>
        </div>
        <div>
          <div class="text-sm uppercase tracking-widest text-slate-400">Accuracy</div>
          <div class="text-4xl font-black text-accent">{accuracy}%</div>
        </div>
        <div>
          <div class="text-sm uppercase tracking-widest text-slate-400">Time</div>
          <div class="text-4xl font-black">{Math.round(result.durationSeconds)}s</div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="text-2xl font-semibold">Topic clusters</h2>
      <div class="mt-4 space-y-3">
        {#each Object.entries(topics) as [topic, stats]}
          <div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 p-4">
            <div>
              <p class="font-semibold">{topic}</p>
              <p class="text-sm text-slate-400">{stats.correct} correct / {stats.total} questions</p>
            </div>
            <div class="badge badge-outline">{Math.round((stats.correct / stats.total) * 100)}%</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="text-2xl font-semibold">Question breakdown</h2>
      <ol class="mt-4 space-y-4">
        {#each result.questions as question, idx}
          <li class="rounded-lg border border-slate-800 p-4">
            <div class="flex items-center justify-between">
              <span class="font-semibold">Q{idx + 1}. {question.question}</span>
              <span class={`badge ${result.breakdown[idx]?.correct ? 'badge-success' : 'badge-error'}`}>
                {result.breakdown[idx]?.correct ? 'Correct' : 'Incorrect'}
              </span>
            </div>
            <p class="mt-2 text-sm text-slate-400">Topic: {question.topic_cluster ?? 'General'}</p>
            <p class="text-sm text-slate-400">
              Selected: {result.answers[idx]?.userAnswerIndex !== null && question.choices.length
                ? question.choices[result.answers[idx]?.userAnswerIndex ?? 0]
                : 'No answer'}
            </p>
            <p class="text-sm text-slate-400">
              Correct: {result.breakdown[idx]?.correctIndex !== null && question.choices.length
                ? question.choices[result.breakdown[idx]?.correctIndex ?? 0]
                : 'n/a'}
            </p>
            {#if result.breakdown[idx]?.rationale}
              <p class="mt-2 text-sm text-slate-500">{result.breakdown[idx]?.rationale}</p>
            {/if}
            <p class="text-xs text-slate-500">Time: {result.breakdown[idx]?.timeTaken ?? 0}s</p>
          </li>
        {/each}
      </ol>
    </div>

    <div class="flex gap-4">
      <a class="btn btn-primary" href="/play">Play again</a>
      <a class="btn btn-ghost" href="/leaderboard">View leaderboards</a>
    </div>
  </div>
{:else}
  <div class="alert alert-warning">Result not found.</div>
{/if}
