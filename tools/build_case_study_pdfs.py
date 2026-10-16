#!/usr/bin/env python3
"""Build two recruiter reading collections from the same content as the website.

Use the bundled Python runtime (reportlab, pypdf, Pillow). Original PDFs stay intact.
The output manifest supplies chapter page numbers to the static page builder.
"""
from pathlib import Path
from html import escape
import json
import re
import unicodedata

from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, Frame, Image, KeepTogether, PageBreak, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'assets/pdfs/case-studies'
OUTPUT.mkdir(parents=True, exist_ok=True)
PAPER = colors.HexColor('#f7f3ec')
INK = colors.HexColor('#252e2d')
DIM = colors.HexColor('#58645f')
ACCENT = colors.HexColor('#285451')
LINE = colors.HexColor('#d5d9ce')
W, H = 595.28, 841.89
MARGIN = 48
CW = W - MARGIN * 2


def clean(s):
    # Standard PDF fonts need typographic punctuation normalised, with ASCII hyphens.
    s = s.replace('…', '...').replace('’', "'").replace('‘', "'")
    s = s.replace('“', '"').replace('”', '"')
    s = re.sub(r'[\u2010-\u2015\u2212]', '-', s)
    return unicodedata.normalize('NFKC', s).replace('↗', '')


def text(s):
    return escape(clean(s))


styles = {
    'eyebrow': ParagraphStyle('eyebrow', fontName='Helvetica-Bold', fontSize=8,
                            leading=12, textColor=ACCENT, spaceAfter=18),
    'title': ParagraphStyle('title', fontName='Times-Roman', fontSize=34,
                          leading=36, textColor=INK, spaceAfter=18),
    'deck': ParagraphStyle('deck', fontName='Helvetica', fontSize=12,
                         leading=18, textColor=DIM, spaceAfter=20),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=18,
                            leading=23, textColor=INK, spaceBefore=16, spaceAfter=12),
    'sub': ParagraphStyle('sub', fontName='Helvetica-Bold', fontSize=12,
                        leading=16, textColor=INK, spaceBefore=15, spaceAfter=8),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10.2,
                         leading=15.1, textColor=INK, spaceAfter=10),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.1,
                          leading=11.5, textColor=DIM, spaceAfter=8),
    'fact': ParagraphStyle('fact', fontName='Times-Roman', fontSize=21,
                         leading=25, textColor=ACCENT, spaceAfter=4),
    'label': ParagraphStyle('label', fontName='Helvetica', fontSize=8,
                          leading=11, textColor=DIM),
    'trade': ParagraphStyle('trade', fontName='Helvetica', fontSize=9,
                          leading=13, textColor=ACCENT, spaceAfter=9),
}


def p(s, style='body'):
    return Paragraph(text(s), styles[style])


def rich(s, style='body'):
    return Paragraph(s, styles[style])


def picture(path, caption, max_height=220):
    source = ROOT / path
    if source.suffix.lower() == '.svg':
        return [Spacer(1, 24), p('The online story links to the working product.', 'small')]
    with PILImage.open(source) as im:
        iw, ih = im.size
        # JPEG keeps photo-heavy collections practical to download.
        cache = ROOT / 'tmp/pdfs/images' / (source.stem + '-' + source.parent.name + '.jpg')
        cache.parent.mkdir(parents=True, exist_ok=True)
        if not cache.exists():
            out = im.convert('RGB')
            out.thumbnail((1600, 1800))
            out.save(cache, quality=88, optimize=True)
    scale = min(CW / iw, max_height / ih)
    img = Image(str(cache), width=iw * scale, height=ih * scale)
    img.hAlign = 'LEFT'
    return [Spacer(1, 8), img, Spacer(1, 8), p(caption, 'small')]


class StudyDoc(BaseDocTemplate):
    def __init__(self, filename, collection):
        super().__init__(str(filename), pagesize=(W, H), leftMargin=MARGIN,
                         rightMargin=MARGIN, topMargin=48, bottomMargin=43,
                         title=collection + ' | Srinidhi Bhat', author='Srinidhi Bhat',
                         subject='Design decisions, working artifacts and retrospective lessons')
        self.collection = collection
        self.chapters = {}
        self.current_name = collection
        frame = Frame(MARGIN, 43, CW, H - 91, leftPadding=0, rightPadding=0,
                      topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='standard', frames=frame, onPage=self.decorate))

    def decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAPER)
        canvas.rect(0, 0, W, H, fill=1, stroke=0)
        canvas.setStrokeColor(LINE)
        canvas.line(MARGIN, H-31, W-MARGIN, H-31)
        canvas.line(MARGIN, 30, W-MARGIN, 30)
        canvas.setFillColor(DIM)
        canvas.setFont('Helvetica', 7.2)
        canvas.drawString(MARGIN, H-23, 'SRINIDHI BHAT / ' + clean(self.collection).upper())
        canvas.drawString(MARGIN, 18, 'Retrospective edition / October 2026 / srinidhibhat.com')
        canvas.drawRightString(W-MARGIN, 18, str(doc.page))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if hasattr(flowable, 'chapter_slug'):
            slug, name = flowable.chapter_slug, flowable.chapter_name
            self.chapters[slug] = self.page
            self.canv.bookmarkPage(slug)
            self.canv.addOutlineEntry(clean(name), slug, level=0)


