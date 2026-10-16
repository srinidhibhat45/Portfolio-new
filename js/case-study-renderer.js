/* Accessible case-study chapters, shared by the page and portfolio viewer. */
(function (root) {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  // Only authored [[emphasis]] is interpreted; everything else stays escaped text.
  function rich(text) {
    var result = '', end = 0;
    String(text).replace(/\[\[([^\]]+)\]\]/g, function (match, phrase, at) {
      result += esc(text.slice(end, at)) + '<mark>' + esc(phrase) + '</mark>';
      end = at + match.length;
      return match;
    });
    return result + esc(text.slice(end));
  }
  function paragraphs(items) { return items.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }
  function render(c, prefix) {
    prefix = prefix || '';
    var n = c.narrative, t = c.theme || {}, v = c.visual, base = c.slug + '-';
    if (!v || !n) throw new Error('Missing story or visual source for ' + c.slug);
    var order = t.order || ['brief','process','decisions','outcome','reflection'];
    var labels = {brief:'The problem',process:c.kind==='ux'?'Research & direction':'The direction',decisions:'Design decisions',outcome:'The outcome',reflection:'Reflection'};
    var figure = c.figures[1] || c.figures[0];
    function local(url) { return /^https:\/\//.test(url) ? esc(url) : prefix + esc(url); }
    function sourceFigure(f) {
      return '<figure class="cs-source-figure"><a href="'+local(f.src)+'" target="_blank" rel="noopener" aria-label="Open '+esc(f.alt)+' at full size"><img src="'+local(f.src)+'" alt="'+esc(f.alt)+'" loading="lazy" decoding="async"></a><figcaption>'+esc(f.caption)+'</figcaption></figure>';
    }
    function chapter(key, content) {
      var number = ('0' + (order.indexOf(key)+1)).slice(-2);
      return '<section class="cs-scene cs-'+key+'" id="'+base+key+'" tabindex="-1" aria-labelledby="'+base+key+'-heading"><p class="cs-scene-label"><span>'+number+'</span> '+esc(labels[key])+'</p>'+content+'</section>';
    }
    function heading(key, text) { return '<h2 id="'+base+key+'-heading">'+esc(text)+'</h2>'; }
    function decisionVisual(index) {
      var detail = (v.details || []).find(function(d) { return d.decision === index; });
      if (!detail) return '';
      if (![detail.x,detail.y,detail.width,detail.height,v.width,v.height].every(Number.isFinite) || detail.width <= 0 || detail.height <= 0 || detail.x < 0 || detail.y < 0 || detail.x+detail.width > v.width || detail.y+detail.height > v.height) throw new Error('Invalid source detail for '+c.slug);
      return '<figure class="cs-decision-visual"><a class="cs-detail-crop" style="aspect-ratio:'+detail.width+'/'+detail.height+'" href="'+local(v.src)+'" target="_blank" rel="noopener" aria-label="Open '+esc(detail.alt)+' at full size"><img src="'+local(v.src)+'" alt="'+esc(detail.alt)+'" width="'+v.width+'" height="'+v.height+'" loading="lazy" decoding="async" style="width:'+(v.width/detail.width*100)+'%;left:'+(-detail.x/detail.width*100)+'%;top:'+(-detail.y/detail.height*100)+'%"></a><figcaption>'+esc(detail.caption)+'</figcaption></figure>';
    }
    var actionUrl = c.liveUrl || c.prototypeUrl || c.originalPdf;
    var actionLabel = c.liveUrl ? (c.productActionLabel || 'Explore the product') : c.prototypeUrl ? 'Try the prototype' : 'View the original design';
    var action = actionUrl ? '<a class="cs-action" href="'+local(actionUrl)+'" target="_blank" rel="noopener">'+actionLabel+' <span aria-hidden="true">↗</span></a>' : '';
    var pdf = 'assets/pdfs/case-studies/'+(c.kind==='ux'?'ux-case-studies.pdf':'product-case-studies.pdf');
    var links = '<a href="'+prefix+pdf+'#page='+(c.pdfPage||1)+'" target="_blank" rel="noopener">Download '+(c.kind==='ux'?'design':'product')+' collection PDF ↗</a>';
    if (c.originalPdf) links += '<a href="'+prefix+esc(c.originalPdf)+'" target="_blank" rel="noopener">Original artifact ↗</a>';
    if (!prefix) links += '<a href="case-studies/'+esc(c.slug)+'.html">Open shareable page ↗</a>';
    var facts = '<dl class="cs-facts">'+c.facts.map(function(f){return '<div><dt>'+esc(f.value)+'</dt><dd>'+esc(f.label)+'</dd></div>';}).join('')+'</dl>';
    var audience = n.audience;
    var audienceHtml = audience ? '<div class="cs-audience"><p><strong>Designed for</strong> '+esc(audience.label)+'. '+esc(audience.need)+'</p><details class="cs-detail"><summary>User context <span>'+esc(audience.basis)+'</span></summary><div><p>'+esc(audience.context)+'</p><dl><div><dt>The friction</dt><dd>'+esc(audience.friction)+'</dd></div><div><dt>Design implication</dt><dd>'+esc(audience.implication)+'</dd></div></dl><p class="cs-scenario"><strong>Example situation · illustrative scenario.</strong> '+esc(n.scene)+'</p></div></details></div>' : '';
    var heroArt = v.src ? '<figure class="cs-evidence-plate" id="'+base+'visual"><a href="'+local(v.src)+'" target="_blank" rel="noopener" aria-label="Open '+esc(v.alt)+' at full size"><img src="'+local(v.src)+'" alt="'+esc(v.alt)+'" width="'+v.width+'" height="'+v.height+'" fetchpriority="high" decoding="async"></a><figcaption><p>'+esc(v.caption)+'</p><a href="'+local(v.src)+'" target="_blank" rel="noopener">View full size ↗</a></figcaption></figure>' : '';
    var projectContext = c.context.toLowerCase().includes(c.status.toLowerCase()) ? c.context : c.context.replace(/\s*·\s*Working product$/i,'')+' · '+c.status;
    var hero = '<header class="cs-hero"><div class="cs-intro"><p class="cs-eyebrow"><strong>'+esc(c.name)+'</strong><span>'+(c.kind==='ux'?'Design study':'Product story')+' · '+c.readingMinutes+' min read</span></p><h1 id="'+base+'title">'+rich(n.headline)+'</h1><p class="cs-deck">'+esc(c.summary)+'</p><dl class="cs-meta"><div><dt>My role</dt><dd>'+esc(c.role)+'</dd></div><div><dt>Project</dt><dd>'+esc(projectContext)+'</dd></div></dl><a class="cs-start cs-jump" href="#'+base+order[0]+'">Read the case study <span aria-hidden="true">↓</span></a></div>'+heroArt+'</header>';
    var nav = '<nav class="cs-contents" aria-label="Case study sections"><p>In this story</p><ol>'+order.map(function(key,i){return '<li><a href="#'+base+key+'"><span>'+('0'+(i+1)).slice(-2)+'</span>'+esc(labels[key])+'</a></li>';}).join('')+'</ol></nav>';
    var chapters = {};
    chapters.brief = chapter('brief', heading('brief', n.question)+'<p class="cs-body-copy">'+esc(c.problem)+'</p>'+audienceHtml);
    chapters.process = chapter('process', heading('process', t.chapters && t.chapters.process || 'What shaped the direction')+'<p class="cs-insight-statement">'+rich(n.insight)+'</p><p class="cs-evidence-tag">'+esc(n.evidenceTag)+'</p>'+(c.kind==='ux'?facts:'')+'<div class="cs-pivot"><p><strong>My direction.</strong> '+esc(n.pivot)+'</p></div><details class="cs-detail"><summary>'+(c.kind==='ux'?'More about the original process':'Process and product scope')+'</summary><div>'+paragraphs(c.process)+(c.kind==='product'?facts:'')+'<ol class="cs-journey">'+n.journey.map(function(s){return '<li><strong>'+esc(s.title)+'</strong><p>'+esc(s.detail)+'</p></li>';}).join('')+'</ol></div></details>');
    chapters.decisions = chapter('decisions', heading('decisions', t.decisionHeading || 'The choices behind the experience')+'<p class="cs-section-intro">Open a decision to see the reasoning and trade-off.</p><div class="cs-decisions">'+c.decisions.map(function(d,i){return '<details class="cs-decision" name="'+base+'decisions"'+(i===0?' open':'')+'><summary><span class="cs-decision-number">'+('0'+(i+1)).slice(-2)+'</span><h3>'+esc(d.title)+'</h3><span class="cs-disclosure-icon" aria-hidden="true">+</span></summary><div class="cs-decision-content">'+decisionVisual(i)+'<p>'+esc(d.choice)+'</p><p><strong>Why this matters.</strong> '+esc(d.reason)+'</p><p class="cs-tradeoff"><strong>The trade-off.</strong> '+esc(d.tradeoff)+'</p></div></details>';}).join('')+'</div>');
    var annotations = v.focus || n.annotations;
    var artifact = figure && figure.src !== v.src ? sourceFigure(figure) : '';
    var artifactDetails = '<details class="cs-detail"><summary>'+(artifact?'Inspect the supporting design':'More about the experience')+'</summary><div>'+artifact+'<ul class="cs-annotations">'+annotations.map(function(a){return '<li><strong>'+esc(a.title)+'.</strong> '+esc(a.detail)+'</li>';}).join('')+'</ul></div></details>';
    chapters.outcome = chapter('outcome', heading('outcome', t.resultHeading || 'The resulting experience')+'<p class="cs-body-copy">'+esc(c.outcome)+'</p>'+artifactDetails+'<div class="cs-result-action">'+action+'</div>');
    chapters.reflection = chapter('reflection', heading('reflection', n.takeaway)+'<p class="cs-body-copy">'+esc(c.reflection)+'</p><details class="cs-detail"><summary>What I would evaluate next <span>proposed work</span></summary><div><ul class="cs-next">'+c.nextSteps.map(function(s){return '<li>'+esc(s.replace(/^Proposed (study|scope|measures|iteration|validation|acceptance criteria|evaluation|measure|checks|benchmark|review|release review|UI review|extension|test|implementation):\s*/i,''))+'</li>';}).join('')+'</ul></div></details>');
    var sources = '<footer class="cs-sources"><details class="cs-detail"><summary>Sources & project scope</summary><div><p>This retrospective was refreshed in October 2026 from '+(c.kind==='ux'?'my original design artifacts':'the product artifacts and project documentation')+'. Audience hypotheses are distinguished from personas in the original research. The example situation is illustrative; proposed studies describe future work. Product stories focus on my UX direction, not code authorship. Scope counts are not adoption or impact metrics.</p><ul>'+c.sources.map(function(s){return '<li><strong>'+esc(s.label)+'</strong><p>'+esc(s.detail)+'</p></li>';}).join('')+'</ul>'+(c.figures.length>1?sourceFigure(c.figures[0]):'')+'</div></details><div class="cs-links">'+links+'</div></footer>';
    var next = c.nextStory ? '<a class="cs-next-story" href="'+prefix+'case-studies/'+esc(c.nextStory.slug)+'.html"><span>Next case study</span><strong>'+esc(c.nextStory.name)+' <span aria-hidden="true">↗</span></strong><p>'+esc(c.nextStory.headline)+'</p></a>' : '';
    return '<article class="case-study cs-custom cs-project-'+esc(c.slug)+' cs-layout-'+esc(t.layout || 'editorial')+' cs-mode-'+esc(t.mode || 'light')+' cs-tone-'+esc(n.tone)+' cs-visual-'+esc(v.presentation)+'" aria-labelledby="'+base+'title">'+hero+'<div class="cs-reader">'+nav+'<div class="cs-body">'+order.map(function(key){return chapters[key];}).join('')+sources+next+'</div></div></article>';
  }
  var api = {render:render,escape:esc,rich:rich};
  if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.CaseStudyRenderer=api;
})(typeof window!=='undefined'?window:globalThis);
