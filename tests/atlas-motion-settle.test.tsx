import { useRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAtlasMotion } from '../atlas/book/art/useAtlasMotion';

function Scene({ settle = true, enabled = true }: { settle?: boolean; enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useAtlasMotion(ref, { surfaces: '[data-atlas-surface]', settle, enabled });
  return <div ref={ref} data-testid="scene"><a href="/es/proyectos/">Read the work</a>
    <div data-atlas-surface="" data-testid="entry" data-atlas-progress="entry" />
    <div data-atlas-surface="" data-testid="later" />
  </div>;
}

describe('optional coordinated Atlas settling', () => {
  let frames: Map<number, FrameRequestCallback>;
  let serial: number;
  let time: number;
  let intersect: IntersectionObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;
  let tops: Record<string, number>;
  let queries: Map<string, { matches: boolean; listeners: Set<() => void> }>;
  const reduced = '(prefers-reduced-motion: reduce)';
  const forced = '(forced-colors: active)';
  const fine = '(hover: hover) and (pointer: fine)';
  const value = (element: HTMLElement, name = '--atlas-progress') => parseFloat(element.style.getPropertyValue(name));
  const flush = (elapsed = 16) => act(() => {
    time += elapsed;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(time));
  });
  const drain = () => {
    let count = 0;
    while (frames.size && count < 80) { flush(); count++; }
    expect(frames.size).toBe(0);
    return count;
  };
  const preference = (name: string, matches: boolean) => act(() => {
    const query = queries.get(name)!; query.matches = matches;
    query.listeners.forEach(listener => listener());
  });
  const observation = (...changes: [HTMLElement, boolean][]) => act(() => intersect(
    changes.map(([target, isIntersecting]): IntersectionObserverEntry => ({
      target, isIntersecting, time, rootBounds: null,
      boundingClientRect: target.getBoundingClientRect(),
      intersectionRect: isIntersecting ? target.getBoundingClientRect() : new DOMRectReadOnly(),
      intersectionRatio: isIntersecting ? 1 : 0,
    })),
    {} as IntersectionObserver,
  ));
  const pointer = (element: HTMLElement, pointerType = 'mouse') => fireEvent(element,
    Object.assign(new Event('pointermove', { bubbles: true }), { clientX: 9000, clientY: -9000, pointerType }));

  beforeEach(() => {
    frames = new Map(); serial = 0; time = 0;
    tops = { entry: 100, later: 1500 };
    vi.stubGlobal('innerHeight', 800);
    vi.stubGlobal('scrollY', 0);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const top = tops[this.dataset.testid!] ?? 0;
      return { top, bottom: top + 400, left: 0, right: 500, width: 500, height: 400, x: 0, y: top, toJSON() {} };
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++serial, callback); return serial; });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
    disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) { intersect = callback; }
      observe() {}
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

  it('rests at entry, batches scroll bursts and settles reversibly to exact progress with no idle frames', () => {
    const listen = vi.spyOn(window, 'addEventListener');
    render(<Scene />);
    const entry = screen.getByTestId('entry');
    flush();
    expect(value(entry)).toBe(0);
    expect(frames.size).toBe(0);
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    for (let i = 0; i < 20; i++) fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    flush();
    expect(value(entry)).toBeGreaterThan(0);
    expect(value(entry)).toBeLessThan(.5);
    expect(frames.size).toBe(1);
    expect(drain()).toBeLessThan(40);
    expect(value(entry)).toBe(.5);
    expect(entry).toHaveAttribute('data-atlas-stage', 'weave');
    vi.stubGlobal('scrollY', 0); tops.entry = 100;
    fireEvent.scroll(window); flush();
    expect(value(entry)).toBeGreaterThan(0);
    expect(value(entry)).toBeLessThan(.5);
    drain();
    expect(value(entry)).toBe(0);
    expect(entry).toHaveAttribute('data-atlas-stage', 'matter');
    expect(listen.mock.calls.filter(([event]) => event === 'scroll')).toHaveLength(1);
    expect(listen.mock.calls.filter(([event]) => event === 'resize')).toHaveLength(1);
  });

  it('caps elapsed-time jumps and follows the most recent geometry while settling', () => {
    render(<Scene />);
    const entry = screen.getByTestId('entry');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    fireEvent.scroll(window); flush();
    const first = value(entry);
    flush(5000);
    expect(value(entry)).toBeGreaterThan(first);
    expect(value(entry)).toBeLessThan(.4);
    // An existing frame must use new reading geometry even before another scroll event.
    vi.stubGlobal('scrollY', 100); tops.entry = 0;
    drain();
    expect(value(entry)).toBe(.25);
  });

  it('settles only bounded fine-pointer offsets and returns to rest after leaving', () => {
    render(<Scene />);
    const scene = screen.getByTestId('scene');
    const entry = screen.getByTestId('entry');
    flush(); pointer(scene); flush();
    expect(value(entry, '--atlas-pointer-x')).toBeGreaterThan(0);
    expect(value(entry, '--atlas-pointer-x')).toBeLessThan(8);
    drain();
    expect(value(entry, '--atlas-pointer-x')).toBe(8);
    expect(value(entry, '--atlas-pointer-y')).toBe(-6);
    fireEvent.pointerLeave(scene); drain();
    expect(value(entry, '--atlas-pointer-x')).toBe(0);
    pointer(scene, 'touch');
    expect(frames.size).toBe(0);
    preference(fine, false); flush(); pointer(scene);
    expect(frames.size).toBe(0);
    expect(value(entry, '--atlas-pointer-x')).toBe(0);
  });

  it('freezes a departing surface, reads the latest returning geometry and cancels when all surfaces leave', () => {
    render(<Scene />);
    const entry = screen.getByTestId('entry');
    const later = screen.getByTestId('later');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    fireEvent.scroll(window); flush();
    tops.entry = -500; tops.later = 300;
    observation([entry, false], [later, true]);
    const frozen = entry.getAttribute('style');
    tops.later = 200; flush();
    expect(entry.getAttribute('style')).toBe(frozen);
    expect(value(later)).toBe(.5);
    expect(frames.size).toBe(0);
    observation([later, false]);
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    vi.stubGlobal('scrollY', 100); tops.entry = 0;
    observation([entry, true]); flush();
    expect(value(entry)).toBe(.25);
    expect(frames.size).toBe(0);
  });

  it('stops a pending settle when geometry leaves before the observer callback', () => {
    render(<Scene />);
    const entry = screen.getByTestId('entry');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    fireEvent.scroll(window); flush();
    const lastVisible = value(entry);
    tops.entry = -500; flush();
    expect(entry).toHaveAttribute('data-atlas-motion', 'paused');
    expect(value(entry)).toBe(lastVisible);
    expect(frames.size).toBe(0);
    tops.entry = 0; vi.stubGlobal('scrollY', 100);
    observation([entry, true]); flush();
    expect(value(entry)).toBe(.25);
    expect(frames.size).toBe(0);
  });

  it('cancels hidden work and resumes from current geometry without replaying motion or pointer state', () => {
    render(<Scene />);
    const entry = screen.getByTestId('entry');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    pointer(screen.getByTestId('scene')); fireEvent.scroll(window); flush();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    fireEvent(document, new Event('visibilitychange'));
    expect(frames.size).toBe(0);
    expect(value(entry, '--atlas-pointer-x')).toBe(0);
    vi.stubGlobal('scrollY', 100); tops.entry = 0;
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    fireEvent(document, new Event('visibilitychange')); flush(5000);
    expect(value(entry)).toBe(.25);
    expect(value(entry, '--atlas-pointer-x')).toBe(0);
    expect(frames.size).toBe(0);
  });

  it.each([reduced, forced])('immediately restores complete static output for %s and remeasures on resume', name => {
    render(<Scene />);
    const entry = screen.getByTestId('entry');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    fireEvent.scroll(window); flush();
    preference(name, true);
    expect(entry).toHaveAttribute('data-atlas-motion', 'static');
    expect(value(entry)).toBe(0);
    expect(frames.size).toBe(0);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/es/proyectos/');
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    vi.stubGlobal('scrollY', 100); tops.entry = 0;
    preference(name, false); flush();
    expect(value(entry)).toBe(.25);
    expect(frames.size).toBe(0);
  });

  it('preserves direct coordinated updates when settling is not enabled', () => {
    render(<Scene settle={false} />);
    const entry = screen.getByTestId('entry');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    fireEvent.scroll(window); flush();
    expect(value(entry)).toBe(.5);
    expect(frames.size).toBe(0);
  });

  it('cancels a pending settle, removes subscriptions and restores original attributes on unmount', () => {
    const { unmount } = render(<Scene />);
    const entry = screen.getByTestId('entry');
    const scene = screen.getByTestId('scene');
    flush();
    vi.stubGlobal('scrollY', 200); tops.entry = -100;
    fireEvent.scroll(window); flush();
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(disconnect).toHaveBeenCalled();
    expect([...queries.values()].every(query => query.listeners.size === 0)).toBe(true);
    expect(entry).not.toHaveAttribute('data-atlas-motion');
    expect(scene).not.toHaveAttribute('data-atlas-motion');
    expect(entry.style.getPropertyValue('--atlas-progress')).toBe('');
    fireEvent.scroll(window); fireEvent.resize(window); pointer(scene);
    expect(frames.size).toBe(0);
  });
});
