#!/usr/bin/env python3
"""Local preview with a persistent, shared visitor board. Run: python3 tools/serve_portfolio.py"""
import argparse
import json
import math
import sqlite3
import time
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
COLORS = {'butter', 'blue', 'rose', 'sage'}
STICKERS = {'🙂','💛','✨','🪷','🌴','🌻','☀️','🦋','🎨','🚀','☕','🍀'}
STARTERS = {'host-note','starter-welcome','starter-smile','starter-lotus','starter-heart','starter-sparkles','starter-palm','starter-flower','starter-stamp'}

def validate_position(position):
    if not isinstance(position, dict) or any(type(position.get(k)) not in (int, float) or not math.isfinite(position[k]) for k in ('x','y','rotation')) or not 0 <= position['x'] <= 1400 or not 0 <= position['y'] <= 900 or abs(position['rotation']) > 15:
        raise ValueError('Please keep your mark on the canvas.')
    return {k:position[k] for k in ('x','y','rotation')}


def validate(data):
    if not isinstance(data, dict):
        raise ValueError('Please send a valid note.')
    name, text, color, strokes = data.get('name', ''), data.get('text', ''), data.get('color'), data.get('strokes', [])
    if not isinstance(name, str) or len(name) > 40 or not isinstance(text, str) or len(text) > 240 or color not in COLORS:
        raise ValueError('Keep your note under 240 characters and your name under 40.')
    if not isinstance(strokes, list) or len(strokes) > 80:
        raise ValueError('That drawing is a little too detailed. Try a simpler doodle.')
    for stroke in strokes:
        if not isinstance(stroke, list) or not 2 <= len(stroke) <= 250:
            raise ValueError('Please send a valid drawing.')
        for point in stroke:
            if not isinstance(point, list) or len(point) != 2 or any(type(v) not in (int, float) or not math.isfinite(v) for v in point) or not 0 <= point[0] <= 520 or not 0 <= point[1] <= 320:
                raise ValueError('Please send a valid drawing.')
    text = text.strip()
    sticker = data.get('sticker','')
    if not isinstance(sticker,str) or sticker and sticker not in STICKERS or sum((bool(text),bool(strokes),bool(sticker))) != 1:
        raise ValueError('Write a note, draw a doodle, or pick a sticker.')
    note = {'name':name.strip(),'text':text,'color':color,'strokes':strokes}
    if sticker: note['sticker'] = sticker
    if data.get('position') is not None: note['position'] = validate_position(data['position'])
    return note

class Handler(SimpleHTTPRequestHandler):
    database = None
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def json_response(self, data, status=200):
        content = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)
    def public_path(self):
        path = unquote(urlsplit(self.path).path)
        return path in ('/', '/index.html', '/favicon.ico', '/site.webmanifest', '/robots.txt', '/sitemap.xml') or any(path.startswith('/'+folder+'/') for folder in ('assets', 'css', 'js')) and '..' not in path
    def do_GET(self):
        if urlsplit(self.path).path == '/api/notes':
            with sqlite3.connect(self.database) as db:
                notes = [json.loads(row[0]) for row in db.execute('SELECT payload FROM notes ORDER BY created DESC LIMIT 80')]
            with sqlite3.connect(self.database) as db:
                layout = {row[0]:json.loads(row[1]) for row in db.execute('SELECT id,payload FROM layout')}
            return self.json_response({'notes': notes,'layout':layout})
        if not self.public_path():
            return self.send_error(404)
        return super().do_GET()
    def do_HEAD(self):
        if not self.public_path():
            return self.send_error(404)
        return super().do_HEAD()
    def do_PATCH(self):
        if urlsplit(self.path).path != '/api/notes': return self.json_response({'error':'Not found.'},404)
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'): return self.json_response({'error':'Please move marks from the portfolio.'},403)
        if self.headers.get('Content-Type','').split(';')[0] != 'application/json': return self.json_response({'error':'Please send a valid position.'},415)
        try:
            length = int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 2000: return self.json_response({'error':'Please send a valid position.'},413)
            data = json.loads(self.rfile.read(length))
            identity = data.get('id') if isinstance(data,dict) else None
            if not isinstance(identity,str): raise ValueError('Please choose a mark on the board.')
            if identity not in STARTERS:
                try: uuid.UUID(identity)
                except ValueError: raise ValueError('Please choose a mark on the board.')
            position = validate_position(data.get('position'))
        except (ValueError,TypeError,json.JSONDecodeError) as error: return self.json_response({'error':str(error)},400)
        with sqlite3.connect(self.database) as db:
            if identity not in STARTERS and not db.execute('SELECT id FROM notes WHERE id=?',(identity,)).fetchone(): return self.json_response({'error':'This mark could not be found.'},404)
            db.execute('INSERT OR REPLACE INTO layout VALUES(?,?)',(identity,json.dumps(position)))
        self.json_response({'id':identity,'position':position})
    def do_POST(self):
        if urlsplit(self.path).path != '/api/notes':
            return self.json_response({'error':'Not found.'},404)
        origin = self.headers.get('Origin')
        if origin and urlsplit(origin).netloc != self.headers.get('Host'):
            return self.json_response({'error':'Please pin your note from the portfolio.'},403)
        if self.headers.get('Content-Type','').split(';')[0] != 'application/json':
            return self.json_response({'error':'Please send a valid note.'},415)
        try:
            length = int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 180000:
                return self.json_response({'error':'This note is too large.'},413)
            data = json.loads(self.rfile.read(length))
            note = validate(data)
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            return self.json_response({'error':str(error)},400)
        now = time.time()
        with sqlite3.connect(self.database) as db:
            db.execute('BEGIN IMMEDIATE')
            client = self.client_address[0]+('|sticker' if note.get('sticker') else '')
            last = db.execute('SELECT last FROM rate WHERE client=?',(client,)).fetchone()
            if last and now-last[0] < (0.5 if note.get('sticker') else 10):
                return self.json_response({'error':'Give your last note a moment to settle. Try again in ten seconds.'},429)
            note.update(id=str(uuid.uuid4()),createdAt=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(now)))
            db.execute('INSERT INTO notes VALUES(?,?,?)',(note['id'],now,json.dumps(note)))
            db.execute('INSERT OR REPLACE INTO rate VALUES(?,?)',(client,now))
        self.json_response({'note':note},201)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8000);parser.add_argument('--db',type=Path,default=ROOT/'.local'/'visitor-notes.sqlite3');args=parser.parse_args()
    args.db.parent.mkdir(parents=True,exist_ok=True)
    Handler.database=str(args.db)
    with sqlite3.connect(args.db) as db:
        db.execute('CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY,created REAL,payload TEXT)')
        db.execute('CREATE TABLE IF NOT EXISTS rate(client TEXT PRIMARY KEY,last REAL)')
        db.execute('CREATE TABLE IF NOT EXISTS layout(id TEXT PRIMARY KEY,payload TEXT)')
    print(f'Portfolio live at http://localhost:{args.port}/',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
if __name__=='__main__': main()
