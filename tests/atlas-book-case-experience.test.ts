// @vitest-environment node
import {test,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {projects} from '../atlas/book/model';
import {Case} from '../atlas/book/Case';
for(const locale of ['es','en'] as const){
 test(`${locale} case connects reading controls and original evidence`,()=>{
  const html=renderToStaticMarkup(createElement(Case,{project:projects[0],locale}));
  expect(html).toContain('bk-reading-navigation');
  expect(html).toContain('bk-capture-original');
  expect(html).toContain(projects[0].media[0].variants.desktop.webp);
  expect(html).toContain('bk-image-pan');
  expect(html).toContain('data-native="false"');
 });
 test(`${locale} case has an inspectable decision study and related genuine work`,()=>{
  const html=renderToStaticMarkup(createElement(Case,{project:projects[0],locale}));
  expect(html).toContain('bk-decision-study');
  expect(html).toContain('bk-related-cases');
  expect(html).toContain('projects=omnisync');
  expect(html).toContain(projects[0][locale].challenge.replaceAll('&','&amp;'));
 });
}
test('all project narratives provide nonempty distinct decision steps',()=>{
 for(const p of projects)for(const l of ['es','en'] as const){const parts=[p[l].challenge,p[l].strategy,p[l].solution];expect(parts.every(t=>t.length>25)).toBe(true);expect(new Set(parts).size).toBe(3);}
});
