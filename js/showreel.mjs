export function youtubeVideoId(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    let id;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

export function initShowreel(doc, config) {
  const section = doc.getElementById('showreel');
  const id = youtubeVideoId(config?.showreelUrl);
  if (!section || !id) return;
  const poster = doc.getElementById('showreelPoster');
  const button = doc.getElementById('showreelPlay');
  section.dataset.state = 'ready';
  doc.getElementById('showreelStatus').textContent = 'Showreel';
  button.hidden = false;
  button.addEventListener('click', () => {
    doc.dispatchEvent(new CustomEvent('portfolio:dialog', {detail:{open:true}}));
    const frame = doc.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
    frame.title = 'Srinidhi Bhat — animated showreel';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    poster.replaceChildren(frame);
    frame.focus();
  }, {once:true});
}

if (typeof document !== 'undefined') initShowreel(document, window.PortfolioPlayConfig);
