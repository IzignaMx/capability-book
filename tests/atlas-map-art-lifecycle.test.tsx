import { act, render, cleanup, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as T from 'three';
import { ConstellationRuntime, disposeAtlasObject } from '../atlas/book/ConstellationRuntime';
import { StaticMap } from '../atlas/book/Map';
import { projects } from '../atlas/book/model';
import { projectSignature } from '../atlas/book/art/trajectories';

const harness = vi.hoisted(() => ({
  render: vi.fn(), dispose: vi.fn(), forceContextLoss: vi.fn(), parse: vi.fn(),
  intersect: undefined as undefined | ((entries: { isIntersecting: boolean }[]) => void),
}));
vi.mock('three', async (importOriginal) => ({
  ...await importOriginal<typeof import('three')>(),
  WebGLRenderer: class {
    outputColorSpace = '';
    setClearColor() {} setPixelRatio() {} setSize() {}
    render = harness.render; dispose = harness.dispose; forceContextLoss = harness.forceContextLoss;
  },
}));
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({ GLTFLoader: class { parseAsync = harness.parse; } }));

const deferred = <T,>() => {
  let resolve!: (result: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
};
const fixture = (overrides = {}) => ({ count: 8, resetEpoch: 0, selected: 0, spread: 1,
  zoom: 10, playing: false, reduced: false, onSelect: vi.fn(), onError: vi.fn(), onReady: vi.fn(), ...overrides });
function model() {
  const texture = new T.Texture(), material = new T.MeshStandardMaterial({ map: texture }),
    geometry = new T.BoxGeometry(2, 3, 1), scene = new T.Group();
  scene.add(new T.Mesh(geometry, material));
  return { scene, geometry: vi.spyOn(geometry, 'dispose'), material: vi.spyOn(material, 'dispose'), texture: vi.spyOn(texture, 'dispose') };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof harness.intersect) { harness.intersect = callback; }
    observe() {} disconnect() {}
  });
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillText() {} } as unknown as CanvasRenderingContext2D);
  Object.defineProperty(SVGElement.prototype, 'getTotalLength', { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, 'getPointAtLength', { configurable: true, value: (length: number) => ({ x: length + 100, y: length }) });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (document as unknown as { hidden?: boolean }).hidden;
});

describe('atlas map artwork and deferred model lifecycle', () => {
  it('prerenders every actual case signature and numbered station without a canvas or model request', () => {
    const html = renderToString(<StaticMap selected={3} />);
    expect(html).not.toContain('<canvas');
    expect(html.match(/data-map-project=/g)).toHaveLength(8);
    expect(html).toContain('data-folio-phase="constellation"');
    for (const project of projects) for (const d of projectSignature(project.slug)) expect(html).toContain(d);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('normalizes the genuine imported scene, preserves eight signatures, and draws once while paused', async () => {
    const asset = model();
    harness.parse.mockResolvedValue({ scene: asset.scene });
    const props = fixture();
    const view = render(<ConstellationRuntime {...props} />);
    await waitFor(() => expect(props.onReady).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith('/art/folio/folio.glb', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(view.container.querySelector('canvas')).toHaveAttribute('data-folio', 'gltf');
    expect(view.container.querySelector('canvas')).toHaveAttribute('data-node-count', '8');
    expect(view.container.querySelector('canvas')).toHaveAttribute('data-signature-count', '8');
    const draws = harness.render.mock.calls.length;
    await act(async () => { await Promise.resolve(); });
    expect(harness.render).toHaveBeenCalledTimes(draws);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(asset.scene.parent?.name).toBe('Book folio / eight authored leaves');
    expect(asset.scene.parent?.scale.x).toBeCloseTo(2.75 / 3);
    view.unmount();
    expect(asset.geometry).toHaveBeenCalledOnce();
    expect(asset.material).toHaveBeenCalledOnce();
    expect(asset.texture).toHaveBeenCalledOnce();
  });

  it('disposes a parse that resolves after close without rendering or signaling ready', async () => {
    const pending = deferred<{ scene: T.Group }>(), asset = model(), props = fixture();
    harness.parse.mockReturnValue(pending.promise);
    const view = render(<ConstellationRuntime {...props} />);
    await waitFor(() => expect(harness.parse).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => { pending.resolve({ scene: asset.scene }); });
    expect(asset.geometry).toHaveBeenCalledOnce();
    expect(asset.texture).toHaveBeenCalledOnce();
    expect(harness.render).not.toHaveBeenCalled();
    expect(props.onReady).not.toHaveBeenCalled();
    expect(harness.dispose).toHaveBeenCalledOnce();
  });

  it.each(['hidden', 'offscreen', 'preference'] as const)('discards a pending parse superseded by %s', async (reason) => {
    const pending = deferred<{ scene: T.Group }>(), asset = model(), props = fixture();
    // A superseding visible load remains pending; the old result must never be installed.
    harness.parse.mockReturnValueOnce(pending.promise).mockReturnValue(new Promise(() => {}));
    const view = render(<ConstellationRuntime {...props} />);
    await waitFor(() => expect(harness.parse).toHaveBeenCalledOnce());
    act(() => {
      if (reason === 'hidden') {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      } else if (reason === 'offscreen') harness.intersect?.([{ isIntersecting: false }]);
      else view.rerender(<ConstellationRuntime {...props} reduced />);
    });
    await act(async () => { pending.resolve({ scene: asset.scene }); });
    expect(asset.geometry).toHaveBeenCalledOnce();
    expect(props.onReady).not.toHaveBeenCalled();
    expect(harness.render).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(props.onError).not.toHaveBeenCalled();
  });

  it('reports failed asset loading while leaving the caller free to keep the complete SVG fallback', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const props = fixture();
    render(<ConstellationRuntime {...props} />);
    await waitFor(() => expect(props.onError).toHaveBeenCalledOnce());
    expect(harness.parse).not.toHaveBeenCalled();
    expect(props.onReady).not.toHaveBeenCalled();
    expect(harness.render).not.toHaveBeenCalled();
  });

  it('returns to the static fallback when lifecycle observation cannot be installed', () => {
    vi.stubGlobal('IntersectionObserver', class { constructor() { throw new Error('Unsupported observer'); } });
    const props = fixture();
    render(<ConstellationRuntime {...props} />);
    expect(props.onError).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
    expect(harness.dispose).toHaveBeenCalledOnce();
    expect(harness.render).not.toHaveBeenCalled();
  });

  it('bounds a stalled request and aborts its signal', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    const props = fixture();
    const view = render(<ConstellationRuntime {...props} />);
    act(() => vi.advanceTimersByTime(8000));
    expect(props.onError).toHaveBeenCalledOnce();
    expect((vi.mocked(fetch).mock.calls[0]![1]!.signal as AbortSignal).aborted).toBe(true);
    expect(harness.render).not.toHaveBeenCalled();
    view.unmount();
    vi.useRealTimers();
  });

  it('deduplicates shared GLB resources when disposing', () => {
    const asset = model();
    const mesh = asset.scene.children[0] as T.Mesh;
    asset.scene.add(new T.Mesh(mesh.geometry, mesh.material));
    disposeAtlasObject(asset.scene);
    expect(asset.geometry).toHaveBeenCalledOnce();
    expect(asset.material).toHaveBeenCalledOnce();
    expect(asset.texture).toHaveBeenCalledOnce();
  });
});
