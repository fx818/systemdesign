import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SimConfig } from '@/types/content';
import { SimRunner } from './SimRunner';

vi.mock('framer-motion', () => {
  return {
    useReducedMotion: () => true,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: { div: ({ children, initial: _initial, animate: _animate, exit: _exit, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; exit?: unknown }) => <div {...props}>{children}</div> },
  };
});
const base: SimConfig = {
  start: { nodes: [{ id: 'client', kind: 'client', x: 120, y: 250 }, { id: 'web', kind: 'web', x: 600, y: 250 }], edges: [{ from: 'client', to: 'web' }] },
  palette: ['web'], budget: 500, locked: ['client', 'web'],
  events: [{ at: 0, type: 'traffic', rps: 100 }], goals: { durationSec: 1, minUptime: 0.99, maxP95Ms: 200 },
};
let callbacks: Map<number, FrameRequestCallback>;
let nextId: number;
let now: number;
function frames(count: number) {
  for (let i = 0; i < count; i++) act(() => {
    now += 100;
    const batch = [...callbacks.values()]; callbacks.clear();
    batch.forEach(callback => callback(now));
  });
}
beforeEach(() => {
  callbacks = new Map(); nextId = 0; now = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++nextId, callback); return nextId; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('SimRunner', () => {
  it('holds the build phase, completes a timed mission, and claims rewards only once', () => {
    const finish = vi.fn();
    render(<SimRunner config={base} mode="mission" onFinish={finish} />);
    frames(20);
    expect(screen.getByText('Build your defense')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Go live/ }));
    frames(15);
    expect(screen.getByText('PixelPost survived the launch!')).toBeInTheDocument();
    expect(finish).not.toHaveBeenCalled();
    const claim = screen.getByRole('button', { name: /Claim reward/ });
    fireEvent.click(claim); fireEvent.click(claim);
    expect(finish).toHaveBeenCalledTimes(1);
    expect(finish.mock.calls[0][0]).toMatchObject({ passed: true, goalsMet: true, withinBudget: true, livesLeft: 3, stars: 3 });
  });
  it('loses lives only after sustained red meters, fails, and retries with a fresh timeline', () => {
    const loseLife = vi.fn(); const retry = vi.fn();
    const cfg: SimConfig = { ...base, goals: { ...base.goals, durationSec: 30 }, events: [{ at: 0, type: 'traffic', rps: 5000 }] };
    render(<SimRunner config={cfg} mode="mission" onFinish={vi.fn()} onLifeLost={loseLife} onRetry={retry} />);
    fireEvent.click(screen.getByRole('button', { name: /Go live/ }));
    frames(29); expect(loseLife).not.toHaveBeenCalled();
    frames(3); expect(loseLife).toHaveBeenCalledTimes(1);
    frames(65);
    expect(loseLife).toHaveBeenCalledTimes(3);
    expect(screen.getByText('The Pager won this round')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Retry mission/ }));
    expect(screen.getByText('Build your defense')).toBeInTheDocument();
    expect(screen.getByLabelText('3 lives left')).toBeInTheDocument();
    expect(retry).toHaveBeenCalledOnce();
  });
  it('pauses and changes speed without skipping the event timeline', () => {
    const cfg = { ...base, goals: { ...base.goals, durationSec: 2 } };
    render(<SimRunner config={cfg} mode="mission" onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Go live/ }));
    frames(5);
    fireEvent.click(screen.getByRole('button', { name: 'Pause simulation' }));
    frames(30);
    expect(screen.queryByText('PixelPost survived the launch!')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '4×' }));
    fireEvent.click(screen.getByRole('button', { name: 'Resume simulation' }));
    frames(7);
    expect(screen.getByText('PixelPost survived the launch!')).toBeInTheDocument();
  });
  it('charges for a hint through the callback and forfeits the third star', () => {
    const hint = vi.fn(); const finish = vi.fn();
    render(<SimRunner config={base} mode="mission" onFinish={finish} hints={['Add redundancy.']} onHint={hint} />);
    fireEvent.click(screen.getByRole('button', { name: /Ravi's hint/ }));
    expect(hint).toHaveBeenCalledOnce(); expect(screen.getByText('Add redundancy.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Go live/ })); frames(15);
    fireEvent.click(screen.getByRole('button', { name: /Claim reward/ }));
    expect(finish.mock.calls[0][0].stars).toBe(2);
  });
  it('blocks go-live when the configured budget is exceeded', () => {
    render(<SimRunner config={{ ...base, budget: 50 }} mode="mission" onFinish={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Go live/ })).toBeDisabled();
  });
  it('lab knobs, task checklists, chaos, recovery and finish are usable', () => {
    const finish = vi.fn();
    const cfg: SimConfig = { ...base, knobs: [{ id: 'rps', label: 'Traffic', type: 'slider', min: 0, max: 5000, initial: 100 }] };
    render(<SimRunner config={cfg} mode="lab" onFinish={finish} tasks={['Kill the web server.']} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Kill the web server.' }));
    expect(screen.getByRole('checkbox', { name: 'Kill the web server.' })).toBeChecked();
    fireEvent.change(screen.getByRole('slider', { name: 'Traffic' }), { target: { value: '3000' } });
    fireEvent.click(screen.getByRole('button', { name: /Inject a failure/ }));
    fireEvent.click(screen.getByRole('button', { name: /Kill Web server/ })); frames(65);
    expect(screen.getByText('OUTAGE · PAGER ALERT')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('slider', { name: 'Traffic' }), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /Revive Web server/ })); frames(65);
    expect(screen.queryByText('OUTAGE · PAGER ALERT')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Finish exploring/ }));
    expect(finish).toHaveBeenCalledOnce();
  });
});
