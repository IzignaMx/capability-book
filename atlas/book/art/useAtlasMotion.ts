import { useEffect, type RefObject } from 'react';
import { atlasPhase } from './trajectories';

export type AtlasMotionOptions = { enabled?: boolean };

/** A single event-batched frame writes visual properties; React owns no frame state. */
export function useAtlasMotion(ref: RefObject<HTMLElement | null>, { enabled = true }: AtlasMotionOptions = {}) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const attributes = ['data-atlas-motion', 'data-atlas-stage'] as const;
    const properties = ['--atlas-progress', '--atlas-pointer-x', '--atlas-pointer-y'] as const;
    const originalAttributes = attributes.map(name => element.getAttribute(name));
    const originalProperties = properties.map(name => [element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    let inView = false;
    let running = false;
    let disposed = false;
    let pointer: { x: number; y: number } | undefined;
    const cleanups: Array<() => void> = [];
    const resetPointer = () => {
      pointer = undefined;
      element.style.setProperty('--atlas-pointer-x', '0px');
      element.style.setProperty('--atlas-pointer-y', '0px');
    };
    const cancel = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
    };
    const staticState = () => {
      element.dataset.atlasMotion = 'static';
      element.dataset.atlasStage = 'matter';
      element.style.setProperty('--atlas-progress', '0');
      resetPointer();
    };
    const canRun = () => running && inView && document.visibilityState !== 'hidden';
    const paint = () => {
      frame = 0;
      if (!canRun()) return;
      const rect = element.getBoundingClientRect();
      // Long sections map their reading range; short sections progress from their top edge.
      const distance = Math.max(rect.height - window.innerHeight, window.innerHeight, 1);
      const phase = atlasPhase(-rect.top / distance);
      element.dataset.atlasMotion = 'active';
      element.dataset.atlasStage = phase.name;
      element.style.setProperty('--atlas-progress', String(phase.progress));
      const x = pointer && rect.width > 0 ? Math.max(-1, Math.min(1, (pointer.x - rect.left) / rect.width * 2 - 1)) * 8 : 0;
      const y = pointer && rect.height > 0 ? Math.max(-1, Math.min(1, (pointer.y - rect.top) / rect.height * 2 - 1)) * 6 : 0;
      element.style.setProperty('--atlas-pointer-x', `${x}px`);
      element.style.setProperty('--atlas-pointer-y', `${y}px`);
    };
    const schedule = () => {
      if (canRun() && !frame) frame = window.requestAnimationFrame(paint);
    };
    const pause = () => {
      cancel();
      resetPointer();
      element.dataset.atlasMotion = 'paused';
    };
    const visibility = () => { if (canRun()) schedule(); else pause(); };
    let finePointer: MediaQueryList | undefined;
    const pointerMove = (event: PointerEvent) => {
      if (!canRun() || !finePointer?.matches || event.pointerType === 'touch') return;
      pointer = { x: event.clientX, y: event.clientY };
      schedule();
    };
    const pointerLeave = () => { pointer = undefined; schedule(); };
    const stop = () => {
      running = false;
      cancel();
      observer?.disconnect();
      observer = undefined;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', visibility);
      element.removeEventListener('pointermove', pointerMove);
      element.removeEventListener('pointerleave', pointerLeave);
      staticState();
    };

    staticState();
    try {
      if (!enabled || typeof window.matchMedia !== 'function' || typeof window.IntersectionObserver !== 'function' ||
        typeof window.requestAnimationFrame !== 'function' || typeof window.cancelAnimationFrame !== 'function') {
        return () => restore();
      }
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const forcedColors = window.matchMedia('(forced-colors: active)');
      finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
      const configure = () => {
        stop();
        if (disposed || reducedMotion.matches || forcedColors.matches) return;
        try {
          observer = new window.IntersectionObserver(entries => {
            if (!running) return;
            const entry = entries.find(item => item.target === element);
            if (!entry) return;
            inView = entry.isIntersecting;
            if (canRun()) schedule(); else pause();
          });
          observer.observe(element);
          running = true;
          const rect = element.getBoundingClientRect();
          inView = rect.bottom > 0 && rect.top < window.innerHeight;
          window.addEventListener('scroll', schedule, { passive: true });
          window.addEventListener('resize', schedule, { passive: true });
          document.addEventListener('visibilitychange', visibility);
          element.addEventListener('pointermove', pointerMove, { passive: true });
          element.addEventListener('pointerleave', pointerLeave, { passive: true });
          visibility();
        } catch {
          stop();
        }
      };
      for (const query of [reducedMotion, forcedColors, finePointer]) {
        const onChange = () => configure();
        query.addEventListener('change', onChange);
        cleanups.push(() => query.removeEventListener('change', onChange));
      }
      configure();
    } catch {
      stop();
    }
    return () => {
      disposed = true;
      stop();
      cleanups.forEach(cleanup => cleanup());
      restore();
    };

    function restore() {
      attributes.forEach((name, index) => {
        const value = originalAttributes[index];
        if (value === null) element!.removeAttribute(name);
        else element!.setAttribute(name, value!);
      });
      properties.forEach((name, index) => {
        const [value, priority] = originalProperties[index]!;
        if (value) element!.style.setProperty(name, value, priority);
        else element!.style.removeProperty(name);
      });
    }
  }, [ref, enabled]);
}
