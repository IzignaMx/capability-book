// @vitest-environment node
import {describe,it,expect} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
const read=(p:string)=>existsSync(p)?readFileSync(p,'utf8'):'';
describe('Atlas Pages integration contracts',()=>{
 it('prerenders to dist with the existing Astro runtime',()=>{const c=read('astro.atlas.config.mjs');expect(c).toContain('output: "static"');expect(c).toContain('outDir: "./dist"');expect(c).toContain('srcDir: "./atlas"');});
 it('uses an allowlisted generated static route',()=>{const c=read('atlas/pages/[...path].astro');expect(c).toContain('getStaticPaths');expect(c).toContain('allRoutes');expect(c).toContain('client:load');});
 it('keeps source evidence and production DNS unchanged',()=>{expect(read('public/CNAME').trim()).toBe('book.izignamx.com');expect(read('atlas/book/model.ts')).toContain('allRoutes');expect(read('src/pages/es/index.astro')).toContain('ExploreNarrative');});
 it('supports a static fallback without the Higgsfield server',()=>{expect(read('atlas/pages/404.astro')).toContain('404');expect(read('atlas/layouts/Page.astro')).not.toContain('@tanstack');expect(read('atlas/pages/index.astro')).toContain('/es/');});
});
