import React, { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { atlasPhase, projectSignature } from '../atlas/book/art/trajectories';
import { TrajectoryMark } from '../atlas/book/art/TrajectoryMark';
import { FolioArt } from '../atlas/book/art/FolioArt';
import { useAtlasMotion } from '../atlas/book/art/useAtlasMotion';

const slugs = ['distrito-cero', 'nexo', 'omnisync', 'hamburguesa-nomada', 'tecuiyo', 'vald', 'nutrichilango', 'developer-tools'];

function Surface({ enabled = true }: { enabled?: boolean }) {
  const ref = useRef<HTMLElement | null>(null);
  useAtlasMotion(ref, { enabled });
  return <section ref={ref} data-testid="surface"><h1>Native reading</h1><a href="#chapter">Read the case</a>
    <FolioArt phase="matter" /><TrajectoryMark slug="omnisync" /></section>;
}

describe('shared Atlas grammar', () => {
  it('maps safe progress into four reversible reading phases', () => {
    expect([0, .25, .5, .75, 1].map(value => atlasPhase(value).name))
      .toEqual(['matter', 'trajectory', 'weave', 'constellation', 'constellation']);
    expect(atlasPhase(.9).index).toBe(3);
    expect(atlasPhase(.1).index).toBe(0);
    expect(atlasPhase(-10).progress).toBe(0);
    expect(atlasPhase(10).progress).toBe(1);
    expect(atlasPhase(NaN)).toEqual({ index: 0, name: 'matter', progress: 0 });
    expect(atlasPhase(-Infinity).progress).toBe(0);
    expect(atlasPhase(Infinity).progress).toBe(1);
  });

  it('provides distinct three-path signatures for all eight cases with a safe fallback', () => {
    const signatures = slugs.map(projectSignature);
    expect(new Set(signatures.map(paths => paths.join('|'))).size).toBe(8);
    signatures.forEach(paths => {
      expect(paths).toHaveLength(3);
      paths.forEach(path => expect(path).toMatch(/^M[\d ]+[LC]/));
    });
    expect(projectSignature('unknown')).toEqual(projectSignature('omnisync'));
    expect(projectSignature('__proto__')).toEqual(projectSignature('omnisync'));
    expect(projectSignature('constructor')).toEqual(projectSignature('omnisync'));
  });

  it('prerenders native reading and responsive decorative artwork without a motion gate', () => {
    const html = renderToString(<Surface />);
    const container = document.createElement('div');
    container.innerHTML = html;
    expect(container.querySelector('h1')).toHaveTextContent('Native reading');
    expect(container.querySelector('a')).toHaveAttribute('href', '#chapter');
    expect(container.querySelector('section')).not.toHaveAttribute('data-atlas-motion');
    expect(container.querySelector('picture')).not.toHaveAttribute('hidden');
    expect(container.querySelector('picture')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(container.querySelector('img')).toHaveAttribute('width', '1600');
    expect(container.querySelector('img')).toHaveAttribute('height', '1100');
    expect(container.querySelector('source')).toHaveAttribute('srcset', '/art/folio/matter-mobile.avif');
    expect(container.querySelector('source')).toHaveAttribute('width', '800');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toHaveAttribute('focusable', 'false');
    expect(container.querySelector('svg title')).toBeNull();
  });

  it('hides an SSR image that finished failing before hydration without another error event', () => {
    const content = <><h1>Available case</h1><FolioArt phase="matter" eager /></>;
    const container = document.createElement('div');
    container.innerHTML = renderToString(content);
    document.body.appendChild(container);
    const prerenderedImage = container.querySelector('img')!;
    // The request has already failed; no error event will be replayed after hydration.
    Object.defineProperties(prerenderedImage, {
      complete: { configurable: true, value: true },
      naturalWidth: { configurable: true, value: 0 },
    });
    const { unmount } = render(content, { container, hydrate: true });
    expect(container.querySelector('img')).toBe(prerenderedImage);
    expect(container.querySelector('picture')).toHaveAttribute('hidden');
    expect(screen.getByRole('heading')).toBeVisible();
    unmount();
    container.remove();
  });

  it('keeps pending lazy art visible and rechecks a completed request when the phase changes', () => {
    const complete = vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockImplementation(function (this: HTMLImageElement) {
      return this.src.includes('trajectory') || this.src.includes('weave');
    });
    const naturalWidth = vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockImplementation(function (this: HTMLImageElement) {
      return this.src.includes('weave') ? 1600 : 0;
    });
    try {
      const { container, rerender } = render(<FolioArt phase="matter" />);
      expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
      expect(container.querySelector('picture')).not.toHaveAttribute('hidden');
      rerender(<FolioArt phase="trajectory" />);
      expect(container.querySelector('picture')).toHaveAttribute('hidden');
      rerender(<FolioArt phase="weave" />);
      expect(container.querySelector('picture')).not.toHaveAttribute('hidden');
    } finally {
      complete.mockRestore();
      naturalWidth.mockRestore();
    }
  });

  it('hides only failed artwork and can display another phase', () => {
    const { container, rerender } = render(<><h1>Available case</h1><FolioArt phase="matter" eager /></>);
    expect(container.querySelector('img')).toHaveAttribute('loading', 'eager');
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('picture')).toHaveAttribute('hidden');
    expect(screen.getByRole('heading')).toBeVisible();
    rerender(<><h1>Available case</h1><FolioArt phase="trajectory" /></>);
    expect(container.querySelector('picture')).not.toHaveAttribute('hidden');
    expect(container.querySelector('img')).toHaveAttribute('src', '/art/folio/trajectory-desktop.webp');
  });
});

describe('Atlas motion lifecycle', () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;
  let observerCallback: IntersectionObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;
  let queries: Map<string, { matches: boolean; listeners: Set<() => void> }>;
  let bounds: DOMRect;
  const reduced = '(prefers-reduced-motion: reduce)';
  const forced = '(forced-colors: active)';
  const fine = '(hover: hover) and (pointer: fine)';
  const setPreference = (name: string, matches: boolean) => act(() => {
    const query = queries.get(name)!;
    query.matches = matches;
    query.listeners.forEach(listener => listener());
  });
  const flush = () => act(() => {
    const current = [...frames.values()];
    frames.clear();
    current.forEach(callback => callback(0));
  });

  beforeEach(() => {
    frames = new Map(); nextFrame = 0;
    bounds = { top: 0, bottom: 1200, left: 0, right: 1000, width: 1000, height: 1200, x: 0, y: 0, toJSON: () => ({}) };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => bounds);
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => { frames.delete(id); }));
    disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { observerCallback = callback; }
      observe = vi.fn();
      disconnect = disconnect;
    });
    queries = new Map([reduced, forced, fine].map(name => [name, { matches: name === fine, listeners: new Set<() => void>() }]));
    vi.stubGlobal('matchMedia', (name: string) => {
      const query = queries.get(name)!;
      return { get matches() { return query.matches; }, addEventListener: (_: string, listener: () => void) => query.listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => query.listeners.delete(listener) };
    });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('coalesces event bursts into one frame, clamps pointer offsets, and stays idle after painting', () => {
    render(<Surface />);
    const element = screen.getByTestId('surface');
    expect(frames.size).toBe(1);
    bounds = { ...bounds, top: -600, bottom: 600 };
    for (let index = 0; index < 20; index++) fireEvent.scroll(window);
    const pointer = new Event('pointermove');
    Object.assign(pointer, { clientX: 9000, clientY: -9000, pointerType: 'mouse' });
    fireEvent(element, pointer);
    expect(frames.size).toBe(1);
    flush();
    expect(element).toHaveAttribute('data-atlas-motion', 'active');
    expect(element).toHaveAttribute('data-atlas-stage', atlasPhase(600 / window.innerHeight).name);
    expect(element.style.getPropertyValue('--atlas-pointer-x')).toBe('8px');
    expect(element.style.getPropertyValue('--atlas-pointer-y')).toBe('-6px');
    expect(frames.size).toBe(0);
    fireEvent.pointerLeave(element);
    flush();
    expect(element.style.getPropertyValue('--atlas-pointer-x')).toBe('0px');
    expect(frames.size).toBe(0);
  });

  it('pauses offscreen or hidden and resumes on return without an idle loop', () => {
    render(<Surface />);
    const element = screen.getByTestId('surface');
    act(() => observerCallback([{ target: element, isIntersecting: false }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(frames.size).toBe(0);
    expect(element).toHaveAttribute('data-atlas-motion', 'paused');
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    act(() => observerCallback([{ target: element, isIntersecting: true }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    expect(frames.size).toBe(1);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange'));
    expect(frames.size).toBe(1);
    flush();
    expect(frames.size).toBe(0);
  });

  it('responds to reduced motion and forced colors with complete static content', () => {
    queries.get(reduced)!.matches = true;
    render(<Surface />);
    const element = screen.getByTestId('surface');
    expect(element).toHaveAttribute('data-atlas-motion', 'static');
    expect(screen.getByRole('link')).toBeVisible();
    expect(frames.size).toBe(0);
    setPreference(reduced, false);
    expect(frames.size).toBe(1);
    setPreference(forced, true);
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalled();
    expect(element).toHaveAttribute('data-atlas-motion', 'static');
    setPreference(forced, false);
    expect(frames.size).toBe(1);
  });

  it.each(['missing', 'throws'])('fails open when observer setup is %s', failure => {
    vi.stubGlobal('IntersectionObserver', failure === 'missing' ? undefined : class { observe() { throw Error('unavailable'); } disconnect() {} });
    render(<Surface />);
    expect(screen.getByTestId('surface')).toHaveAttribute('data-atlas-motion', 'static');
    expect(screen.getByRole('heading')).toBeVisible();
    expect(screen.getByRole('link')).toBeVisible();
    expect(frames.size).toBe(0);
  });

  it('cancels frames, disconnects, removes subscriptions and restores the supplied element on unmount', () => {
    const { unmount } = render(<Surface />);
    const element = screen.getByTestId('surface');
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalled();
    expect([...queries.values()].every(query => query.listeners.size === 0)).toBe(true);
    expect(element).not.toHaveAttribute('data-atlas-motion');
    expect(element.style.getPropertyValue('--atlas-progress')).toBe('');
    fireEvent.scroll(window);
    fireEvent.resize(window);
    fireEvent(element, Object.assign(new Event('pointermove'), { clientX: 50, clientY: 50 }));
    expect(frames.size).toBe(0);
  });

  it('can be explicitly disabled without scheduling work', () => {
    render(<Surface enabled={false} />);
    expect(screen.getByRole('link')).toBeVisible();
    expect(screen.getByTestId('surface')).toHaveAttribute('data-atlas-motion', 'static');
    expect(frames.size).toBe(0);
  });
});
