import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aiFollowup } from './ai';
import { starterGraph } from './config';
beforeEach(() => { localStorage.removeItem('anthropicKey'); });
afterEach(() => { vi.unstubAllGlobals(); localStorage.removeItem('anthropicKey'); });

describe('optional AI interviewer', () => {
  it('makes no request when the feature is not configured', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    expect(await aiFollowup(starterGraph(), 'PixelPost')).toBeNull(); expect(fetch).not.toHaveBeenCalled();
  });
  it('sends the graph to the requested model with browser headers', async () => {
    localStorage.setItem('anthropicKey', 'test-key');
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: [{ type: 'text', text: 'How does the primary fail over?' }] }) });
    vi.stubGlobal('fetch', fetch);
    const graph = starterGraph(); expect(await aiFollowup(graph, 'PixelPost')).toBe('How does the primary fail over?');
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers).toMatchObject({ 'x-api-key': 'test-key', 'anthropic-dangerous-direct-browser-access': 'true', 'anthropic-version': '2023-06-01' });
    const body = JSON.parse(init.body); expect(body.model).toBe('claude-sonnet-4-5'); expect(JSON.parse(body.messages[0].content).graph).toEqual(graph);
  });
  it('falls back on API errors and malformed responses', async () => {
    localStorage.setItem('anthropicKey', 'test-key');
    const fetch = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true, json: async () => ({ content: [{ type: 'image' }] }) });
    vi.stubGlobal('fetch', fetch);
    for (let i = 0; i < 3; i++) expect(await aiFollowup(starterGraph(), 'PixelPost')).toBeNull();
  });
});
