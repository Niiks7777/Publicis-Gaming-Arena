<script lang="ts">
  import type { PageData } from './$types';
  import { z } from 'zod';

  export let data: PageData;

  const profileSchema = z.object({
    name: z.string().min(2),
    agency: z.string().min(2),
    function: z.string().min(2)
  });

  let name = data.user?.name ?? '';
  let agency = data.user?.agency ?? '';
  let func = data.user?.function ?? '';
  let message: string | null = null;
  let error: string | null = null;

  const agencies = ['Publicis Media', 'Starcom', 'Zenith', 'Spark Foundry', 'Digitas', 'Performics'];

  const save = async () => {
    error = null;
    message = null;
    const parsed = profileSchema.safeParse({ name, agency, function: func });
    if (!parsed.success) {
      error = 'Please fill the form correctly';
      return;
    }
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });
    if (!res.ok) {
      const body = await res.json();
      error = body.error ?? 'Unable to save profile';
    } else {
      message = 'Profile updated';
    }
  };

  const scores = data.attempts?.map((attempt) => attempt.total_score) ?? [];
  const maxScore = Math.max(...scores, 100);
</script>

<section class="space-y-8">
  <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
    <h1 class="text-3xl font-bold">My profile</h1>
    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <div>
        <label class="block text-sm text-slate-400" for="profile-name-edit">Name</label>
        <input
          id="profile-name-edit"
          class="input input-bordered w-full"
          bind:value={name}
          name="name"
        />
      </div>
      <div>
        <label class="block text-sm text-slate-400" for="profile-agency-edit">Agency</label>
        <select
          id="profile-agency-edit"
          class="select select-bordered w-full"
          bind:value={agency}
          name="agency"
        >
          <option value="" disabled>Select agency</option>
          {#each agencies as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="block text-sm text-slate-400" for="profile-function-edit">Function</label>
        <input
          id="profile-function-edit"
          class="input input-bordered w-full"
          bind:value={func}
          name="function"
        />
      </div>
    </div>
    {#if error}
      <div class="alert alert-error mt-4">{error}</div>
    {/if}
    {#if message}
      <div class="alert alert-success mt-4">{message}</div>
    {/if}
    <button class="btn btn-primary mt-6" type="button" on:click={save}>Save profile</button>
  </div>

  <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
    <h2 class="text-2xl font-semibold">Recent performance</h2>
    {#if !data.attempts || data.attempts.length === 0}
      <p class="text-slate-400">No attempts yet. Start a round to populate your insights.</p>
    {:else}
      <div class="mt-6 space-y-4">
        <svg viewBox={`0 0 ${Math.max(data.attempts.length - 1, 1) * 80} 200`} class="w-full">
          <polyline
            fill="none"
            stroke="#FF6F61"
            stroke-width="3"
            points={data.attempts
              .map((attempt, index) => {
                const x = index * 80;
                const y = 180 - (attempt.total_score / maxScore) * 160;
                return `${x},${y}`;
              })
              .join(' ')}
          />
          {#each data.attempts as attempt, index}
            <g>
              <circle
                cx={index * 80}
                cy={180 - (attempt.total_score / maxScore) * 160}
                r="5"
                fill="#2D46B9"
              />
              <text x={index * 80} y={190} fill="#94a3b8" font-size="12" text-anchor="middle">
                {new Date(attempt.created_at).toLocaleDateString()}
              </text>
            </g>
          {/each}
        </svg>

        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Level</th>
              <th>Score</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {#each data.attempts as attempt}
              <tr>
                <td>{new Date(attempt.created_at).toLocaleString()}</td>
                <td>{attempt.category_slug}</td>
                <td class="capitalize">{attempt.level_slug}</td>
                <td class="font-semibold text-primary">{attempt.total_score}</td>
                <td>{attempt.duration_seconds}s</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</section>
