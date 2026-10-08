"""Exercise the local API against a disposable database, never visitor data."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
spec=importlib.util.spec_from_file_location('preview',Path(__file__).parents[1]/'tools'/'serve_portfolio.py')
preview=importlib.util.module_from_spec(spec);spec.loader.exec_module(preview)
class BoardTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.tmp=tempfile.TemporaryDirectory();cls.db=Path(cls.tmp.name)/'notes.sqlite3';preview.Handler.database=str(cls.db)
  with sqlite3.connect(cls.db) as db:
   db.execute('CREATE TABLE notes(id TEXT PRIMARY KEY,created REAL,payload TEXT)');db.execute('CREATE TABLE rate(client TEXT PRIMARY KEY,last REAL)');db.execute('CREATE TABLE layout(id TEXT PRIMARY KEY,payload TEXT)')
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),preview.Handler);cls.base=f'http://127.0.0.1:{cls.server.server_port}'
  cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
 @classmethod
 def tearDownClass(cls):
  cls.server.shutdown();cls.server.server_close();cls.tmp.cleanup()
 def send(self,path,payload=None,origin=None,method=None):
  req=Request(self.base+path,method=method,data=json.dumps(payload).encode() if payload is not None else None,headers={'Content-Type':'application/json', 'Origin':origin or self.base})
  try:
   with urlopen(req) as r:return r.status,json.loads(r.read())
  except HTTPError as e:
   try:body=json.loads(e.read())
   except ValueError:body={}
   return e.code,body
 def test_01_validation_and_origin(self):
  self.assertEqual(self.send('/api/notes',{'name':'a','color':'blue','text':'','strokes':[]})[0],400)
  self.assertEqual(self.send('/api/notes',{},'https://example.com')[0],403)
  self.assertEqual(self.send('/assets/%2e%2e/.local/visitor-notes.sqlite3')[0],404)
  self.assertEqual(self.send('/.local/visitor-notes.sqlite3')[0],404)
 def test_02_save_reload_and_rate_limit(self):
  status,body=self.send('/api/notes',{'name':'Preview test','color':'blue','text':'A disposable test note.','strokes':[]})
  self.assertEqual(status,201);self.assertEqual(self.send('/api/notes')[1]['notes'][0]['id'],body['note']['id'])
  with sqlite3.connect(self.db) as db:self.assertEqual(json.loads(db.execute('SELECT payload FROM notes').fetchone()[0])['text'],'A disposable test note.')
  self.assertEqual(self.send('/api/notes',{'name':'test','color':'sage','text':'Too soon','strokes':[]})[0],429)
 def test_03_move_without_changing_note_content(self):
  note=self.send('/api/notes')[1]['notes'][0]
  position={'x':840,'y':280,'rotation':5}
  self.assertEqual(self.send('/api/notes',{'id':note['id'],'position':position},method='PATCH')[0],200)
  result=self.send('/api/notes')[1]
  self.assertEqual(result['notes'][0],note)
  self.assertEqual(result['layout'][note['id']],position)
  self.assertEqual(self.send('/api/notes',{'id':note['id'],'position':{'x':-1,'y':0,'rotation':0}},method='PATCH')[0],400)
  self.assertEqual(self.send('/api/notes',{'id':note['id'],'position':position},'https://example.com',method='PATCH')[0],403)
 def test_04_stickers_and_starter_placement(self):
  status,body=self.send('/api/notes',{'name':'','text':'','color':'butter','strokes':[],'sticker':'🪷','position':{'x':100,'y':200,'rotation':-5}})
  self.assertEqual(status,201);self.assertEqual(body['note']['sticker'],'🪷')
  self.assertEqual(self.send('/api/notes',{'id':'host-note','position':{'x':300,'y':250,'rotation':0}},method='PATCH')[0],200)
  self.assertEqual(self.send('/api/notes',{'name':'','text':'','color':'butter','strokes':[],'sticker':'<script>'})[0],400)
if __name__=='__main__':unittest.main()
