<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  type PlayerRow = {
    position: number;
    user_id: string;
    name: string;
    agency: string | null;
    score: number;
    lastPlayed: string;
  };

  type AgencyRow = {
    position: number;
    agency: string;
    score: number;
  };

  type Scope = 'global' | 'category' | 'level' | 'agency';
  const tabs: Scope[] = ['global', 'category', 'level', 'agency'];

  let scope: Scope = 'global';
  let entries: Array<PlayerRow | AgencyRow> = [];
  $: agencyEntries = scope === 'agency' ? (entries as AgencyRow[]) : [];
  $: playerEntries = scope !== 'agency' ? (entries as PlayerRow[]) : [];
  let rank: number | null = null;
  let loading = true;
  let error: string | null = null;
  let selectedCategory = data.categories?.[0]?.slug ?? '';
  let selectedLevel = data.levels?.[0]?.slug ?? '';
  let selectedAgency = data.user?.agency ?? 'Publicis Media';

  const loadLeaderboard = async () => {
    loading = true;
    error = null;
    const params = new URLSearchParams({ scope });
    if (scope === 'category') params.set('category', selectedCategory);
    if (scope === 'level') params.set('level', selectedLevel);
    if (scope === 'agency') params.set('agency', selectedAgency ?? '');
    try {
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Unable to load leaderboard');
      }
      const payload = await res.json();
      entries = payload.entries ?? [];
      rank = payload.rank ?? null;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unable to load leaderboard';
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    loadLeaderboard();
  });

  const changeScope = (tab: Scope) => {
    scope = tab;
    if (scope === 'agency' && !selectedAgency) {
      selectedAgency = data.user?.agency ?? 'Publicis Media';
    }
    loadLeaderboard();
  };
</script>

<section class="space-y-6">
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold">Leaderboards</h1>
    {#if rank}
      <div class="badge badge-outline">Your rank: {rank}</div>
    {/if}
  </div>
  <div class="tabs tabs-boxed bg-slate-900/60">
    {#each tabs as tab}
      <button
        type="button"
        class={`tab ${scope === tab ? 'tab-active bg-primary text-white' : ''}`}
        on:click={() => changeScope(tab)}
        aria-pressed={scope === tab}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    {/each}
  </div>

  {#if scope === 'category'}
    <select class="select select-bordered w-full md:w-64" bind:value={selectedCategory} on:change={loadLeaderboard}>
      {#each data.categories ?? [] as category}
        <option value={category.slug}>{category.label}</option>
      {/each}
    </select>
  {/if}
  {#if scope === 'level'}
    <select class="select select-bordered w-full md:w-64" bind:value={selectedLevel} on:change={loadLeaderboard}>
      {#each data.levels ?? [] as level}
        <option value={level.slug}>{level.label}</option>
      {/each}
    </select>
  {/if}
  {#if scope === 'agency'}
    <input
      class="input input-bordered w-full md:w-64"
      bind:value={selectedAgency}
      placeholder="Agency name"
      on:change={loadLeaderboard}
    />
  {/if}

  {#if loading}
    <div class="skeleton h-40 w-full"></div>
  {:else if error}
    <div class="alert alert-error">{error}</div>
  {:else if entries.length === 0}
    <div class="alert alert-info">No leaderboard data yet. Play a round to see results.</div>
  {:else}
    <div class="overflow-x-auto">
      {#if scope === 'agency'}
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agency</th>
              <th>Total Score</th>
            </tr>
          </thead>
          <tbody>
            {#each agencyEntries as row}
              <tr class={row.agency === selectedAgency ? 'bg-primary/20' : ''}>
                <td>{row.position}</td>
                <td>{row.agency}</td>
                <td class="font-semibold text-primary">{row.score}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Agency</th>
              <th>Total Score</th>
              <th>Last Played</th>
            </tr>
          </thead>
          <tbody>
            {#each playerEntries as row}
              <tr class={data.user && row.user_id === data.user.id ? 'bg-primary/20' : ''}>
                <td>{row.position}</td>
                <td>{row.name}</td>
                <td>{row.agency ?? '—'}</td>
                <td class="font-semibold text-primary">{row.score}</td>
                <td>{new Date(row.lastPlayed).toLocaleString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  {/if}
</section>
