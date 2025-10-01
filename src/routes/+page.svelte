<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { z } from 'zod';

  const profileSchema = z.object({
    name: z.string().min(2),
    agency: z.string().min(2),
    function: z.string().min(2)
  });

  let name = '';
  let agency = '';
  let func = '';
  let message: string | null = null;
  let error: string | null = null;

  const agencies = ['Publicis Media', 'Starcom', 'Zenith', 'Spark Foundry', 'Digitas', 'Performics'];

  $: user = $page.data.user;

  onMount(() => {
    if (user) {
      name = user.name;
      agency = user.agency;
      func = user.function;
    }
  });

  const submit = async () => {
    error = null;
    message = null;
    const parsed = profileSchema.safeParse({ name, agency, function: func });
    if (!parsed.success) {
      error = 'Please fill in all fields correctly.';
      return;
    }
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });
    if (res.ok) {
      message = 'Profile saved! Redirecting to play...';
      setTimeout(() => goto('/play'), 500);
    } else {
      const body = await res.json();
      error = body.error ?? 'Unable to save profile';
    }
  };
</script>

<section class="grid gap-10 md:grid-cols-2">
  <div class="space-y-6">
    <h1 class="text-4xl font-bold">Level up your Publicis IQ</h1>
    <p class="text-lg text-slate-300">
      Publicis Knowledge Arena is the gamified way to master Media, Performance, SEO, Creative, and Strategy.
      Join peers across agencies, tackle AI-generated rounds, and climb the leaderboards.
    </p>
    <ul class="space-y-3 text-slate-300">
      <li>⚡ 15-second rapid-fire questions</li>
      <li>🤖 AI quality control and dedupe engine</li>
      <li>📊 Personal insights and agency rankings</li>
    </ul>
  </div>
  <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
    <h2 class="text-2xl font-semibold">Enter the Arena</h2>
    <div class="mt-6 space-y-4">
      <label class="block text-sm text-slate-400" for="profile-name">Name</label>
      <input
        id="profile-name"
        class="input input-bordered w-full"
        bind:value={name}
        name="name"
        placeholder="Ada Lovelace"
      />

      <label class="block text-sm text-slate-400" for="profile-agency">Agency</label>
      <select
        id="profile-agency"
        class="select select-bordered w-full"
        bind:value={agency}
        name="agency"
      >
        <option value="" disabled>Choose your agency</option>
        {#each agencies as option}
          <option value={option}>{option}</option>
        {/each}
      </select>

      <label class="block text-sm text-slate-400" for="profile-function">Function</label>
      <input
        id="profile-function"
        class="input input-bordered w-full"
        bind:value={func}
        name="function"
        placeholder="Performance Marketing"
      />

      {#if error}
        <div class="alert alert-error text-sm">{error}</div>
      {/if}
      {#if message}
        <div class="alert alert-success text-sm">{message}</div>
      {/if}

      <button class="btn btn-primary w-full" on:click|preventDefault={submit}>
        Save &amp; Start
      </button>
    </div>
  </div>
</section>
