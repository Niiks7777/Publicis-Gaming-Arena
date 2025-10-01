import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
  if (!locals.user) {
    throw redirect(302, '/');
  }
  const data = await parent();
  return {
    user: data.user,
    categories: data.categories,
    levels: data.levels
  };
};
