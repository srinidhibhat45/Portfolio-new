/* Connections are editorial groupings of the real portfolio, not invented notes. */
(function () {
  'use strict';
  var topics = [
    {id:'design',name:'Design & tools',color:'#794758',desc:'Interfaces, systems, and tools that make complicated things easier to use.',question:'How can a tool make the work feel easier?',examples:['Arkitype','AppleCider','OneSpace']},
    {id:'stories',name:'Stories & culture',color:'#a07b40',desc:'Writing, cinema, community, and the ways people keep a story alive.',question:'What helps people find a story—or keep one?',examples:['The Blog','Vansh Vriksha','अvinash']},
    {id:'world',name:'Science & play',color:'#537b69',desc:'The sky, the earth, music, movement, and ideas that are better understood by exploring them.',question:'What happens when curiosity becomes something you can explore?',examples:['Earthlog','BirthSky','ScaleSee']}
    ,{id:'community',name:'Community & roots',color:'#526e88',desc:'My home in Goa, India, my volunteering with Yuva, and the work that connects people.',question:'What can we make possible when we show up for each other?',examples:['Yuva · Executive Member','Women & Child Welfare','Yuva Panaji']}
  ];
  var assignments = {
    'The Office Games':'world','DashF1':'world','Hued':'design','Arkitype':'design',
    'Yuva Panaji':'community','Matinee':'stories','BirthSky':'world','The Blog':'stories',
    'PreMoney':'design','Vansh Vriksha':'stories','Earthlog':'world','DeckForge':'design',
    'PlanIt':'world','ScaleSee':'world','Where Would I Be…?':'world','SoundBox':'world',
    'Wheelie':'world','AppleCider':'design'
  };
  var nodes = [{id:'me',name:'Srinidhi',kind:'person',desc:'Design engineer, builder, writer, and Yuva volunteer. These are the people, places, ideas, and projects that connect those parts of me. Pick a node to discover what it means, or move things around and follow the lines.'}].concat(topics.map(function(t){return Object.assign({kind:'topic'},t);}));
  var links = [];
  function connect(a,b,reason) {
    if (!links.some(function(l){return (l.from===a&&l.to===b)||(l.from===b&&l.to===a);})) links.push({from:a,to:b,reason:reason});
  }
  topics.forEach(function(t){connect('me',t.id,t.desc);});
  window.SITE_DATA.vibe.forEach(function(p) {
    var topic=assignments[p.name]||'design';
    var id='build-'+p.path.split('/').pop();
    var media=window.PROJECT_MEDIA&&window.PROJECT_MEDIA[p.name];
    nodes.push({id:id,name:p.name,kind:'product',topic:topic,desc:p.desc,stack:p.stack,href:p.href,cta:p.cta,thumb:media&&media.src});
    connect(topic,id,'A built product exploring '+topics.find(function(t){return t.id===topic;}).name.toLowerCase()+'.');
  });
  window.SITE_DATA.work.forEach(function(p) {
    var id='case-'+p.slug;
    nodes.push({id:id,name:p.title,kind:'case',topic:'design',desc:p.blurb,tags:p.tags,caseSlug:p.slug,thumb:p.thumb.replace(/\.(png|jpg|jpeg)$/i,'.webp')});
    connect('design',id,'A design study in '+p.tags.toLowerCase()+'.');
  });
  var personal = [
    {id:'yuva-volunteer',name:'Yuva · Executive Member',kind:'role',topic:'community',desc:'I am an Executive Member and volunteer at Yuva, a youth social service organisation in Panaji, Goa, India. Its work is grounded in six pillars of community service.',tags:'Executive Member · Volunteer',href:'https://yuva-website.netlify.app/',cta:'Meet Yuva'},
    {id:'goa',name:'Goa, India',kind:'place',topic:'community',desc:'I am from Goa, India. It is where I am based, where I design, and where I volunteer with Yuva.'},
    {id:'writer',name:'अvinash',kind:'interest',topic:'stories',desc:'The name I write under. Poems, essays, serialised fiction, and a written podcast—in English, Hindi, and Konkani.',href:'https://blogs.srinidhibhat.com/',cta:'Read my writing'}
  ];
  var pillars = [
    ['women-child','Women & Child Welfare','Yuva supports underprivileged women and children through educational sponsorships, sanitisation kits, vocational workshops, and self-defense workshops.'],
    ['seniors','Senior Citizen Support','Yuva offers companionship, leisure programmes, and health support for senior citizens, including Jyeshtha Nagarik Anandotsav.'],
    ['health','Health Initiatives','Yuva organises free medical camps, blood donation drives, mental wellness workshops, and preventive screenings.'],
    ['youth','Youth Development','Yuva supports young people through skill-building workshops, career guidance, and civic responsibility seminars.'],
    ['sports','Sports & Wellness','Yuva brings people together through All-Goa tournaments, yoga days, and fitness drives.'],
    ['environment','Environment & Culture','Yuva works on tree plantations, cleanliness drives, eco-friendly Ganesh dekhavas, and heritage revival.']
  ];
  personal.forEach(function(n){nodes.push(n);connect(n.topic,n.id,n.kind==='role'?'My volunteer and Executive Member role in Yuva.':n.kind==='place'?'My home and the community I am part of.':'My writing identity, connected to the stories I publish.');});
  pillars.forEach(function(p){var id='yuva-'+p[0];nodes.push({id:id,name:p[1],kind:'pillar',topic:'community',desc:p[2],tags:'One of Yuva’s six pillars',href:'https://yuva-website.netlify.app/',cta:'Explore Yuva’s work'});connect('yuva-volunteer',id,p[2]);});
  function byName(name){return nodes.find(function(n){return n.name===name;}).id;}
  [
    ['Arkitype','AppleCider','Two stages of making an interface: sketching the idea, then building its design system.'],
    ['Arkitype','DeckForge','Both make reusable design work editable, instead of starting from scratch.'],
    ['Hued','Arkitype','Colour as a daily creative prompt, and as part of a reusable design system.'],
    ['OneSpace','uMatter','Mobile experiences that organise information around a person’s needs.'],
    ['Earthlog','BirthSky','Two ways to explore a place and a moment: what is happening on Earth, and what was happening in the sky.'],
    ['Earthlog','Where Would I Be…?','The same planet, explored through current events and through geological time.'],
    ['BirthSky','ScaleSee','Abstract numbers and calculations made visible and easier to grasp.'],
    ['The Blog','Matinee','Stories to read and stories to watch.'],
    ['Vansh Vriksha','Yuva Panaji','Archives that keep family and community history accessible.'],
    ['PlanIt','Wheelie','Tools for coordinating people who are going somewhere together.'],
    ['SoundBox','The Office Games','Learning and social interaction through play.']
  ].forEach(function(r){connect(byName(r[0]),byName(r[1]),r[2]);});
  connect('yuva-volunteer',byName('Yuva Panaji'),'My community role and the website I built for the organisation.');
  connect('goa','yuva-volunteer','Home and community service, connected through Yuva in Panaji.');
  connect('writer',byName('The Blog'),'The writing identity behind my poems, essays, fiction, and podcast.');
  topics.forEach(function(t){t.count=nodes.filter(function(n){return n.topic===t.id;}).length;});
  nodes.filter(function(n){return n.kind==='topic';}).forEach(function(n){n.count=topics.find(function(t){return t.id===n.id;}).count;});
  window.BRAIN_MAP={nodes:nodes,links:links,topics:topics};
})();
