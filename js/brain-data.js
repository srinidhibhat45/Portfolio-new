/* Connections are editorial groupings of the real portfolio, not invented notes. */
(function () {
  'use strict';
  var topics = [
    {id:'design',name:'Design & tools',color:'#794758',desc:'Interface design, design systems, and the tools I build.',examples:['Arkitype','AppleCider','OneSpace']},
    {id:'stories',name:'Stories & culture',color:'#a07b40',desc:'Writing, cinema, and family history.',examples:['The Blog','Vansh Vriksha','अvinash']},
    {id:'world',name:'Science & play',color:'#537b69',desc:'Earth, space, music, and games.',examples:['Earthlog','BirthSky','ScaleSee']}
    ,{id:'community',name:'Community & roots',color:'#526e88',desc:'Goa and my work with Yuva.',examples:['Yuva · Executive Member','Women & Child Welfare','Yuva Panaji']}
  ];
  var assignments = {
    'The Office Games':'world','HexChess':'world','DashF1':'world','Hued':'design','Arkitype':'design',
    'Yuva Panaji':'community','Matinee':'stories','BirthSky':'world','The Blog':'stories',
    'PreMoney':'design','Vansh Vriksha':'stories','Earthlog':'world','DeckForge':'design',
    'PlanIt':'world','ScaleSee':'world','Where Would I Be…?':'world','SoundBox':'world',
    'Wheelie':'world','AppleCider':'design'
  };
  var nodes = [{id:'me',name:'Srinidhi',kind:'person',desc:'I design at OneOcean, build independent products, write as अvinash, and volunteer with Yuva as an Executive Member.'}].concat(topics.map(function(t){return Object.assign({kind:'topic'},t);}));
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
    {id:'yuva-volunteer',name:'Yuva · Executive Member',kind:'role',topic:'community',desc:'Executive Member and volunteer at Yuva, a youth social service organisation in Panaji, Goa. The six pillars below guide its work.',tags:'Executive Member · Volunteer',href:'https://yuva-website.netlify.app/',cta:'Meet Yuva'},
    {id:'goa',name:'Goa, India',kind:'place',topic:'community',desc:'Home. I’m based in Goa and volunteer with Yuva in Panaji.'},
    {id:'writer',name:'अvinash',kind:'interest',topic:'stories',desc:'My pen name. Poems, essays, fiction, and a written podcast in English, Hindi, and Konkani.',href:'https://blogs.srinidhibhat.com/',cta:'Read my writing'}
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
    ['Arkitype','AppleCider','Wireframing and design systems.'],
    ['Arkitype','DeckForge','Editable components and reusable design assets.'],
    ['Hued','Arkitype','Colour in photography and interface design.'],
    ['OneSpace','uMatter','Learning and wellbeing on mobile.'],
    ['Earthlog','BirthSky','Earth events and the night sky.'],
    ['Earthlog','Where Would I Be…?','Earth today and through geological time.'],
    ['BirthSky','ScaleSee','Astronomy and scale, visualised.'],
    ['The Blog','Matinee','Stories to read and stories to watch.'],
    ['Vansh Vriksha','Yuva Panaji','Family and community archives.'],
    ['PlanIt','Wheelie','Group travel, on trips and rides.'],
    ['SoundBox','The Office Games','Learning and multiplayer games.'],
    ['HexChess','The Office Games','Chess and multiplayer games.'],
    ['HexChess','ScaleSee','Geometry and visual comparisons.']
  ].forEach(function(r){connect(byName(r[0]),byName(r[1]),r[2]);});
  connect('yuva-volunteer',byName('Yuva Panaji'),'The website I built for the organisation I volunteer with.');
  connect('goa','yuva-volunteer','Volunteering in Panaji.');
  connect('writer',byName('The Blog'),'Where I publish as अvinash.');
  topics.forEach(function(t){t.count=nodes.filter(function(n){return n.topic===t.id;}).length;});
  nodes.filter(function(n){return n.kind==='topic';}).forEach(function(n){n.count=topics.find(function(t){return t.id===n.id;}).count;});
  window.BRAIN_MAP={nodes:nodes,links:links,topics:topics};
})();
