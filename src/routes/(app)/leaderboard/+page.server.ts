import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  const data = await parent();
  return {
    categories: data.categories,
    levels: data.levels,
    user: data.user
  };
};
