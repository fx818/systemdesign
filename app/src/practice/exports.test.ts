import { describe, expect, it } from 'vitest';
import { parseGraph, toMermaid } from './exports';
import { starterGraph } from './config';

describe('architecture exports', () => {
  it('uses valid Mermaid identifiers and escapes arbitrary labels', () => {
    const graph = { nodes: [{ id: 'a weird; id', kind: 'client' as const, x: 80, y: 80, label: 'A "quote" <script>\n&' }, { id: 'end', kind: 'web' as const, x: 200, y: 200 }], edges: [{ from: 'a weird; id', to: 'end', label: 'HTTP "GET"' }] };
    expect(toMermaid(graph)).toBe('flowchart LR\n  n0["A &quot;quote&quot; &lt;script&gt; &amp;"]\n  n1["Web server"]\n  n0 -->|"HTTP &quot;GET&quot;"| n1');
  });
  it('exports valid nodes and directed wires deterministically', () => {
    const graph = starterGraph();
    expect(toMermaid(graph)).toEqual(toMermaid(graph));
    expect(toMermaid(graph)).toContain('n0 --> n1');
    expect(toMermaid({ nodes: [], edges: [] })).toBe('flowchart LR');
  });
  it('round-trips JSON without inventing graph properties', () => { const graph = starterGraph(); expect(parseGraph(JSON.stringify(graph))).toEqual(graph); });
  it.each([
    '{}', '{"nodes":[],"edges":[{"from":"a","to":"b"}]}',
    '{"nodes":[{"id":"a","kind":"__proto__","x":0,"y":0}],"edges":[]}',
    '{"nodes":[{"id":"a","kind":"web","x":"1","y":0}],"edges":[]}',
  ])('rejects invalid imported graphs: %s', json => { expect(() => parseGraph(json)).toThrow(); });
  it('rejects duplicate node identifiers', () => { const graph = starterGraph(); graph.nodes.push(graph.nodes[0]); expect(() => parseGraph(JSON.stringify(graph))).toThrow(/unique/); });
});
