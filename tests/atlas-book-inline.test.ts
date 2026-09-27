// @vitest-environment node
import{test,expect}from'vitest';
const m:any=await import('../atlas/book/inline').catch(()=>({}));
test('published Markdown links become safe labeled segments',()=>{expect(m.linkSegments?.('Ver [Producto](https://example.com/) ahora')).toEqual([{text:'Ver '},{text:'Producto',href:'https://example.com/'},{text:' ahora'}])});
test('script URLs and malformed targets stay inert text',()=>{expect(m.linkSegments?.('[No](javascript:alert)')).toEqual([{text:'[No](javascript:alert)'}]);expect(m.linkSegments?.('[No](//evil.example/)')).toEqual([{text:'[No](//evil.example/)'}])});
