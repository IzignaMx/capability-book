import React from 'react';
import { fireEvent, render, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Home } from '../atlas/book/Discovery';
import { projects, pathFor } from '../atlas/book/model';
import { projectSignature } from '../atlas/book/art/trajectories';

describe('the selected project travels through the opening Atlas', () => {
  it.each(['es', 'en'] as const)('prerenders a complete %s opening with project identity before its evidence', locale => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Home locale={locale} />);
    const plate = container.querySelector('.bk-hero-plate')!;
    expect(plate).toHaveAttribute('aria-hidden', 'true');
    expect(plate.querySelectorAll('[data-hero-station]')).toHaveLength(projects.length);
    expect(plate.querySelector('[data-active="true"]')).toHaveAttribute('data-hero-station', projects[0].slug);
    expect(container.querySelector('.bk-hero-caption')).toHaveTextContent(projects[0][locale].title);
    expect(container.querySelector('.bk-hero-caption')!.compareDocumentPosition(container.querySelector('.bk-atlas-capture')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('.bk-atlas-capture')).toHaveAttribute('href', pathFor(locale, 'case', projects[0].slug));
    expect(container.querySelectorAll('.bk-hero-selector button')).toHaveLength(projects.length);
    expect(container.querySelectorAll('.bk-hero-selector button[aria-pressed="true"]')).toHaveLength(1);
  });

  it('keeps all eight manual selections, the large trajectory and authentic evidence in agreement', () => {
    const { container } = render(<Home locale="es" />);
    const selectors = within(container.querySelector('.bk-hero-selector') as HTMLElement).getAllByRole('button');
    projects.forEach((project, index) => {
      selectors[index]!.focus();
      fireEvent.click(selectors[index]!);
      expect(selectors[index]).toHaveFocus();
      expect(selectors[index]).toHaveAttribute('aria-pressed', 'true');
      expect(container.querySelectorAll('.bk-hero-selector button[aria-pressed="true"]')).toHaveLength(1);
      expect(container.querySelector('.bk-hero-caption')).toHaveTextContent(project.es.title);
      expect(container.querySelector('.bk-atlas-capture')).toHaveAttribute('href', pathFor('es', 'case', project.slug));
      expect(container.querySelector('.bk-atlas-capture img')).toHaveAttribute('src', project.media[0].variants.desktop.webp);
      expect(container.querySelectorAll('.bk-hero-plate [data-active="true"]')).toHaveLength(1);
      expect(container.querySelector('.bk-hero-plate [data-active="true"]')).toHaveAttribute('data-hero-station', project.slug);
      const signature = container.querySelector('.bk-hero-trajectory')!;
      expect(signature).toHaveAttribute('data-project', project.slug);
      expect([...signature.querySelectorAll('path')].map(path => path.getAttribute('d'))).toEqual([...projectSignature(project.slug)]);
      expect(container.querySelectorAll('.bk-atlas-evidence [aria-live="polite"]')).toHaveLength(1);
    });
  });

  it('retains the active project and native links when both decorative poses fail', () => {
    const { container } = render(<Home locale="en" />);
    const button = within(container.querySelector('.bk-hero-selector') as HTMLElement).getAllByRole('button')[7]!;
    fireEvent.click(button);
    container.querySelectorAll('.bk-hero-plate img').forEach(image => fireEvent.error(image));
    expect(container.querySelectorAll('.bk-hero-plate picture[hidden]')).toHaveLength(2);
    expect(container.querySelector('.bk-hero-caption')).toHaveTextContent(projects[7]!.en.title);
    expect(container.querySelector('.bk-atlas-capture')).toHaveAttribute('href', pathFor('en', 'case', projects[7]!.slug));
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
