import { fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import { CHECKLIST, DISTRACTORS } from '../data';
import ChecklistRecall, { matchRule, recallScore } from './ChecklistRecall';

describe('ChecklistRecall', () => {
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });
  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  it('matches each book rule text to itself and no distractor sneaks in as a different rule', () => {
    const done: string[] = [];
    for (const r of CHECKLIST) {
      expect(matchRule(r.text, done)?.id).toBe(r.id);
      done.push(r.id);
    }
    expect(matchRule('xy', [])).toBeUndefined();
    expect(recallScore(8, 0, 0)).toBe(1);
    expect(recallScore(4, 4, 0)).toBe(0.75);
    expect(DISTRACTORS.length).toBeGreaterThanOrEqual(6);
  });

  it('typing all 8 from memory scores 1', async () => {
    const done = vi.fn();
    render(<ChecklistRecall onComplete={done} />);
    const input = screen.getByLabelText('Type a rule');
    for (const r of CHECKLIST) {
      fireEvent.change(input, { target: { value: r.text } });
      fireEvent.click(screen.getByRole('button', { name: 'Recall' }));
    }
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(1);
  });

  it('pick mode: half points, traps cost a quarter', async () => {
    const done = vi.fn();
    render(<ChecklistRecall onComplete={done} />);
    fireEvent.click(screen.getByRole('button', { name: /i'm stuck/i }));
    fireEvent.click(await screen.findByRole('button', { name: DISTRACTORS[0].text }));
    for (const r of CHECKLIST) fireEvent.click(screen.getByRole('button', { name: r.text }));
    fireEvent.click(await screen.findByRole('button', { name: 'Finish' }));
    expect(done).toHaveBeenCalledWith(recallScore(0, 8, 1));
  });
});
