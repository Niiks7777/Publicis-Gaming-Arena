<script lang="ts">
  import '../app.css';
  import type { Category, Level } from '$lib/types/catalog';
  import type { SessionUser } from '$server/session';
  export let data: { user: SessionUser | null; categories: Category[]; levels: Level[] };
</script>

<svelte:head>
  <title>Publicis Knowledge Arena</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-white">
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
      <a href="/" class="text-xl font-bold text-primary">Publicis Knowledge Arena</a>
      <nav class="flex items-center gap-4 text-sm">
        <a class="hover:text-primary" href="/play">Play</a>
        <a class="hover:text-primary" href="/leaderboard">Leaderboards</a>
        {#if data.user}
          <a class="hover:text-primary" href="/profile">{data.user.name}</a>
        {/if}
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-6xl px-6 py-10">
    <slot />
  </main>
  <footer class="border-t border-slate-800 bg-slate-900/80">
    <div class="mx-auto max-w-6xl px-6 py-6 text-xs text-slate-400">
      © {new Date().getFullYear()} Publicis Knowledge Arena. Inspired by Supabase and community leaderboard projects.
    </div>
  </footer>
</div>
