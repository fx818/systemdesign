import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LevelDef } from '@/types/content';
import { todayKey, useGame } from '@/game';
import App from '@/App';
import { testLevel } from './testLevel';
import type { SimRunnerProps } from './simBridge';

const registry = vi.hoisted(() => ({ levels: [] as LevelDef[] }));
vi.mock('@/content/registry', () => ({
  get levels() { return registry.levels; },
  getLevel: (id: string) => registry.levels.find((level) => level.id === id),
}));
vi.mock('./simBridge', () => ({ SimRunnerBridge: ({ onLifeLost, onRetry }: SimRunnerProps) => <div>
  Simulator
  <button onClick={onLifeLost}>Lose life</button>
  <button onClick={onRetry}>Retry simulation</button>
</div> }));

function open(path: string) {
  return render(<StrictMode><MemoryRouter initialEntries={[path]}><App /></MemoryRouter></StrictMode>);
}

beforeEach(() => {
  useGame.getState().resetProgress();
  registry.levels = [testLevel];
});

describe('shell routes and rewards', () => {
  it.each(['/','/profile','/review','/videos','/level/L01'])('works with an empty registry on %s', (path) => {
    registry.levels = [];
    open(path);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('provides profile badges, video render links and standalone scenes', () => {
    const profile = open('/profile');
    expect(screen.getByText('First Request')).toBeInTheDocument();
    profile.unmount();
    const videos = open('/videos');
    expect(screen.getByRole('link', { name: /Test mission/ })).toHaveAttribute('href', '/render/L01');
    videos.unmount();
    open('/render/L01?t=1.5');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByTestId('lesson-scene')).toHaveAttribute('data-interactive', 'false');
    expect(screen.getByTestId('lesson-scene')).toHaveAttribute('data-time', '1.5');
    act(() => window.__setLessonTime?.(99));
    expect(screen.getByTestId('lesson-scene')).toHaveAttribute('data-time', '3');
  });

  it('saves an empty-dialogue debrief once, reveals the map and opens the badge modal', async () => {
    const state = useGame.getState();
    state.recordMissionResult('L01', { goalsMet: true, withinBudget: true });
    state.recordQuizResult('L01', 1, 3);
    state.completeStep('L01', 'quiz');
    const first = open('/level/L01/debrief');
    expect(await screen.findByRole('dialog')).toHaveTextContent('Badge unlocked');
    expect(useGame.getState().progress.L01.stars).toBe(3);
    expect(useGame.getState().xp).toBe(140);
    expect(useGame.getState().cards['L01#0']).toBeDefined();
    expect(screen.getByText('New on your architecture map')).toBeInTheDocument();
    first.unmount();
    open('/level/L01/debrief');
    expect(useGame.getState().xp).toBe(140);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not grant stars or a badge from a direct debrief link without mission results', () => {
    open('/level/L01/debrief');
    expect(screen.getByText('Keep building')).toBeInTheDocument();
    expect(useGame.getState().progress.L01?.stars ?? 0).toBe(0);
    expect(useGame.getState().badges).toEqual({});
    expect(useGame.getState().xp).toBe(0);
  });

  it.each([1, 2])('preserves the simulator %i-star limit through a flawless interview', (missionStars) => {
    const state = useGame.getState();
    state.recordMissionResult('L01', { goalsMet: true, withinBudget: true, stars: missionStars });
    state.recordQuizResult('L01', 1, 3);
    state.completeStep('L01', 'quiz');
    open('/level/L01/debrief');
    expect(useGame.getState().progress.L01.stars).toBe(missionStars);
    expect(useGame.getState().xp).toBe(missionStars * 40 + 20);
  });

  it('caps a passing interview at two stars after hearts run out', () => {
    const state = useGame.getState();
    state.recordMissionResult('L01', { goalsMet: true, withinBudget: true });
    state.recordQuizResult('L01', 0.7, 0);
    state.completeStep('L01', 'quiz');
    open('/level/L01/debrief');
    expect(useGame.getState().progress.L01.stars).toBe(2);
  });

  it('keeps locked levels inaccessible through direct routes', () => {
    registry.levels = [testLevel, { ...testLevel, id: 'L02', number: 2 }];
    open('/level/L02/quiz');
    expect(screen.getByText('Level locked')).toBeInTheDocument();
  });

  it('connects mission life-loss and retry events to the persisted shell state', () => {
    open('/level/L01/mission');
    expect(useGame.getState().lives).toBe(3);
    expect(useGame.getState().credits).toBe(100);
    fireEvent.click(screen.getByRole('button', { name: 'Lose life' }));
    expect(useGame.getState().lives).toBe(2);
    fireEvent.click(screen.getByRole('button', { name: 'Retry simulation' }));
    expect(useGame.getState().lives).toBe(3);
  });

  it('reviews each of five cards once without skipping when due dates change, and respects the daily limit', async () => {
    const user = userEvent.setup();
    useGame.getState().ingestCards('L01', Array.from({ length: 7 }, (_, i) => ({ front: `Front ${i}`, back: `Back ${i}` })));
    const first = open('/review');
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`Front ${i}`)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Show answer' }));
      await user.click(screen.getByRole('button', { name: i === 1 ? /I didn't/ : /I knew it/ }));
    }
    expect(await screen.findByText('Flashback complete')).toBeInTheDocument();
    expect(useGame.getState().flashbackLog[todayKey()]).toBe(5);
    expect(useGame.getState().cards['L01#5'].box).toBe(1);
    first.unmount();
    open('/review');
    expect(screen.getByText('All caught up')).toBeInTheDocument();
  });

  it('plays every mini-game before completing the step', async () => {
    registry.levels = [{ ...testLevel, miniGames: ['first', 'second'].map((id) => ({
      id, title: `${id} drill`, intro: 'Try it', Component: ({ onComplete }) => <button onClick={() => onComplete(1)}>Finish drill</button>,
    })) }];
    open('/level/L01/minigame/first');
    fireEvent.click(screen.getByRole('button', { name: 'Finish drill' }));
    expect(useGame.getState().progress.L01?.completedSteps ?? []).not.toContain('minigame');
    fireEvent.click(screen.getByRole('button', { name: 'Next drill: second drill' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Finish drill' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Finish drill' }));
    expect(useGame.getState().progress.L01.completedSteps).toContain('minigame');
  });
});
