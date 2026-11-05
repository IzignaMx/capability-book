import { fireEvent, render, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPage } from '../atlas/book/Map';
import { projects, pathFor } from '../atlas/book/model';

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => vi.unstubAllGlobals());

describe('immediate constellation project context', () => {
  it('prerenders original project evidence and a native destination before the map controls', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<MapPage locale="es" />);
    const inspector = container.querySelector('.bk-map-inspector')!;
    const preview = inspector.querySelector('.bk-map-context')!;
    expect(preview).not.toBeNull();
    expect(preview.querySelector('img')).toHaveAttribute('src', expect.stringContaining(projects[0].slug));
    expect(preview.querySelector('a')).toHaveAttribute('href', pathFor('es', 'case', projects[0].slug));
    expect(preview.compareDocumentPosition(inspector.querySelector('.bk-map-controls')!))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(inspector.querySelectorAll('.bk-map-projects button')).toHaveLength(8);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('keeps image, title, evidence, number, signature and case destination synchronized with manual selection', () => {
    const { container } = render(<MapPage locale="en" />);
    const inspector = container.querySelector('.bk-map-inspector')!;
    const buttons = inspector.querySelectorAll('.bk-map-projects button');
    for (const index of [2, 7, 0]) {
      const project = projects[index]!;
      fireEvent.click(buttons[index]!);
      const preview = inspector.querySelector('.bk-map-context')!;
      expect(preview).not.toBeNull();
      expect(preview).toHaveAttribute('data-project', project.slug);
      expect(preview.querySelector('.bk-map-context-title')).toHaveTextContent(project.en.title);
      expect(preview.querySelector('.bk-map-context-number')).toHaveTextContent(String(index + 1).padStart(2, '0'));
      expect(preview.querySelector('img')).toHaveAttribute('src', expect.stringContaining(project.slug));
      expect(preview.querySelector('[data-project]')).toHaveAttribute('data-project', project.slug);
      expect(preview.querySelector('a')).toHaveAttribute('href', pathFor('en', 'case', project.slug));
      expect(preview.querySelector('.bk-evidence-label')).toHaveTextContent(/.+/);
      expect(buttons[index]!).toHaveAttribute('aria-pressed', 'true');
      expect(container.querySelector('.bk-map-selected h2')).toHaveTextContent(project.en.title);
    }
  });

  it('announces project context once while retaining the expanded case reading below the workspace', () => {
    const { container } = render(<MapPage locale="es" />);
    const regions = container.querySelectorAll('[aria-live="polite"]');
    expect(regions).toHaveLength(1);
    expect(regions[0]!.closest('.bk-map-context')).not.toBeNull();
    expect(regions[0]!).toHaveAttribute('aria-atomic', 'true');
    expect(container.querySelector('.bk-map-context h2')).toBeNull();
    expect(container.querySelector('.bk-map-selected h2')).toHaveTextContent(projects[0].es.title);
    expect(within(container.querySelector('.bk-map-context')! as HTMLElement)
      .getByRole('link', { name: /Leer el caso/ })).toBeInTheDocument();
  });
});
