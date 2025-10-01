import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: [vitePreprocess({})],
  kit: {
    adapter: adapter({
      runtime: 'nodejs20.x'
    }),
    alias: {
      $components: 'src/lib/components',
      $lib: 'src/lib',
      $server: 'src/lib/server'
    }
  }
};

export default config;