def build_collection(cases, kind):
    selected = [c for c in cases if c['kind'] == kind]
    title = 'Design case studies' if kind == 'ux' else 'Product case studies'
    path = OUTPUT / ('ux-case-studies.pdf' if kind == 'ux' else 'product-case-studies.pdf')
    doc = StudyDoc(path, title)
    story = [p('SELECTED WORK / RECRUITER READING COLLECTION', 'eyebrow'),
             p('From a problem to a considered product.', 'title'),
             p('Srinidhi Bhat / UX Designer', 'deck'),
             p(('Ten design studies, rebuilt from original project artifacts.' if kind == 'ux' else
                'Nineteen studies of product ideas, UX direction, and interaction decisions, grounded in product artifacts and documentation.'), 'deck'),
             p('I care about the decisions between a problem and an interface: what to prioritise, '
               'what a person needs to understand, and what the design asks of the system behind it.'),
             p('Reading this collection', 'heading'),
             p('Each chapter explains the challenge, contribution, approach, three consequential decisions, '
               'the delivered scope, and the next evaluation. Early concepts are labelled as concepts. '
               'Research counts come from original artifacts; product counts describe product scope. '
               'Proposed studies are future work, and historical targets are not presented as achieved results.'),
             p('A note on this edition', 'heading'),
             p('These are retrospective accounts written in October 2026. They connect visible decisions '
               'in the original artifacts with my current UX analysis. Product stories describe my ideation and design direction; '
               'they do not claim code authorship or framework selection. The original design '
               'files are preserved separately, and sources are listed in every chapter.', 'small'),
             rich('<link href="https://srinidhibhat.com/case-studies/">Read the individual stories online</link>', 'small'),
             PageBreak(), p('CONTENTS / CHOOSE A STORY', 'eyebrow')]
    # Contents use clickable bookmarks; the manifest records actual chapter positions.
    for c in selected:
        story.append(rich('<link href="#' + c['slug'] + '"><b>' + text(c['name']) + '</b> / ' + text(c['headline']) + '</link>', 'body'))
    story.extend([Spacer(1, 12), p('Every chapter is also bookmarked in this PDF.', 'small'), PageBreak()])
    for c in selected:
        start = p(c['name'].upper() + ' / ' + c['context'].upper(), 'eyebrow')
        start.chapter_slug, start.chapter_name = c['slug'], c['name']
        story.extend([start, p(c['headline'], 'title'), p(c['summary'], 'deck'),
                      p('MY CONTRIBUTION / ' + c['role'], 'small'),
                      p('SCOPE / ' + c['status'], 'small')])
        facts = [[[p(f['value'], 'fact'), p(f['label'], 'label')] for f in c['facts']]]
        table = Table(facts, colWidths=[CW/3]*3)
        table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LINEABOVE',(0,0),(-1,0),.5,LINE),
                                   ('TOPPADDING',(0,0),(-1,-1),15),('BOTTOMPADDING',(0,0),(-1,-1),14),
                                   ('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),15)]))
        story.extend([Spacer(1, 12), table, p('The challenge', 'heading'), p(c['problem'])])
        first = c['figures'][0] if c['figures'] else dict(src=c['cover'], caption=(
            'Existing product capture from my portfolio archive.' if c.get('coverKind') == 'screen' else
            'Product identity from my portfolio archive; the online story links to the interactive product.'))
        story.extend(picture(first['src'], first['caption'], 215))
        story.extend([PageBreak(), p(c['name'].upper() + ' / APPROACH & DECISIONS', 'eyebrow'),
                      p('How I approached it', 'heading')])
        story.extend(p(s) for s in c['process'])
        for i, d in enumerate(c['decisions'], 1):
            story.append(KeepTogether([
                p(f'{i:02d} / ' + d['title'], 'sub'), p(d['choice']),
                rich('<b>Why it matters.</b> ' + text(d['reason'])),
                rich('<b>The trade-off.</b> ' + text(d['tradeoff']), 'trade')]))
        story.extend([PageBreak(), p(c['name'].upper() + ' / OUTCOME & REFLECTION', 'eyebrow'),
                      p('What came out of it', 'heading'), p(c['outcome']),
                      p('What I would do next', 'heading'), p(c['reflection'])])
        story.extend(p(s) for s in c['nextSteps'])
        if len(c['figures']) > 1:
            f = c['figures'][1]
            story.extend(picture(f['src'], f['caption'], 160))
        story.append(p('Artifacts & evidence', 'sub'))
        for s in c['sources']:
            story.append(rich('<b>' + text(s['label']) + '</b><br/>' + text(s['detail']), 'small'))
        if c.get('originalPdf'):
            story.append(rich('<link href="https://srinidhibhat.com/' + c['originalPdf'] + '">Original design artifact</link>', 'small'))
        story.append(rich('<link href="https://srinidhibhat.com/case-studies/' + c['slug'] + '.html">Read the individual web case study</link>', 'small'))
        story.append(PageBreak())
    doc.build(story)
    return doc.chapters


if __name__ == '__main__':
    cases = json.loads((ROOT / 'content/case-studies.json').read_text())
    manifest = {}
    for kind in ('ux', 'product'):
        manifest.update(build_collection(cases, kind))
    (ROOT / 'content/case-study-pdf-pages.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Built two PDF collections with {len(manifest)} bookmarked chapters.')
