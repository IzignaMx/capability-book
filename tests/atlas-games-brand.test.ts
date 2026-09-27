// @vitest-environment node
import {test,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projects,filterProjects,allRoutes,cleanSelection,classification} from '../atlas/book/model';
import {nodePosition} from '../atlas/book/constellation-model';
test('catalog contains eight distinct bilingual projects including both games',()=>{
 expect(projects).toHaveLength(8);
 for(const slug of ['distrito-cero','nexo']){const p=projects.find(p=>p.slug===slug);expect(p).toBeDefined();expect(p?.es.chapters.length).toBeGreaterThanOrEqual(8);expect(p?.en.chapters.length).toBeGreaterThanOrEqual(8);expect(allRoutes).toContain('/es/proyectos/'+slug+'/');expect(allRoutes).toContain('/en/projects/'+slug+'/');}
});
test('game discovery and comparison preserve exact project identity',()=>{
 expect(filterProjects('','games','es').map(p=>p.slug)).toEqual(['distrito-cero','nexo']);expect(cleanSelection('nexo,distrito-cero,nexo,invalid')).toEqual(['nexo','distrito-cero']);
});
test('eight project nodes never alias their horizontal positions',()=>{
 const xy=Array.from({length:8},(_,i)=>{const p=nodePosition(i,1,8);return [p[0],p[2]].map(n=>n.toFixed(4)).join(',')});expect(new Set(xy).size).toBe(8);
});
test('header mark and favicon use verified production assets',()=>{
 const chrome=readFileSync('atlas/book/Chrome.tsx','utf8'),head=readFileSync('atlas/layouts/Page.astro','utf8');expect(chrome).toContain('/assets/brand-mark-white.svg');expect(head).toContain('/favicon.svg');expect(head).toContain('/favicon.ico');expect(head).toContain('/apple-touch-icon.png');
 for(const[path,hash]of [['public/assets/brand-mark-white.svg','a0450fdc7727c40f53197dd6769c1d2db75a3357d9d2f0bc241b5e095146f458'],['public/favicon.svg','8b2207cfd2d1a36cdef4b654446e906609dfe13720a25a2ca0604da8e5ca2fb0']]){expect(existsSync(path!)).toBe(true);expect(createHash('sha256').update(readFileSync(path!)).digest('hex')).toBe(hash);}
});
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {Home} from '../atlas/book/Discovery';
import {Case} from '../atlas/book/Case';
test('homepage offers both game cases without embedding their runtimes',()=>{
 const html=renderToStaticMarkup(createElement(Home,{locale:'es'}));expect(html).toContain('bk-game-shelf');expect(html).toContain('Jugar Distrito Cero');expect(html).toContain('Jugar Nexo');expect(html).not.toContain('<iframe');
});
test('each game case has a direct localized play action',()=>{
 for(const slug of ['distrito-cero','nexo']){const p=projects.find(p=>p.slug===slug)!;const html=renderToStaticMarkup(createElement(Case,{project:p,locale:'en'}));expect(html).toContain('bk-play-link');expect(html).toContain('Play '+p.en.title);}
});
test('game evidence files match the captured metadata hashes',()=>{
 for(const p of projects.filter(p=>['distrito-cero','nexo'].includes(p.slug))){for(const v of Object.values(p.media[0].variants)){for(const fmt of ['avif','webp'] as const){const file='public'+v[fmt];expect(existsSync(file)).toBe(true);const expected=(v as unknown as Record<string,string>)[fmt+'Sha256'];expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(expected);}}}
});
