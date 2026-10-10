/* Progressive disclosure keeps the map readable without dropping its contents. */
(function () {
  'use strict';
  window.createBrainLayout = function (map, options) {
    var mobile = options.mobile, scope = options.scope, query = options.query;
    var selected = map.nodes.find(function (n) { return n.id === options.selected; });
    var found = options.found, width = mobile ? 500 : 1300;
    var points = new Map(), edges = [], groups = [];
    var mode = !scope && !query ? 'overview' : query ? 'search' : selected && selected.topic ? 'connection' : 'theme';
    function put(id, x, y) { points.set(id, {x:x, y:y}); }
    function edge(from, to, lane) { edges.push({from:from, to:to, lane:lane}); }
    function grid(source, entries, startY) {
      var cols = mobile ? 2 : 4, gap = mobile ? 112 : 108;
      var xs = mobile ? [125,375] : [160,485,810,1135];
      entries.forEach(function (n, i) {
        var col = i % cols, lane = xs[col] - (mobile ? 116 : 145);
        put(n.id, xs[col], startY + Math.floor(i / cols) * gap);
        edge(source, n.id, lane);
      });
      xs.forEach(function (x, col) {
        var children = entries.filter(function (_, i) { return i % cols === col; }).map(function (n) { return n.id; });
        if (children.length) groups.push({from:source, lane:x-(mobile?116:145), top:startY-55, children:children});
      });
      return startY + Math.max(0, Math.ceil(entries.length / cols)-1) * gap + 80;
    }
    var height;
    if (mode === 'overview') {
      height = mobile ? 750 : 790;
      put('me', width/2, mobile ? 363 : 394);
      var locations = mobile ? {design:[120,210],stories:[380,210],community:[120,560],world:[380,560]} : {design:[310,240],stories:[990,240],community:[310,570],world:[990,570]};
      map.topics.forEach(function (topic) {
        var p = locations[topic.id]; put(topic.id,p[0],p[1]); edge('me',topic.id);
        var examples = topic.examples.slice(0,mobile?1:3);
        var xs = topic.id==='design'||topic.id==='community' ? [130,335,540] : [760,965,1170];
        examples.forEach(function (name,i) {
          var n = map.nodes.find(function (n) { return n.name===name; });
          if (!n) return;
          put(n.id,mobile?p[0]:xs[i],topic.id==='design'||topic.id==='stories'?(mobile?75:80):(mobile?695:720));
          edge(topic.id,n.id);
        });
      });
    } else {
      put('me',width/2,70);
      if (mode==='connection') {
        put(scope,width/2,mobile?225:205); edge('me',scope);
        put(selected.id,width/2,mobile?335:320); edge(scope,selected.id);
        var neighbors = map.links.filter(function (l) { return l.from===selected.id||l.to===selected.id; }).map(function (l) { return map.nodes.find(function (n) { return n.id===(l.from===selected.id?l.to:l.from); }); }).filter(function (n) { return n.id!=='me'&&n.id!==scope; });
        height = grid(selected.id,neighbors,450);
      } else {
        if(mode!=='search'){put(scope,width/2,mobile?225:205);edge('me',scope);}
        if(mode==='search') {
          height = grid('me',found,345);
        } else height = grid(scope,found,345);
      }
      height = Math.max(mobile?620:640,height);
    }
    return {width:width,height:height,points:points,edges:edges,groups:groups,mode:mode};
  };
})();
