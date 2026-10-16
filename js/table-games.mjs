/* Pure rules for the playroom's small board games. No DOM, timers, or storage. */
export const TABLE_GAME_IDS = ['connect', 'dots', 'memory'];
const other = side => side === 'you' ? 'bot' : 'you';

export function newConnect() {
  return {cells: Array(42).fill(null), turn: 'you', result: null, line: [], last: null};
}
export function connectMoves(state) {
  return state.result ? [] : Array.from({length: 7}, (_, col) => col).filter(col => !state.cells[col]);
}
function connection(cells, index) {
  const row = Math.floor(index / 7), col = index % 7, side = cells[index];
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    const line = [index];
    for (const sign of [-1, 1]) {
      let r = row + dr * sign, c = col + dc * sign;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && cells[r * 7 + c] === side) {
        line.push(r * 7 + c); r += dr * sign; c += dc * sign;
      }
    }
    if (line.length >= 4) return line;
  }
  return [];
}
export function connectMove(state, col) {
  if (!Number.isInteger(col) || !connectMoves(state).includes(col)) throw new Error('Choose an open column.');
  let row = 5;
  while (state.cells[row * 7 + col]) row--;
  const index = row * 7 + col, cells = state.cells.slice();
  cells[index] = state.turn;
  const line = connection(cells, index);
  return {cells, turn: other(state.turn), result: line.length ? state.turn : cells.every(Boolean) ? 'draw' : null, line, last: index};
}
const windows = [];
for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++) {
  for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
    if (row + 3 * dr >= 0 && row + 3 * dr < 6 && col + 3 * dc >= 0 && col + 3 * dc < 7)
      windows.push(Array.from({length: 4}, (_, i) => (row + i * dr) * 7 + col + i * dc));
  }
}
function connectScore(state, depth) {
  if (state.result) return state.result === 'draw' ? 0 : (state.result === 'bot' ? 100000 + depth : -100000 - depth);
  let score = 0;
  for (let row = 0; row < 6; row++) score += state.cells[row * 7 + 3] === 'bot' ? 5 : state.cells[row * 7 + 3] === 'you' ? -5 : 0;
  for (const line of windows) {
    const you = line.filter(i => state.cells[i] === 'you').length, bot = line.filter(i => state.cells[i] === 'bot').length;
    if (!you) score += [0, 1, 8, 70, 0][bot];
    if (!bot) score -= [0, 1, 10, 85, 0][you];
  }
  return score;
}
function searchConnect(state, depth, alpha, beta) {
  if (!depth || state.result) return connectScore(state, depth);
  const maximizing = state.turn === 'bot';
  let best = maximizing ? -Infinity : Infinity;
  for (const col of [3, 2, 4, 1, 5, 0, 6].filter(c => connectMoves(state).includes(c))) {
    const value = searchConnect(connectMove(state, col), depth - 1, alpha, beta);
    best = maximizing ? Math.max(best, value) : Math.min(best, value);
    if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
    if (alpha >= beta) break;
  }
  return best;
}
export function connectChoice(state) {
  let best = -Infinity, chosen = null;
  for (const col of [3, 2, 4, 1, 5, 0, 6].filter(c => connectMoves(state).includes(c))) {
    const score = searchConnect(connectMove(state, col), 3, -Infinity, Infinity);
    if (score > best) { best = score; chosen = col; }
  }
  return chosen;
}

export const DOT_BOXES = Array.from({length: 9}, (_, i) => {
  const row = Math.floor(i / 3), col = i % 3;
  return [row * 3 + col, (row + 1) * 3 + col, 12 + row * 4 + col, 12 + row * 4 + col + 1];
});
export function newDots() { return {edges: Array(24).fill(null), boxes: Array(9).fill(null), turn: 'you', result: null, last: null}; }
export function dotsMoves(state) { return state.result ? [] : state.edges.flatMap((v, i) => v ? [] : [i]); }
export function dotsMove(state, edge) {
  if (!Number.isInteger(edge) || !dotsMoves(state).includes(edge)) throw new Error('Choose an unclaimed line.');
  const edges = state.edges.slice(), boxes = state.boxes.slice();
  edges[edge] = state.turn;
  let captured = 0;
  DOT_BOXES.forEach((sides, box) => {
    if (!boxes[box] && sides.every(i => edges[i])) { boxes[box] = state.turn; captured++; }
  });
  const you = boxes.filter(v => v === 'you').length, bot = boxes.filter(v => v === 'bot').length;
  return {edges, boxes, turn: captured ? state.turn : other(state.turn), result: boxes.every(Boolean) ? you === bot ? 'draw' : you > bot ? 'you' : 'bot' : null, last: edge};
}
export function dotsChoice(state, random = Math.random) {
  let best = -Infinity, chosen = null;
  for (const edge of dotsMoves(state)) {
    const next = dotsMove(state, edge);
    const captured = next.boxes.filter(Boolean).length - state.boxes.filter(Boolean).length;
    const gifts = DOT_BOXES.filter((sides, box) => !next.boxes[box] && sides.filter(i => next.edges[i]).length === 3).length;
    const score = captured * 100 - gifts * 20 + random();
    if (score > best) { best = score; chosen = edge; }
  }
  return chosen;
}

