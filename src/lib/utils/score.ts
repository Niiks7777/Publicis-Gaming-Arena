export type LevelSlug = 'beginner' | 'intermediate' | 'expert';

export const SCORE_MAP: Record<LevelSlug, { correct: number; incorrect: number }> = {
  beginner: { correct: 10, incorrect: -5 },
  intermediate: { correct: 20, incorrect: -10 },
  expert: { correct: 30, incorrect: -15 }
};

export const computeScoreDelta = (
  level: LevelSlug,
  correct: boolean
): number => {
  const table = SCORE_MAP[level];
  return correct ? table.correct : table.incorrect;
};

export const clampLevel = (levelSlug: string): LevelSlug => {
  if (levelSlug === 'intermediate' || levelSlug === 'expert') return levelSlug;
  return 'beginner';
};
