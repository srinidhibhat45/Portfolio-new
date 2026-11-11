#!/usr/bin/env python3
"""Draw case-study diagrams (charts, flows, annotated screens) from small HTML files.

Each diagram is one file: content/case-diagrams/<slug>/<name>.html. It links ../diagram.css and
declares its size with  <meta name="diagram-size" content="1600x900">. This script opens each one in
headless Chrome, captures it at twice that size and writes assets/cases/<slug>/<name>.webp at the
declared size, so text stays sharp. Run:  python3 tools/build_case_diagrams.py [slug ...]
Prints "slug/name WxH" for each file so the sizes can go into the case-study content.
"""
import os, re, subprocess, sys, tempfile, glob
sys.path.append(os.path.expanduser('~/Library/Python/3.9/lib/python/site-packages'))
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SRC = os.path.join(ROOT, 'content', 'case-diagrams')
wanted = sys.argv[1:] or sorted(d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d)))
with tempfile.TemporaryDirectory() as tmp:
    for slug in wanted:
        for path in sorted(glob.glob(os.path.join(SRC, slug, '*.html'))):
            name = os.path.splitext(os.path.basename(path))[0]
            m = re.search(r'name="diagram-size" content="(\d+)x(\d+)"', open(path, encoding='utf-8').read())
            if not m: raise SystemExit(f'{path}: missing diagram-size meta')
            w, h = int(m.group(1)), int(m.group(2))
            shot = os.path.join(tmp, f'{slug}-{name}.png')
            subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                            '--force-device-scale-factor=2', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1', f'--window-size={w},{h}', f'--user-data-dir={os.path.join(tmp, "chrome")}',
                            '--virtual-time-budget=1500', f'--screenshot={shot}', 'file://' + path],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            image = Image.open(shot).convert('RGB').resize((w, h), Image.LANCZOS)
            out = os.path.join(ROOT, 'assets', 'cases', slug, name + '.webp')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            image.save(out, 'WEBP', quality=90, method=6)
            print(f'{slug}/{name} {w}x{h} {os.path.getsize(out)//1024}KB')
