<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
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

  let questions: Question[] = [];
  let currentIndex = 0;
  let timeLeft = 15;
  let timer: ReturnType<typeof setInterval> | null = null;
  let answers: { questionId: string; userAnswerIndex: number | null; timeTaken: number }[] = [];
  let questionStart = Date.now();
  let loading = false;
  let error: string | null = null;

  const loadAttempt = () => {
    if (typeof window === 'undefined') return;
    const raw = sessionStorage.getItem(`attempt:${data.attemptId}`);
    if (!raw) {
      error = 'Attempt data expired. Please start a new quiz.';
      return;
    }
    const parsed = JSON.parse(raw);
    questions = parsed.questions as Question[];
    answers = questions.map((q) => ({ questionId: q.id, userAnswerIndex: null, timeTaken: 0 }));
    startTimer();
  };

  const startTimer = () => {
    timeLeft = 15;
    questionStart = Date.now();
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionStart) / 1000);
      timeLeft = Math.max(0, 15 - elapsed);
      if (timeLeft === 0) {
        lockAnswer(null);
      }
    }, 250);
  };

  const lockAnswer = (choice: number | null) => {
    if (!questions[currentIndex]) return;
    const elapsed = Math.min(15, (Date.now() - questionStart) / 1000);
    answers[currentIndex] = {
      questionId: questions[currentIndex].id,
      userAnswerIndex: choice,
      timeTaken: Math.round(elapsed)
    };

    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      startTimer();
    } else {
      submit();
    }
  };

  const submit = async () => {
    loading = true;
    error = null;
    if (timer) clearInterval(timer);
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: data.attemptId, answers })
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Unable to submit quiz');
      }
      const payload = await res.json();
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(`attempt:${data.attemptId}`);
        sessionStorage.setItem(
          `result:${data.attemptId}`,
          JSON.stringify({
            totalScore: payload.totalScore,
            durationSeconds: payload.durationSeconds,
            breakdown: payload.breakdown as BreakdownItem[],
            questions,
            answers
          })
        );
      }
      goto(`/results/${data.attemptId}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to submit quiz';
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadAttempt();
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
  });
</script>

{#if error}
  <div class="space-y-4">
    <div class="alert alert-error">{error}</div>
    <a class="btn" href="/play">Back to Play</a>
  </div>
{:else if questions.length}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="text-sm uppercase tracking-widest text-slate-400">Question {currentIndex + 1} / {questions.length}</div>
      <div class={`badge badge-lg ${timeLeft <= 5 ? 'badge-error' : 'badge-success'}`}>{timeLeft}s</div>
    </div>

    <div class="rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg">
      <h2 class="text-2xl font-semibold leading-snug">{questions[currentIndex].question}</h2>
      <div class="mt-6 grid gap-3">
        {#each questions[currentIndex].choices as choice, index}
          <button
            class={`btn btn-outline justify-start text-left ${answers[currentIndex]?.userAnswerIndex === index ? 'btn-primary' : ''}`}
            on:click={() => lockAnswer(index)}
            disabled={loading}
          >
            <span class="font-semibold">{String.fromCharCode(65 + index)}.</span>
            <span class="ml-2">{choice}</span>
          </button>
        {/each}
      </div>
    </div>
    <div class="flex items-center justify-between text-sm text-slate-400">
      <div>{questions[currentIndex].topic_cluster}</div>
      <div>
        Answered: {answers.filter((a) => a.userAnswerIndex !== null).length}/{questions.length}
      </div>
    </div>
  </div>
{:else}
  <div class="skeleton h-32 w-full"></div>
{/if}
