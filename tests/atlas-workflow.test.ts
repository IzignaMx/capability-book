// @vitest-environment node
import{readFileSync}from'node:fs';import{test,expect}from'vitest';
const workflow=readFileSync('.github/workflows/quality.yml','utf8');
test('production deployment retains main-only guard and all three prerequisite gates',()=>{
 expect(workflow).toContain("github.ref == 'refs/heads/main'");expect(workflow).toContain('needs: [quality, e2e, accessibility]');expect(workflow).toContain('pages: write');expect(workflow).toContain('id-token: write');
});
test('browser and accessibility inspect the same checksummed dist, without rebuilding it',()=>{
 const testJobs=workflow.split('  e2e:')[1]!.split('  deploy:')[0]!;
 expect((testJobs.match(/name: atlas-dist/g)||[]).length).toBe(2);expect(testJobs).not.toContain('run: pnpm build');expect((testJobs.match(/verify-atlas-manifest.py/g)||[]).length).toBe(4);
});
test('lockfile and legacy rollback remain available',()=>{
 const pkg=JSON.parse(readFileSync('package.json','utf8'));expect(pkg.scripts['build:legacy']).toContain('astro build');expect(pkg.scripts.build).toContain('astro.atlas.config.mjs');expect(workflow).not.toContain('--no-frozen-lockfile');
});
