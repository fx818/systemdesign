/** Star calculation for a level debrief. Pure helpers — unit tested.
 *
 * Rules (GAME_DESIGN §3, blended with the interview round):
 * - 0 stars: mission goals not met.
 * - 1 star:  goals met.
 * - 2 stars: goals met + within budget + interview passed (quiz >= 50%).
 * - 3 stars: goals met + within budget + interview passed + no hints used.
 */
export interface StarInput {
  goalsMet: boolean;
  withinBudget: boolean;
  /** Fraction of quiz questions answered correctly, 0..1. */
  quizScore: number;
  /** Hints used on this level. */
  hintsUsed: number;
}

export const QUIZ_PASS_SCORE = 0.5;

export function computeStars({ goalsMet, withinBudget, quizScore, hintsUsed }: StarInput): number {
  if (!goalsMet) return 0;
  let stars = 1;
  if (withinBudget && quizScore >= QUIZ_PASS_SCORE) stars = 2;
  if (stars === 2 && hintsUsed === 0) stars = 3;
  return stars;
}
