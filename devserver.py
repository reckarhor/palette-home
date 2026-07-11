"""Minimal static dev server: python3 devserver.py [port]"""
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))

from http.server import HTTPServer, SimpleHTTPRequestHandler

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
print(f"palette-home running at http://localhost:{port}", flush=True)
HTTPServer(("127.0.0.1", port), SimpleHTTPRequestHandler).serve_forever()
