import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { useGame } from '@/game';
import { LabAchievements } from './LabAchievements';

function LabCommands() {
  const [dead, setDead] = useState<number[]>([]);
  return <LabAchievements><button aria-label="Reset lab" onClick={() => setDead([])}>Reset</button><div>{Array.from({ length: 5 }, (_, index) => <button key={index} onClick={() => setDead(old => old.includes(index) ? old.filter(id => id !== index) : [...old, index])}>{dead.includes(index) ? '↻ Revive ' : '× Kill '}Web server</button>)}</div></LabAchievements>;
}
beforeEach(() => useGame.getState().resetProgress());
describe('lab achievement screen integration', () => {
  it('counts distinct nodes even when they have identical display labels', () => {
    render(<LabCommands />);
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getAllByRole('button', { name: '× Kill Web server' })[0]);
    expect(useGame.getState().achievements['chaos-monkey']).toBeDefined();
  });
  it('does not count repeated kills of one node or carry them across a lab reset', () => {
    render(<LabCommands />);
    const first = screen.getAllByRole('button', { name: '× Kill Web server' })[0];
    for (let i = 0; i < 12; i++) fireEvent.click(first);
    expect(useGame.getState().achievements['chaos-monkey']).toBeUndefined();
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getAllByRole('button', { name: '× Kill Web server' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Reset lab' }));
    for (let i = 0; i < 2; i++) fireEvent.click(screen.getAllByRole('button', { name: '× Kill Web server' })[0]);
    expect(useGame.getState().achievements['chaos-monkey']).toBeUndefined();
  });
});
