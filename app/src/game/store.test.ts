import { beforeEach, describe, expect, it } from 'vitest';
import { useGame } from './store';

const state = () => useGame.getState();

beforeEach(() => {
  localStorage.clear();
  state().resetProgress();
});

describe('useGame store', () => {
  it('adds xp and touches the streak', () => {
    state().addXp(50);
    state().addXp(25);
    expect(state().xp).toBe(75);
    expect(state().streak.count).toBe(1);
    expect(state().streak.lastDate).not.toBeNull();
  });

  it('completes steps idempotently', () => {
    state().completeStep('L01', 'incident');
    state().completeStep('L01', 'incident');
    state().completeStep('L01', 'lesson');
    expect(state().progress.L01.completedSteps).toEqual(['incident', 'lesson']);
  });

  it('keeps the max star value', () => {
    state().setStars('L01', 2);
    state().setStars('L01', 1);
    expect(state().progress.L01.stars).toBe(2);
    state().setStars('L01', 3);
    expect(state().progress.L01.stars).toBe(3);
  });

  it('clamps stars to 0..3', () => {
    state().setStars('L01', 9);
    expect(state().progress.L01.stars).toBe(3);
  });

  it('awards badges once, with a timestamp', () => {
    state().awardBadge('first-request');
    const first = state().badges['first-request'];
    state().awardBadge('first-request');
    expect(state().badges['first-request']).toBe(first);
    expect(typeof first).toBe('number');
  });

  it('records the best quiz score', () => {
    state().recordQuizResult('L01', 0.6);
    state().recordQuizResult('L01', 0.4);
    expect(state().progress.L01.bestQuiz).toBe(0.6);
  });

  it('ingests takeaway cards once and reviews them', () => {
    state().ingestCards('L01', [
      { front: 'Q1', back: 'A1' },
      { front: 'Q2', back: 'A2' },
    ]);
    state().ingestCards('L01', [{ front: 'Q1', back: 'A1' }]);
    expect(Object.keys(state().cards)).toEqual(['L01#0', 'L01#1']);

    state().reviewCard('L01#0', true);
    expect(state().cards['L01#0'].box).toBe(2);
    state().reviewCard('L01#1', false);
    expect(state().cards['L01#1'].box).toBe(1);
  });

  it('tracks hints, lives and credits', () => {
    state().useHint('L04');
    state().useHint('L04');
    expect(state().hintsUsed.L04).toBe(2);
    state().loseLife();
    expect(state().lives).toBe(2);
    state().resetLives();
    expect(state().lives).toBe(3);
    state().setCredits(500);
    state().spendCredits(120);
    expect(state().credits).toBe(380);
  });

  it('records mission results per level', () => {
    state().recordMissionResult('L04', { goalsMet: true, withinBudget: false });
    expect(state().missionResults.L04).toEqual({ goalsMet: true, withinBudget: false });
  });

  it('resetProgress clears everything', () => {
    state().addXp(500);
    state().setStars('L01', 3);
    state().resetProgress();
    expect(state().xp).toBe(0);
    expect(state().progress.L01).toBeUndefined();
  });
});
