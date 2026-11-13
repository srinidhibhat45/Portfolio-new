/* Chapter art stories. Every chapter number is a button: pointing at it names the Indian artform the chapter
   takes after, and clicking or tapping it opens a short story of that art: what it is, what it carries for the
   people who make it, and why it sits in this chapter. Previous and next walk through all of them.
   The stories are kept short and plain on purpose, and say nothing the sources don't. */
(function () {
  'use strict';
  var marks = Array.prototype.slice.call(document.querySelectorAll('main .chapter-mark'));
  if (!marks.length || typeof HTMLDialogElement !== 'function') return;

  var B = 'assets/img/borders/';
  var STORIES = {
    'Matchbox-label print': {
      band: { bar: true },
      art: 'Sivakasi, a small town in southern Tamil Nadu, prints most of India’s matchbox labels, along with fireworks wrappers and calendars. Each label is a whole poster a few centimetres wide: a bold name, flat bright colours and one picture, a tiger, a temple, a bicycle, that anyone can recognise across a shop counter.',
      carries: 'Nobody signs them. They are made to be understood at a glance by anyone, in any language, and they end up in every kitchen in the country. Collectors around the world trade them for exactly that: everyday design, done with real confidence.',
      here: 'Design work is the same job at a larger size: say one thing clearly, at a glance. The covers of these projects borrow the label’s flat colours and its single bold picture.',
    },
    'Hand-painted poster lettering': {
      band: { bar: true },
      art: 'Before printed flex banners, India’s shop signs, cinema hoardings and truck tailgates were painted by hand. Sign painters in cities like Mumbai and Chennai worked with enamel paint and long brushes, and drew fat, shaded, rounded letters that could be read from across a busy road.',
      carries: 'Every painter had a hand you could recognise, and many boards set Devanagari or Tamil beside English. Printing has replaced most of the trade in the last few decades. A few painters still work, and designers have begun to record their alphabets so the letters are not lost.',
      here: 'The products in this chapter were made by hand too, one at a time, to be used every day. Their names are set in painted lettering on the covers.',
    },
    'Pichwai': {
      band: { src: B + 'pichwai.webp', ground: '#121A2E' },
      art: 'Pichwai are large paintings on cloth that hang behind the image of Shrinathji, Krishna as a child, at the temple in Nathdwara, Rajasthan. The name means “that which hangs behind”. Painters work with fine brushes and mineral and plant colours, often with gold, building up lotus ponds, cows, gopis and night skies in layers.',
      carries: 'The hangings are changed with the seasons and the festivals, so the shrine follows the year. Families of painters around the temple have kept the craft going for generations.',
      here: 'Visual work is the gallery of this site, so it gets the art made to be looked at. Look for the faded lotus pond at the foot of the chapter: lotus ponds are one of Pichwai’s favourite scenes.',
    },
    'Warli': {
      band: { src: B + 'warli.webp', ground: '#744D31' },
      art: 'Warli is the painting of the Warli people, who live in the hills north of Mumbai. Women paint the mud walls of their homes for weddings and harvests with a white paste of rice flour and water, using a chewed bamboo twig as a brush.',
      carries: 'The whole language is three shapes: the circle for the sun and moon, the triangle for mountains and trees, and the square for a sacred enclosure. Two triangles joined at their tips make a person. The scenes are of everyday life, sowing, fishing, and the tarpa dance spiralling around a musician.',
      here: 'This chapter is the work I do for people day to day, so it takes after an art about everyday work. Each service is a Warli drawing on mud brown, the colour of the walls Warli is painted on.',
    },
    'Kaavi': {
      band: { src: B + 'kaavi.webp', ground: '#842B22' },
      art: 'Kaavi is a wall art of the Konkan coast, found on old temples, churches and houses in Goa and coastal Karnataka. Over white lime plaster, craftsmen lay a coat of red laterite earth (kaav) mixed with lime, and while it is still fresh, scrape the red away to draw in the white beneath.',
      carries: 'Its borders, vines, kalash pots and figures were made to last as long as the wall. Many have been lost to repainting and rebuilding, and artists and conservationists in Goa are working to bring the craft back.',
      here: 'This chapter is about me, and Kaavi is the art of home: Goa and the Konkan coast, where I live. Its red is the colour of this whole site. Look for the kalash etched faintly behind the words.',
    },
    'Ajrakh block print': {
      band: { src: B + 'ajrakh.webp', ground: '#202F52' },
      art: 'Ajrakh is block-printed cloth from Kutch in Gujarat and Sindh across the border, made by Khatri families of printers. Carved wooden blocks print resists and mordants in turn, and the cloth goes through indigo and madder baths and many washes: a dozen or more stages, over days, for a single piece.',
      carries: 'Its strict grids and stars, in deep indigo, madder red, black and white, are worn by herding communities as turbans, shawls and lungis. In Sindh, an ajrak is given to honour a guest.',
      here: 'This chapter is where I\u2019ve been: years of work laid down one over another, the way Ajrakh builds its colours layer by layer. Look for the print fading in from the right.',
    },
    'Bandhani': {
      band: { src: B + 'bandhani.webp', ground: '#972D25' },
      art: 'Bandhani is tie-dye made one dot at a time. The cloth is pinched into hundreds, sometimes thousands, of tiny points, each one wound tight with thread before dyeing. Untied, every knot leaves a small ring of the colour underneath. The name comes from bandhan, a tie.',
      carries: 'Red and maroon bandhani is worn at weddings across Gujarat and Rajasthan, and patterns carry their own names and meanings. The tying is patient handwork, much of it done by women at home.',
      here: 'This chapter is the people I’ve worked with: small bonds, each one tied by hand. Their cards carry Bandhani’s dots, fading down from the top.',
    },
    'Kolam': {
      band: { src: B + 'kolam.webp', ground: '#121C20' },
      art: 'At dawn, women across Tamil Nadu sweep the doorstep, sprinkle water and draw a kolam in rice flour, letting it run from between their fingers. Many begin with a grid of dots, pulli, and loop one unbroken line around them.',
      carries: 'The rice flour feeds ants and birds, a small act of sharing to start the day, and the drawing welcomes whoever crosses the threshold. By evening it has been walked over, and tomorrow there is a new one. Mathematicians study kolam for its rules: some designs are a single line that never lifts.',
      here: 'The brain map is dots joined by lines, the way a kolam is. It shows how the projects, skills and tools on this site connect.',
    },
    'Kalamkari': {
      band: { src: B + 'kalamkari.webp', ground: '#ECE1CC' },
      art: 'Kalamkari means pen-work: kalam, a pen, and kari, craft. In Srikalahasti in Andhra Pradesh, artists draw freehand on cotton with a bamboo pen wrapped in cloth, using plant dyes, and fix the colours with myrobalan, milk and alum, washing the cloth again and again. In Machilipatnam, the same dyes are printed with wooden blocks.',
      carries: 'The Srikalahasti cloths were made for temples. They tell the Ramayana, the Mahabharata and the lives of the gods panel by panel, so a story could be followed without reading a word.',
      here: 'This chapter is my writing, so it gets the art of telling stories with a pen. The notebook lies on a Kalamkari cloth.',
    },
    'Gond': {
      band: { src: B + 'gond.webp', ground: '#F2ECDF' },
      art: 'Gond painting comes from the Pardhan Gond community of central India, whose bards sang the Gond myths. Painters fill bold outlines with patterns of dots, dashes and fine lines, so a bird or a tree seems to shimmer.',
      carries: 'It moved from house walls to paper and canvas in the 1980s, when the artist Jangarh Singh Shyam began painting in Bhopal. Its subject is the forest: animals, birds, trees, spirits and the stories that tie them together.',
      here: 'This board is where visitors leave their mark, small dots and dashes adding up to one picture, the way a Gond painting is made. The peacock perched on its corner is drawn in Gond style.',
    },
    'Zari brocade': {
      band: { src: 'assets/img/chapter-art/zari-jaal.svg', ground: '#842B22' },
      art: 'Zari is thread wrapped in fine metal, traditionally silver and sometimes gilded with gold. In Varanasi it is woven into silk on handlooms to make Banarasi brocade, with the pattern set up on the loom before weaving starts. A single sari can take weeks.',
      carries: 'Banarasi brocade is made for the biggest days of a life: weddings, festivals, saris kept and handed down. Its motifs, small flowers (buta), the jaal net and paisleys, come from centuries of weaving in the city.',
      here: 'This is where we start working together, thread by thread. A fine zari jaal shimmers over the chapter’s red.',
    },
  };

  var DIGITS = '०१२३४५६७८९';
  var chapters = Array.prototype.slice.call(document.querySelectorAll('main > section:not(#hero)'));
  var items = marks.map(function (mark) {
    var name = (mark.querySelector('.chapter-art-name') || {}).textContent || '';
    var place = (mark.querySelector('.chapter-art-place') || {}).textContent || '';
    var img = mark.querySelector('.chapter-art img');
    var section = mark.closest('section');
    var heading = mark.closest('h2');
    var n = chapters.indexOf(section) + 1;
    return {
      mark: mark, name: name.trim(), place: place.trim(), story: STORIES[name.trim()],
      img: img ? img.getAttribute('src') : '',
      chapter: heading ? (heading.getAttribute('aria-label') || heading.textContent).replace(/\.\s*$/, '').trim() : '',
      n: n, numeral: n > 0 ? String(n).padStart(2, '0').replace(/\d/g, function (d) { return DIGITS[d]; }) : '',
    };
  }).filter(function (item) { return item.story; });
  if (!items.length) return;

  // ---- The dialog, built once ----
  var dialog = document.createElement('dialog');
  dialog.className = 'art-story';
  dialog.id = 'artStory';
  dialog.setAttribute('aria-labelledby', 'artStoryTitle');
  dialog.innerHTML =
    '<div class="art-story-band" aria-hidden="true"></div>' +
    '<button type="button" class="art-story-close" aria-label="Close"></button>' +
    '<div class="art-story-head">' +
      '<span class="art-story-medal" aria-hidden="true"><img alt="" width="64" height="64" decoding="async"><b></b></span>' +
      '<div><p class="art-story-kicker"></p><h2 id="artStoryTitle"></h2><p class="art-story-place"></p></div>' +
    '</div>' +
    '<div class="art-story-body">' +
      '<section><h3>The art</h3><p data-part="art"></p></section>' +
      '<section><h3>What it carries</h3><p data-part="carries"></p></section>' +
      '<section class="art-story-here"><h3>In this chapter</h3><p data-part="here"></p></section>' +
    '</div>' +
    '<div class="art-story-foot">' +
      '<button type="button" class="art-story-step" data-step="-1"><span aria-hidden="true">←</span><span class="art-story-step-name"></span></button>' +
      '<span class="art-story-count" aria-hidden="true"></span>' +
      '<button type="button" class="art-story-step" data-step="1"><span class="art-story-step-name"></span><span aria-hidden="true">→</span></button>' +
    '</div>';
  document.body.appendChild(dialog);
  var q = function (sel) { return dialog.querySelector(sel); };
  var band = q('.art-story-band'), medal = q('.art-story-medal img'), medalNum = q('.art-story-medal b');
  var kicker = q('.art-story-kicker'), title = q('#artStoryTitle'), placeEl = q('.art-story-place');
  var body = q('.art-story-body'), count = q('.art-story-count');
  var prev = q('[data-step="-1"]'), next = q('[data-step="1"]');
  var current = 0, opener = null, priorOverflow = '';

  function show(index) {
    current = (index + items.length) % items.length;
    var item = items[current], s = item.story;
    dialog.style.setProperty('--story-ground', s.band.ground || '#842B22');
    // Arts with a border tile show it along the top, as on the page; the two print arts get the printer's colour bar.
    band.style.backgroundImage = s.band.src ? 'url("' + s.band.src + '")' : '';
    band.classList.toggle('is-bar', !!s.band.bar);
    medal.src = item.img;
    medalNum.textContent = item.numeral;
    kicker.textContent = 'Chapter ' + item.numeral + ' · ' + item.chapter;
    kicker.setAttribute('aria-label', 'Chapter ' + item.n + ', ' + item.chapter);
    title.textContent = item.name;
    placeEl.textContent = item.place;
    body.querySelector('[data-part="art"]').textContent = s.art;
    body.querySelector('[data-part="carries"]').textContent = s.carries;
    body.querySelector('[data-part="here"]').textContent = s.here;
    body.scrollTop = 0; dialog.scrollTop = 0;
    count.textContent = (current + 1) + ' / ' + items.length;
    var before = items[(current - 1 + items.length) % items.length], after = items[(current + 1) % items.length];
    prev.querySelector('.art-story-step-name').textContent = before.name;
    next.querySelector('.art-story-step-name').textContent = after.name;
    prev.setAttribute('aria-label', 'Previous art: ' + before.name);
    next.setAttribute('aria-label', 'Next art: ' + after.name);
  }

  function open(index, from) {
    opener = from || null;
    show(index);
    if (dialog.open) return;
    document.dispatchEvent(new CustomEvent('portfolio:before-dialog'));
    priorOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('portfolio:dialog', { detail: { open: true } }));
    q('.art-story-close').focus({ preventScroll: true });
  }
  dialog.addEventListener('close', function () {
    document.body.style.overflow = priorOverflow;
    document.dispatchEvent(new CustomEvent('portfolio:dialog', { detail: { open: false } }));
    if (opener) opener.focus({ preventScroll: true });
  });
  q('.art-story-close').addEventListener('click', function () { dialog.close(); });
  prev.addEventListener('click', function () { show(current - 1); });
  next.addEventListener('click', function () { show(current + 1); });
  dialog.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
  });
  // A click on the dimmed page around the card closes it.
  dialog.addEventListener('click', function (e) {
    if (e.target !== dialog) return;
    var r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
  });

  // ---- The numbers: each says it has a story, and opens it ----
  items.forEach(function (item, index) {
    var mark = item.mark;
    mark.setAttribute('aria-haspopup', 'dialog');
    mark.setAttribute('aria-controls', 'artStory');
    mark.setAttribute('aria-label', 'Chapter art: ' + item.name + ', ' + item.place + '. Read its story');
    var words = mark.querySelector('.chapter-art-place');
    if (words && !mark.querySelector('.chapter-art-more')) {
      var more = document.createElement('span');
      more.className = 'chapter-art-more';
      more.textContent = 'Read its story';
      words.parentNode.appendChild(more);
    }
    mark.addEventListener('click', function (e) {
      e.preventDefault();
      open(index, mark);
    });
  });
})();
