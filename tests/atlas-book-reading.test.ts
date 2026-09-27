// @vitest-environment node
import {test,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
import {projects} from '../atlas/book/model';
const modulePath='../atlas/book/reading';
const m:any=existsSync('atlas/book/reading.ts')?await import(modulePath):{};
test('chapter destinations are stable and include source evidence',()=>{expect(typeof m.readingItems).toBe('function');const items=m.readingItems(projects[0].es.chapters,'es');expect(items[0].id).toBe('chapter-0');expect(items.at(-1).id).toBe('evidencia');expect(new Set(items.map((x:any)=>x.id)).size).toBe(items.length);});
test('active reading position follows the last passed heading',()=>{expect(typeof m.activeReadingId).toBe('function');expect(m.activeReadingId([{id:'a',top:-50},{id:'b',top:110},{id:'c',top:600}],120)).toBe('b');});
test('reading position handles empty or invalid geometry',()=>{expect(typeof m.activeReadingId).toBe('function');expect(m.activeReadingId([],120)).toBe('');expect(m.activeReadingId([{id:'a',top:NaN},{id:'b',top:300}],120)).toBe('b');});
test('affinity recommends only genuine other cases and remains bounded',()=>{expect(typeof m.relatedCases).toBe('function');for(const p of projects){const rows=m.relatedCases(p.slug);expect(rows.length).toBe(2);expect(rows.every((r:any)=>r.slug!==p.slug&&projects.some(q=>q.slug===r.slug))).toBe(true);expect(new Set(rows.map((r:any)=>r.slug)).size).toBe(2);}});
test('unknown case does not fabricate recommendations',()=>{expect(typeof m.relatedCases).toBe('function');expect(m.relatedCases('__proto__')).toEqual([]);});
test('reading navigation has a native mobile disclosure without a scroll hijacker',()=>{const p='atlas/book/CaseNavigation.tsx';expect(existsSync(p)).toBe(true);const s=readFileSync(p,'utf8');expect(s).toContain('<details');expect(s).toContain('aria-current');expect(s).not.toMatch(/setInterval|window\.onscroll/);});
test('case exposes an ordinary original capture link and native-size controls',()=>{const s=readFileSync('atlas/book/Case.tsx','utf8');expect(s).toContain('bk-capture-original');expect(s).toContain('data-native');});
