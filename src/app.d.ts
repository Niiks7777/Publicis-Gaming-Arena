// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Database } from '$lib/types/database';

declare global {
  namespace App {
    interface Locals {
      user: import('$lib/server/session').SessionUser | null;
    }
    interface PageData {
      user: import('$lib/server/session').SessionUser | null;
      categories?: import('$lib/types/catalog').Category[];
      levels?: import('$lib/types/catalog').Level[];
    }
    interface Platform {}
  }

  namespace Supabase {
    interface Schema extends Database {}
  }
}

export {};
