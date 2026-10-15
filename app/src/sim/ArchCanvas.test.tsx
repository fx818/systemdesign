import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import type { ArchGraph } from '@/types/content';
import { ArchCanvas } from './ArchCanvas';
import { renderToStaticMarkup } from 'react-dom/server';
import { simulate } from './engine';
const graph: ArchGraph = { nodes: [{ id: 'client', kind: 'client', label: 'Users', x: 100, y: 300 }, { id: 'web', kind: 'web', label: 'Origin', x: 500, y: 300 }], edges: [] };
afterEach(cleanup);
function Editor() {
  const [value, setValue] = useState(graph);
  return <><ArchCanvas graph={value} editable onChange={setValue} locked={['client']} palette={['cache']} budget={300} /><output data-testid="graph">{JSON.stringify(value)}</output></>;
}
describe('ArchCanvas', () => {
  it('supports keyboard wiring, wire removal, moving, placement and locked nodes', () => {
    render(<Editor />);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Users' }), { key: 'Enter' });
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Origin' }), { key: 'Enter' });
    expect(screen.getByTestId('graph')).toHaveTextContent('"from":"client","to":"web"');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Remove connection Users to Origin' }), { key: 'Delete' });
    expect(screen.getByTestId('graph')).toHaveTextContent('"edges":[]');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Origin' }), { key: 'ArrowRight' });
    expect(screen.getByTestId('graph')).toHaveTextContent('"x":516');
    fireEvent.click(screen.getByRole('button', { name: 'Add Cache' }));
    expect(screen.getByTestId('graph')).toHaveTextContent('"kind":"cache"');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByTestId('graph')).not.toHaveTextContent('"kind":"cache"');
  });
  it('lets a placed data center be named for the authored regional waves', () => {
    function RegionEditor() {
      const [value, setValue] = useState<ArchGraph>({ nodes: [{ id: 'datacenter-1', kind: 'datacenter', label: 'Data center 1', x: 500, y: 300 }], edges: [] });
      return <ArchCanvas graph={value} editable onChange={setValue} />;
    }
    render(<RegionEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Data center 1' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Region name' }), { target: { value: 'US-West' } });
    expect(screen.getByRole('button', { name: 'US-West' })).toBeInTheDocument();
  });
  it('lets the NoSQL alternative be identified as a shared session store', () => {
    function SessionEditor() {
      const [value, setValue] = useState<ArchGraph>({ nodes: [{ id: 'nosql-1', kind: 'nosql', label: 'NoSQL store 1', x: 500, y: 300 }], edges: [] });
      return <ArchCanvas graph={value} editable onChange={setValue} />;
    }
    render(<SessionEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'NoSQL store 1' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Component name' }), { target: { value: 'Session store' } });
    expect(screen.getByRole('button', { name: 'Session store' })).toBeInTheDocument();
  });
  it('prevents over-budget placement', () => {
    render(<ArchCanvas graph={graph} editable onChange={vi.fn()} palette={['cache']} budget={150} />);
    expect(screen.getByRole('button', { name: 'Add Cache' })).toBeDisabled();
  });
  it('allows read-only quiz selection without showing editing controls', () => {
    const click = vi.fn();
    render(<ArchCanvas graph={graph} onNodeClick={click} selectedNodeIds={['web']} />);
    fireEvent.click(screen.getByRole('button', { name: 'Origin' }));
    expect(click).toHaveBeenCalledWith('web');
    expect(screen.getByRole('button', { name: 'Origin' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });
  it('renders identical SVG request positions for identical simulation time', () => {
    const connected = { ...graph, edges: [{ from: 'client', to: 'web' }] };
    const config = { start: connected, palette: [], budget: 300, events: [{ type: 'traffic' as const, at: 0, rps: 100 }], goals: { durationSec: 2 } };
    const state = simulate(config, connected, 1);
    const first = renderToStaticMarkup(<ArchCanvas graph={connected} state={state} />);
    const second = renderToStaticMarkup(<ArchCanvas graph={connected} state={state} />);
    // useId intentionally creates unique pattern IDs per mount.
    expect(first.replaceAll(/_R_[^" )]+/g, 'ID')).toBe(second.replaceAll(/_R_[^" )]+/g, 'ID'));
  });
});
