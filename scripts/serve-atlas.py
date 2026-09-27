#!/usr/bin/env python3
"""Static-only verification server. Never invokes Astro, React or any server bundle."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=4210);parser.add_argument('--directory',default='dist');args=parser.parse_args()
root=Path(args.directory).resolve()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
    def send_error(self,code,message=None,explain=None):
        if code==404 and (root/'404.html').exists():
            data=(root/'404.html').read_bytes();self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
        else:super().send_error(code,message,explain)
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
