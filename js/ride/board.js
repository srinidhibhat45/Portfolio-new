// Sunday Ride: the live leaderboard. Talks to /api/ride (netlify/functions/ride.mjs).
// A run asks the board for a signed start ticket when it begins; the finish posts name, plate, time and ticket.

const API = '/api/ride';
const NAME = 'portfolio-ride-name', ENTRY = 'portfolio-ride-entry';
const ORD = n => n + (n % 100 > 10 && n % 100 < 14 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10 > 3 ? 0 : n % 10]);
export const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`; };
const read = k => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private window */ } };

export function createBoard({ $, onRide, onBack }) {
  const body = $('rideScores'), status = $('rideBoardStatus');
  const form = $('ridePost'), nameInput = $('rideName'), postBtn = $('ridePostBtn'), postError = $('ridePostError'), note = $('ridePostNote');
  let ticket = null;           // a promise of the run's start ticket, or null when this run cannot be posted
  let result = null;           // { time, plate } of the finished run
  let posting = false;
  nameInput.value = read(NAME);

  async function api(payload) {
    const res = await fetch(API + (payload ? '' : idQuery()), payload
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      : { cache: 'no-store' });
    let data = {};
    try { data = await res.json(); } catch { /* not JSON: the board is not there */ }
    if (!res.ok) throw Object.assign(Error(data.error || 'The board is not answering right now.'), { status: res.status });
    return data;
  }
  const idQuery = () => { const id = read(ENTRY); return id ? '?id=' + encodeURIComponent(id) : ''; };

  // ---- a run ---------------------------------------------------------------
  function startRun(eligible) {
    result = null;
    ticket = eligible ? api({ action: 'start' }).then(d => d.run).catch(() => null) : null;
  }

  function finishRun(time, plate, { assisted }) {
    result = { time, plate };
    postError.hidden = true; nameInput.removeAttribute('aria-invalid');
    $('ridePostPlate').textContent = plate;
    $('ridePostPlate').setAttribute('aria-label', 'Your plate ' + plate.split('').join(' '));
    form.hidden = !ticket; note.hidden = !!ticket;
    postBtn.disabled = false; postBtn.textContent = 'Post my time';
    if (!ticket) note.textContent = assisted ? 'Rides with a helping hand stay off the board.' : '';
    note.hidden = !note.textContent;
    return !form.hidden;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (posting || !result) return;
    const name = nameInput.value.replace(/\s+/g, ' ').trim();
    const fail = msg => { postError.textContent = msg; postError.hidden = false; nameInput.setAttribute('aria-invalid', 'true'); nameInput.focus(); };
    if (!name) return fail('Type your name first. It goes on the board next to your plate.');
    if ([...name].length > 20) return fail('Keep your name to 20 characters.');
    posting = true; postBtn.disabled = true; postBtn.textContent = 'Posting…'; postError.hidden = true;
    try {
      const run = await ticket;
      if (!run) throw Error("The board wasn't reachable when this ride started, so it can't take this time. Ride again to post.");
      const data = await api({ name, plate: result.plate, time: result.time, run });
      write(NAME, name);
      const mine = data.posted || data.you?.entry;
      if (mine) write(ENTRY, mine.id);
      form.hidden = true; ticket = null;
      note.textContent = data.kept
        ? `Your best, ${fmt(data.you.entry.time)}, stays on the board at ${ORD(data.you.rank).toLowerCase()}.`
        : `You're on the board: ${ORD(data.you.rank).toLowerCase()} of ${data.total}.`;
      note.hidden = false;
      open('finish', data);
    } catch (err) {
      postBtn.disabled = false; postBtn.textContent = 'Post my time';
      fail(err.status ? err.message : err.message.startsWith('The board') ? err.message : "Couldn't reach the board. Your time is still here; try again.");
    } finally { posting = false; }
  });

  // ---- the board -----------------------------------------------------------
  let from = 'title';
  function row(cells, cls) {
    const tr = document.createElement('tr');
    if (cls) tr.className = cls;
    cells.forEach((c, i) => {
      const td = document.createElement(i === 1 ? 'th' : 'td');
      if (i === 1) td.scope = 'row';
      if (i === 2) { const chip = document.createElement('span'); chip.className = 'ride-chip ride-chip--sm'; chip.textContent = c; td.append(chip); }
      else td.textContent = c;
      tr.append(td);
    });
    return tr;
  }
  function render(data) {
    body.textContent = '';
    const you = data.you?.entry?.id;
    const rows = data.top.map((r, i) => ({ ...r, rank: i + 1 }));
    // Shri sits where his time falls among the riders; below them all when the top ten are faster.
    const at = rows.findIndex(r => r.time > data.shri.time);
    rows.splice(at < 0 ? rows.length : at, 0, { shri: true, ...data.shri });
    for (const r of rows) {
      const cls = [r.shri ? 'is-shri' : '', r.id && r.id === you ? 'is-you' : '', !r.shri && r.rank <= 3 ? 'is-p' + r.rank : ''].filter(Boolean).join(' ');
      body.append(row([r.shri ? '★' : ORD(r.rank), r.name, r.plate, fmt(r.time)], cls));
    }
    if (data.you && data.you.rank > data.top.length) {
      const gap = document.createElement('tr'); gap.className = 'is-gap'; gap.innerHTML = '<td colspan="4" aria-hidden="true">· · ·</td>';
      body.append(gap, row([ORD(data.you.rank), data.you.entry.name, data.you.entry.plate, fmt(data.you.entry.time)], 'is-you'));
    }
    // On a short window the table scrolls inside the card: start at the top, unless your own row would be out of sight.
    const wrap = $('rideScoresWrap'), mine = body.querySelector('.is-you');
    wrap.scrollTop = 0;
    if (mine && mine.offsetTop + mine.offsetHeight > wrap.clientHeight) wrap.scrollTop = mine.offsetTop + mine.offsetHeight - wrap.clientHeight + 6;
    const beaten = data.top.filter(r => r.time < data.shri.time).length;
    status.textContent = !data.top.length ? 'Nobody on the board yet. Ride to the viewpoint and be the first.'
      : `${data.total} ${data.total === 1 ? 'rider' : 'riders'} on the board. ${beaten ? `${beaten} of the top ${data.top.length} beat Shri's best run.` : `Shri's best run is ${fmt(data.shri.time)}. Nobody has beaten it yet.`}`;
  }

  async function open(back, preloaded) {
    from = back;
    onBack.show('board');
    if (preloaded) return render(preloaded);
    body.textContent = '';
    status.textContent = 'Loading the board…';
    try { render(await api()); }
    catch { status.textContent = "Couldn't reach the board just now. Your best run is still saved in this browser."; }
  }

  $('rideBoardRide').addEventListener('click', onRide);
  $('rideBoardBack').addEventListener('click', () => onBack.show(from));

  return { startRun, finishRun, open, close: () => onBack.show(from), focusName: () => nameInput.focus({ preventScroll: true }) };
}
