#!/usr/bin/env python3
"""Validate a static Atlas Pages artifact without running application code."""
import argparse,gzip,json,re,sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
p=argparse.ArgumentParser();p.add_argument('directory',nargs='?',default='dist');args=p.parse_args();root=Path(args.directory).resolve()
class Page(HTMLParser):
 def __init__(self):super().__init__();self.ids=set();self.links=[];self.assets=[];self.meta={};self.lang='';self.h1=0;self.canonical='';self.css=[]
 def handle_starttag(self,t,a):
  d=dict(a)
  if 'id' in d:self.ids.add(d['id'])
  if t=='html':self.lang=d.get('lang','')
  if t=='h1':self.h1+=1
  if t=='a' and d.get('href'):self.links.append(d['href'])
  if t=='meta':self.meta[d.get('name',d.get('http-equiv',''))]=d.get('content','')
  if t=='link':
   if d.get('rel')=='canonical':self.canonical=d.get('href','')
   if d.get('rel')=='stylesheet':self.css.append(d['href']);self.assets.append(d['href'])
  if t in ['img','script'] and d.get('src'):self.assets.append(d['src'])
  if t=='source' and d.get('srcset'):self.assets.extend(x.strip().split(' ')[0] for x in d['srcset'].split(','))
catalog=json.loads(Path("atlas/book/projects.json").read_text())
expected_content_pages=16+2*len(catalog)
errors=[];pages={}
for f in root.rglob('*.html'):
 path='/'+f.relative_to(root).as_posix();path=path[:-10] if path.endswith('index.html') else path
 doc=Page();doc.feed(f.read_text());pages[path]=doc
 if doc.h1!=1:errors.append(path+': expected one h1')
 if doc.lang not in ['es-MX','en']:errors.append(path+': invalid language')
 if not doc.canonical.startswith('https://book.izignamx.com/'):errors.append(path+': invalid canonical')
 csp=doc.meta.get('content-security-policy','')
 script=next((x for x in csp.split(';') if x.strip().startswith('script-src ')),'')
 if not script or 'unsafe-inline' in script or 'nonce-' in script:errors.append(path+': invalid static script policy')
 if 'sha256-' not in csp and path not in ['/404.html','/']:errors.append(path+': missing script hashes')
 if any(s in f.read_text() for s in ['auth.higgsfield.app','/auth/sign-in','/dist/server/','localhost:']):errors.append(path+': server-only reference')
for path,doc in pages.items():
 for href in doc.links+doc.assets:
  u=urlsplit(href)
  if u.scheme or u.netloc:continue
  target=u.path or path
  if not target.startswith('/'):continue
  local=(root/unquote(target).lstrip('/')).resolve()
  if not local.is_relative_to(root):errors.append(path+': output boundary');continue
  dest=local/'index.html' if target.endswith('/') else local
  if target.endswith('/') and target not in pages:errors.append(path+': missing page '+href)
  elif not dest.exists():errors.append(path+': missing asset '+href)
  if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:errors.append(path+': missing anchor '+href)
if len(pages)!=expected_content_pages+2:errors.append('Expected '+str(expected_content_pages+2)+' HTML documents, got '+str(len(pages)))
if (root/'CNAME').read_text().strip()!='book.izignamx.com':errors.append('CNAME differs')
if not (root/'.nojekyll').is_file():errors.append('.nojekyll absent')
if any(f.is_symlink() for f in root.rglob('*')):errors.append('Symlink in Pages artifact')
home=(root/'es/index.html').read_text();doc=pages['/es/']
critical=len(gzip.compress(home.encode()))+sum(len(gzip.compress((root/u.lstrip('/')).read_bytes())) for u in set(doc.css))
entries=set(re.findall(r'(?:component-url|renderer-url|src)="(/_astro/[^" ]+\.js)"',home));seen=set()
def visit(url):
 if url in seen:return
 seen.add(url);file=root/url.lstrip('/')
 if not file.exists():errors.append('Missing JS module '+url);return
 for match in re.finditer(r'(?:from\s*|import\s*)["\'](\.[^"\']+\.js)["\']',file.read_text()):
  child=(file.parent/match[1]).resolve();visit('/'+child.relative_to(root).as_posix())
for entry in entries:visit(entry)
initial=sum(len(gzip.compress((root/u.lstrip('/')).read_bytes())) for u in seen if (root/u.lstrip('/')).exists())
if critical>120*1024:errors.append('Critical HTML+CSS exceeds 120 KiB gzip')
if initial>180*1024:errors.append('Initial JS exceeds 180 KiB gzip')
report={'contentPages':expected_content_pages,'htmlDocuments':len(pages),'criticalHtmlCssGzipBytes':critical,'initialJsGzipBytes':initial,'initialModules':sorted(seen),'errors':errors}
Path('docs/atlas').mkdir(parents=True,exist_ok=True);Path('docs/atlas/static-validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));sys.exit(bool(errors))
