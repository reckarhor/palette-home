"""Minimal static dev server: python3 devserver.py [port]"""
import os
import sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))

from http.server import HTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    # dev-only helper: lets the page save a generated og-image.png to disk
    def do_POST(self):
        if self.path != "/og-image.png":
            self.send_error(403)
            return
        length = int(self.headers.get("Content-Length", 0))
        with open("og-image.png", "wb") as f:
            f.write(self.rfile.read(length))
        self.send_response(204)
        self.end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
print(f"palette-home running at http://localhost:{port}", flush=True)
HTTPServer(("127.0.0.1", port), Handler).serve_forever()
