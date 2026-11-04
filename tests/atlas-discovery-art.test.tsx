import React, { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadingFolio } from '../atlas/book/ReadingFolio';
import { Home } from '../atlas/book/Discovery';
import { useAtlasMotion } from '../atlas/book/art/useAtlasMotion';

function Reading({ enabled = true, entry = false }: { enabled?: boolean; entry?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useAtlasMotion(ref, { enabled, surfaces: '[data-atlas-surface]' });
  return <div ref={ref} data-testid="owner"><h1>Readable work</h1><a href="/es/proyectos/">Explore projects</a>
    <ReadingFolio phase="matter" nextPhase="trajectory" className="first" eager entry={entry} />
    <ReadingFolio phase="trajectory" nextPhase="weave" className="second" />
  </div>;
}

describe('Discovery reading-driven art consumer', () => {
  let frames: Map<number, FrameRequestCallback>;
  let serial: number;
  let intersect: IntersectionObserverCallback;
  let positions: Record<string, number>;
  let queries: Map<string, { matches: boolean; listeners: Set<() => void> }>;
  const reduced = '(prefers-reduced-motion: reduce)';
  const flush = () => act(() => {
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(0));
  });
  const preference = (matches: boolean) => act(() => {
    const query = queries.get(reduced)!; query.matches = matches;
    query.listeners.forEach(listener => listener());
  });
  beforeEach(() => {
    frames = new Map(); serial = 0;
    vi.stubGlobal('scrollY', 0);
    positions = { first: 250, second: 1500 };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = this.classList.contains('first') ? positions.first! : positions.second!;
      return { top, bottom: top + 300, left: 0, right: 500, width: 500, height: 300, x: 0, y: top, toJSON() {} };
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++serial, callback); return serial; });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { intersect = callback; }
      observe() {}
      disconnect() {}
    });
    queries = new Map(['(prefers-reduced-motion: reduce)', '(forced-colors: active)', '(hover: hover) and (pointer: fine)']
      .map(name => [name, { matches: false, listeners: new Set<() => void>() }]));
    vi.stubGlobal('matchMedia', (name: string) => {
      const query = queries.get(name)!;
      return { get matches() { return query.matches; }, addEventListener: (_: string, listener: () => void) => query.listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => query.listeners.delete(listener) };
    });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it('prerenders complete native content and adjacent reviewed poses with one eager resource', () => {
    const element = document.createElement('div');
    element.innerHTML = renderToString(<Home locale="es" />);
    expect(element.querySelector('h1')).toHaveTextContent('El trabajo.En perspectiva.');
    expect(element.querySelectorAll('.bk-hero-selector button')).toHaveLength(8);
    expect(element.querySelectorAll('img[loading="eager"][fetchpriority="high"]')).toHaveLength(1);
    const surfaces = [...element.querySelectorAll('[data-atlas-surface]')];
    expect(surfaces.map(surface => [surface.getAttribute('data-reading-from'), surface.getAttribute('data-reading-to')]))
      .toEqual([['matter', 'trajectory'], ['trajectory', 'weave'], ['weave', 'constellation'], ['weave', 'constellation']]);
    expect(surfaces.map(surface => surface.getAttribute('data-reading-static')))
      .toEqual(['matter', 'trajectory', 'weave', 'constellation']);
    expect(surfaces[3]).toHaveAttribute('data-static-pose', 'destination');
    surfaces.forEach(surface => {
      expect(surface).not.toHaveAttribute('data-atlas-motion');
      expect(surface.querySelector('.bk-reading-origin')).not.toHaveAttribute('hidden');
      expect(surface.querySelector('.bk-reading-destination img')).toHaveAttribute('loading', 'lazy');
    });
    expect(element.querySelector('.bk-evidence-deck img')).toHaveAttribute('alt');
  });

  it('uses the completed constellation as the final static fallback while retaining both transition poses', () => {
    const { container, rerender } = render(<ReadingFolio phase="weave" nextPhase="constellation" staticPhase="constellation" />);
    const surface = container.querySelector('[data-atlas-surface]')!;
    expect(surface).toHaveAttribute('data-static-pose', 'destination');
    expect(surface).toHaveAttribute('data-reading-static', 'constellation');
    expect(surface.querySelector('.bk-reading-origin')).toHaveAttribute('data-folio-phase', 'weave');
    expect(surface.querySelector('.bk-reading-destination')).toHaveAttribute('data-folio-phase', 'constellation');
    rerender(<ReadingFolio phase="matter" nextPhase="trajectory" staticPhase="constellation" />);
    expect(surface).toHaveAttribute('data-static-pose', 'origin');
    expect(surface).toHaveAttribute('data-reading-static', 'matter');
  });

  it.each(['reduced', 'observer unavailable'])('keeps the final completed fallback with %s motion', mode => {
    if (mode === 'reduced') queries.get(reduced)!.matches = true;
    else vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = render(<Home locale="en" />);
    const final = container.querySelector('.bk-atlas-discipline-art')!;
    expect(final).toHaveAttribute('data-atlas-motion', 'static');
    expect(final).toHaveAttribute('data-reading-static', 'constellation');
    expect(final).toHaveAttribute('data-static-pose', 'destination');
    expect(final.querySelector('.bk-reading-origin')).toHaveAttribute('data-folio-phase', 'weave');
    expect(final.querySelector('.bk-reading-destination')).toHaveAttribute('data-folio-phase', 'constellation');
    expect(frames.size).toBe(0);
  });

  it('updates local visible progress forward and backward using one frame and no root movement', () => {
    const listen = vi.spyOn(window, 'addEventListener');
    const { container } = render(<Reading />);
    const first = container.querySelector<HTMLElement>('.first')!;
    const second = container.querySelector<HTMLElement>('.second')!;
    flush();
    const initial = Number(first.style.getPropertyValue('--atlas-progress'));
    expect(first).toHaveAttribute('data-atlas-motion', 'active');
    expect(second).toHaveAttribute('data-atlas-motion', 'paused');
    expect(screen.getByTestId('owner')).toHaveAttribute('data-atlas-motion', 'coordinated');
    positions.first = -150;
    for (let i = 0; i < 12; i++) fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    flush();
    expect(Number(first.style.getPropertyValue('--atlas-progress'))).toBeGreaterThan(initial);
    positions.first = 250; fireEvent.scroll(window); flush();
    expect(Number(first.style.getPropertyValue('--atlas-progress'))).toBeCloseTo(initial);
    expect(frames.size).toBe(0);
    expect(listen.mock.calls.filter(([event]) => event === 'scroll')).toHaveLength(1);
    expect(listen.mock.calls.filter(([event]) => event === 'resize')).toHaveLength(1);
  });

  it('keeps the hero at completed matter on entry and evolves only with real reversible page reading', () => {
    const { container } = render(<Reading entry />);
    const first = container.querySelector<HTMLElement>('.first')!;
    flush();
    expect(first).toHaveAttribute('data-atlas-stage', 'matter');
    expect(first.style.getPropertyValue('--atlas-progress')).toBe('0');
    vi.stubGlobal('scrollY', 150); positions.first = 100;
    fireEvent.scroll(window); flush();
    expect(Number(first.style.getPropertyValue('--atlas-progress'))).toBeCloseTo(.5);
    vi.stubGlobal('scrollY', 0); positions.first = 250;
    fireEvent.scroll(window); flush();
    expect(first).toHaveAttribute('data-atlas-stage', 'matter');
    expect(first.style.getPropertyValue('--atlas-progress')).toBe('0');
    expect(frames.size).toBe(0);
  });

  it('freezes offscreen art while a later surface receives progress and restores on reverse', () => {
    const { container, unmount } = render(<Reading />);
    const first = container.querySelector<HTMLElement>('.first')!;
    const second = container.querySelector<HTMLElement>('.second')!;
    flush();
    positions.first = -600; positions.second = 200;
    act(() => intersect([{ target: first, isIntersecting: false }, { target: second, isIntersecting: true }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    flush();
    const frozen = first.getAttribute('style');
    positions.second = -100;
    fireEvent.scroll(window); flush();
    expect(first.getAttribute('style')).toBe(frozen);
    expect(second).toHaveAttribute('data-atlas-motion', 'active');
    positions.first = 250; positions.second = 1500;
    act(() => intersect([{ target: first, isIntersecting: true }, { target: second, isIntersecting: false }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    flush();
    expect(first).toHaveAttribute('data-atlas-motion', 'active');
    act(() => intersect([{ target: first, isIntersecting: false }] as unknown as IntersectionObserverEntry[], {} as IntersectionObserver));
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    unmount();
    expect(first).not.toHaveAttribute('data-atlas-motion');
    expect(queries.get(reduced)!.listeners.size).toBe(0);
  });

  it('immediately resets complete static poses on reduced motion and resumes without a loop', () => {
    const { container } = render(<Reading />);
    flush();
    const first = container.querySelector<HTMLElement>('.first')!;
    preference(true);
    expect(first).toHaveAttribute('data-atlas-motion', 'static');
    expect(first.style.getPropertyValue('--atlas-progress')).toBe('0');
    expect(frames.size).toBe(0);
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    expect(screen.getByRole('heading')).toBeVisible();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/es/proyectos/');
    preference(false); flush();
    expect(first).toHaveAttribute('data-atlas-motion', 'active');
    expect(frames.size).toBe(0);
  });

  it.each(['disabled', 'missing observer', 'observer failure'])('retains complete static content with %s', mode => {
    if (mode === 'missing observer') vi.stubGlobal('IntersectionObserver', undefined);
    if (mode === 'observer failure') vi.stubGlobal('IntersectionObserver', class { observe() { throw Error('unavailable'); } disconnect() {} });
    const { container } = render(<Reading enabled={mode !== 'disabled'} />);
    expect(container.querySelector('.first')).toHaveAttribute('data-atlas-motion', 'static');
    expect(container.querySelector('.bk-reading-origin')).not.toHaveAttribute('hidden');
    expect(screen.getByRole('link')).toBeVisible();
    expect(frames.size).toBe(0);
  });
});
