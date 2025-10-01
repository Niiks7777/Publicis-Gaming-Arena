<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  export let data: PageData;
  let categorySlug = data.categories?.[0]?.slug ?? '';
  let levelSlug = data.levels?.[0]?.slug ?? '';
  let loading = false;
  let error: string | null = null;

  const startQuiz = async () => {
    loading = true;
    error = null;
    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorySlug, levelSlug })
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Unable to start quiz');
      }
      const payload = await res.json();
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          `attempt:${payload.attemptId}`,
          JSON.stringify({
            questions: payload.questions,
            meta: { categorySlug, levelSlug, startedAt: Date.now() }
          })
        );
      }
      goto(`/quiz/${payload.attemptId}`);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to start quiz';
    } finally {
      loading = false;
    }
  };
</script>

<section class="space-y-6">
  <h1 class="text-3xl font-bold">Select your challenge</h1>
  <div class="grid gap-6 md:grid-cols-2">
    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="text-xl font-semibold text-primary">Category</h2>
      <div class="mt-4 grid gap-3">
        {#each data.categories ?? [] as category}
          <button
            class={`btn ${categorySlug === category.slug ? 'btn-primary' : 'btn-ghost'} justify-start`}
            on:click={() => (categorySlug = category.slug)}
            type="button"
          >
            {category.label}
          </button>
        {/each}
      </div>
    </div>
    <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 class="text-xl font-semibold text-accent">Level</h2>
      <div class="mt-4 flex gap-3">
        {#each data.levels ?? [] as level}
          <button
            class={`btn ${levelSlug === level.slug ? 'btn-accent' : 'btn-outline'} flex-1`}
            on:click={() => (levelSlug = level.slug)}
            type="button"
          >
            {level.label}
          </button>
        {/each}
      </div>
    </div>
  </div>

  {#if error}
    <div class="alert alert-error">{error}</div>
  {/if}

  <button class="btn btn-primary btn-lg" on:click={startQuiz} disabled={loading}>
    {#if loading}
      Starting...
    {:else}
      Start Quiz
    {/if}
  </button>
</section>
