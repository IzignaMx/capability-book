#!/usr/bin/env python3
import hashlib,json,sys
from pathlib import Path
root=Path(sys.argv[1] if len(sys.argv)>1 else 'dist').resolve();manifest=json.loads((root/'.atlas-manifest.json').read_text())
actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and p.name!='.atlas-manifest.json'}
assert actual==set(manifest),'Artifact file inventory mismatch'
for rel,expected in manifest.items():
 p=(root/rel).resolve();assert p.is_relative_to(root) and p.is_file(),rel
 assert hashlib.sha256(p.read_bytes()).hexdigest()==expected,rel
print('Verified',len(manifest),'artifact checksums')