export const MEMORY_PATTERNS = [
  {name: 'Ajrakh', src: 'ajrakh-field.webp'},
  {name: 'Lotus garden', src: 'pichwai-lotus-garden.webp'},
  {name: 'Paisley', src: 'paisley-brocade.webp'},
  {name: 'Parakeets', src: 'parakeet-vine.webp'},
  {name: 'Jaali', src: 'portrait-filigree-v2.webp'},
  {name: 'Block-print seal', src: 'blockprint-seal.webp'}
];
export function newMemory(random = Math.random) {
  const deck = MEMORY_PATTERNS.flatMap((_, i) => [i, i]);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return {deck, matched: [], open: [], turns: 0, result: null};
}
export function memoryMove(state, tile) {
  if (!Number.isInteger(tile) || tile < 0 || tile >= 12 || state.result || state.open.length === 2 || state.open.includes(tile) || state.matched.includes(tile)) return state;
  const open = [...state.open, tile];
  if (open.length === 1) return {...state, open};
  const same = state.deck[open[0]] === state.deck[open[1]], matched = same ? [...state.matched, ...open] : state.matched.slice();
  return {...state, open: same ? [] : open, matched, turns: state.turns + 1, result: matched.length === 12 ? 'you' : null};
}
export function closeMemoryPair(state) { return state.open.length === 2 ? {...state, open: []} : state; }

export function validTableGame(game, state) {
  if (!state || ![null, 'you', 'bot', 'draw'].includes(state.result)) return false;
  const cells = (value, size) => Array.isArray(value) && value.length === size && value.every(v => [null, 'you', 'bot'].includes(v));
  if (game === 'connect') {
    if (!cells(state.cells, 42) || !['you', 'bot'].includes(state.turn) || !Array.isArray(state.line) || !state.line.every(i => Number.isInteger(i) && i >= 0 && i < 42) || !(state.last === null || Number.isInteger(state.last) && state.last >= 0 && state.last < 42)) return false;
    const you = state.cells.filter(v => v === 'you').length, bot = state.cells.filter(v => v === 'bot').length;
    if (you !== bot && you !== bot + 1 || state.turn !== (you === bot ? 'you' : 'bot')) return false;
    for (let col = 0; col < 7; col++) for (let row = 0; row < 5; row++) if (state.cells[row * 7 + col] && !state.cells[(row + 1) * 7 + col]) return false;
    const line = state.last === null ? [] : connection(state.cells, state.last);
    return state.result === (line.length ? state.cells[state.last] : state.cells.every(Boolean) ? 'draw' : null) && JSON.stringify(state.line) === JSON.stringify(line);
  }
  if (game === 'dots') {
    if (!cells(state.edges, 24) || !cells(state.boxes, 9) || !['you', 'bot'].includes(state.turn) || !(state.last === null || Number.isInteger(state.last) && state.last >= 0 && state.last < 24)) return false;
    if (!DOT_BOXES.every((sides, i) => Boolean(state.boxes[i]) === sides.every(edge => Boolean(state.edges[edge])))) return false;
    const you = state.boxes.filter(v => v === 'you').length, bot = state.boxes.filter(v => v === 'bot').length;
    return state.result === (state.boxes.every(Boolean) ? you === bot ? 'draw' : you > bot ? 'you' : 'bot' : null);
  }
  if (game === 'memory') {
    if (!Array.isArray(state.deck) || state.deck.length !== 12 || !state.deck.every(v => Number.isInteger(v) && v >= 0 && v < 6) || !MEMORY_PATTERNS.every((_, i) => state.deck.filter(v => v === i).length === 2)) return false;
    const indices = values => Array.isArray(values) && new Set(values).size === values.length && values.every(i => Number.isInteger(i) && i >= 0 && i < 12);
    if (!indices(state.matched) || state.matched.length % 2 || !indices(state.open) || state.open.length > 2 || state.open.some(i => state.matched.includes(i)) || !Number.isInteger(state.turns) || state.turns < state.matched.length / 2 || state.turns > 1000000) return false;
    for (let i = 0; i < state.matched.length; i += 2) if (state.deck[state.matched[i]] !== state.deck[state.matched[i + 1]]) return false;
    return !(state.open.length === 2 && state.deck[state.open[0]] === state.deck[state.open[1]]) && state.result === (state.matched.length === 12 ? 'you' : null);
  }
  return false;
}
