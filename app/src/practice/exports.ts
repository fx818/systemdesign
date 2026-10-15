import { COMPONENTS } from '@/sim';
import type { ArchGraph, ArchNode, ComponentKind } from '@/types/content';

const escapeLabel = (label: string) => label.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replace(/[\r\n]/g, ' ');
export function toMermaid(graph: ArchGraph): string {
  const ids = new Map(graph.nodes.map((node, index) => [node.id, `n${index}`]));
  return ['flowchart LR', ...graph.nodes.map(node => `  ${ids.get(node.id)}["${escapeLabel(node.label ?? COMPONENTS[node.kind].name)}"]`),
    ...graph.edges.filter(edge => ids.has(edge.from) && ids.has(edge.to)).map(edge => `  ${ids.get(edge.from)} -->${edge.label ? `|"${escapeLabel(edge.label)}"|` : ''} ${ids.get(edge.to)}`)].join('\n');
}
export function parseGraph(json: string): ArchGraph {
  const value: unknown = JSON.parse(json);
  if (!value || typeof value !== 'object' || !('nodes' in value) || !('edges' in value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) throw new Error('Expected a graph with nodes and edges arrays.');
  if (value.nodes.length > 300 || value.edges.length > 2000) throw new Error('Import is limited to 300 nodes and 2,000 wires.');
  const ids = new Set<string>();
  const nodes: ArchNode[] = value.nodes.map((node: unknown) => {
    if (!node || typeof node !== 'object' || !('id' in node) || typeof node.id !== 'string' || !node.id || ids.has(node.id) || !('kind' in node) || typeof node.kind !== 'string' || !Object.hasOwn(COMPONENTS, node.kind) || !('x' in node) || typeof node.x !== 'number' || !Number.isFinite(node.x) || !('y' in node) || typeof node.y !== 'number' || !Number.isFinite(node.y)) throw new Error('Each node needs a unique id, known component kind and finite x/y coordinates.');
    ids.add(node.id);
    return { id: node.id, kind: node.kind as ComponentKind, x: Math.max(65, Math.min(1215, node.x)), y: Math.max(75, Math.min(625, node.y)), ...('label' in node && typeof node.label === 'string' ? { label: node.label.slice(0, 120) } : {}) };
  });
  const edges = value.edges.map((edge: unknown) => {
    if (!edge || typeof edge !== 'object' || !('from' in edge) || typeof edge.from !== 'string' || !('to' in edge) || typeof edge.to !== 'string' || !ids.has(edge.from) || !ids.has(edge.to)) throw new Error('Every wire must reference existing nodes.');
    return { from: edge.from, to: edge.to, ...('label' in edge && typeof edge.label === 'string' ? { label: edge.label.slice(0, 120) } : {}) };
  });
  return { nodes, edges };
}
export function download(content: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportPng(svg: SVGSVGElement): Promise<void> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', '1280'); clone.setAttribute('height', '720');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720;
    const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('PNG export is unavailable in this browser.');
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('PNG export failed.')), 'image/png'));
    download(blob, 'sd-quest-architecture.png', 'image/png');
  } finally { URL.revokeObjectURL(url); }
}
