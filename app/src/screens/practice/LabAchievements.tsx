import { useRef, type ReactNode } from 'react';
import { useGame } from '@/game';

/** The shared runner exposes finish callbacks but no chaos callback. Observe its
 * user-issued kill commands at the screen boundary without changing its API. */
export function LabAchievements({ children }: { children: ReactNode }) {
  const killed = useRef(new Set<string>());
  return <div onClickCapture={event => {
    const button = event.target instanceof Element ? event.target.closest('button') : null;
    if (!button || button.disabled) return;
    const command = button.textContent?.trim() ?? '';
    if (button.getAttribute('aria-label') === 'Reset lab') killed.current.clear();
    if (command.startsWith('× Kill ')) {
      const commands = [...(button.parentElement?.querySelectorAll('button') ?? [])].filter(item => /^(× Kill |↻ Revive )/.test(item.textContent?.trim() ?? ''));
      killed.current.add(`${commands.indexOf(button)}:${command}`);
      useGame.getState().recordPracticeEvent({ type: 'lab', killed: killed.current.size });
    }
  }}>{children}</div>;
}
