// @vitest-environment node
import {test,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Brief} from '../atlas/book/Brief';
test('name autocomplete is attached to an explicitly typed text control',()=>{
 const html=renderToStaticMarkup(createElement(Brief,{locale:'es'}));
 const input=html.match(/<input\b[^>]*id="book-name"[^>]*>/)?.[0]||'';
 expect(input).toContain('type="text"');
 expect(input).toContain('autoComplete="name"');
});
