import {
  TABLE_GAME_IDS, MEMORY_PATTERNS,
  newConnect, connectMoves, connectMove, connectChoice,
  newDots, dotsMoves, dotsMove, dotsChoice,
  newMemory, memoryMove, closeMemoryPair, validTableGame
} from './table-games.mjs';

export function createTableGames({root, schedule, onSave, onFinish, onMood, canPlay}) {
  const $ = id => root.querySelector('#' + id);
  const states = {connect: newConnect(), dots: newDots(), memory: newMemory()};
  const factories = {connect: newConnect, dots: newDots, memory: newMemory};
  const sideName = side => side === 'you' ? 'You' : 'Shri';
  const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16m-6-6 6 6 6-6"/></svg>';

  $('connectColumns').innerHTML = Array.from({length: 7}, (_, col) => `<button type="button" data-connect="${col}" aria-label="Drop in column ${col + 1}">${arrow}<span>${col + 1}</span></button>`).join('');
  function renderConnect() {
    const state = states.connect, moves = connectMoves(state), locked = state.turn !== 'you' || !!state.result;
    $('connectWells').innerHTML = Array.from({length: 6}, (_, row) => `<div class="connect-row" role="row">${Array.from({length: 7}, (_, col) => {
      const index = row * 7 + col, side = state.cells[index];
      return `<span role="cell" aria-label="Row ${row + 1}, column ${col + 1}: ${side ? sideName(side) : 'empty'}" class="connect-cell ${side ? 'is-' + side : ''} ${state.line.includes(index) ? 'is-winning' : ''} ${state.last === index ? 'is-last' : ''}"><span aria-hidden="true">${side ? side === 'you' ? 'Y' : 'S' : ''}</span></span>`;
    }).join('')}</div>`).join('');
    $('connectColumns').querySelectorAll('button').forEach(button => button.disabled = locked || !moves.includes(Number(button.dataset.connect)));
    const select = $('connectColumn');
    [...select.options].forEach(option => option.disabled = !moves.includes(Number(option.value)));
    if (!moves.includes(Number(select.value)) && moves.length) select.value = String(moves[0]);
    select.disabled = $('connectDrop').disabled = locked || !moves.length;
    $('connectStatus').textContent = state.result ? state.result === 'draw' ? 'The board is full. A draw.' : `${sideName(state.result)} connected four.` : state.turn === 'bot' ? 'Shri is choosing a column…' : 'Your turn. Drop a red counter into an open column.';
    if (state.result) onFinish('connect', state.result);
  }
  function playConnect(col) {
    if (!canPlay('connect') || states.connect.turn !== 'you' || !connectMoves(states.connect).includes(col)) return;
    states.connect = connectMove(states.connect, col); renderConnect(); onSave(); resume('connect');
  }
  $('connectColumns').addEventListener('click', event => {
    const button = event.target.closest('[data-connect]');
    if (button) playConnect(Number(button.dataset.connect));
  });
  $('connectDrop').addEventListener('click', () => playConnect(Number($('connectColumn').value)));

  function dotsMarkup() {
    const state = states.dots, locked = state.turn !== 'you' || !!state.result;
    let html = '';
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      if (!(x % 2) && !(y % 2)) { html += '<span class="dots-dot" aria-hidden="true"></span>'; continue; }
      if (x % 2 && y % 2) {
        const box = Math.floor(y / 2) * 3 + Math.floor(x / 2), owner = state.boxes[box];
        html += `<span role="img" class="dots-box ${owner ? 'is-' + owner : ''}" aria-label="Box ${box + 1}: ${owner ? sideName(owner) : 'unclaimed'}">${owner ? owner === 'you' ? 'Y' : 'S' : ''}</span>`;
      } else {
        const horizontal = !(y % 2), row = Math.floor(y / 2), col = Math.floor(x / 2);
        const edge = horizontal ? row * 3 + col : 12 + row * 4 + col, owner = state.edges[edge];
        html += `<button type="button" data-dots="${edge}" data-x="${x}" data-y="${y}" class="dots-edge ${horizontal ? 'is-horizontal' : 'is-vertical'} ${owner ? 'is-' + owner : ''} ${state.last === edge ? 'is-last' : ''}" aria-label="${owner ? sideName(owner) + ' claimed' : 'Draw'} ${horizontal ? 'horizontal' : 'vertical'} line, row ${row + 1}, column ${col + 1}" ${owner || locked ? 'disabled' : ''}><span aria-hidden="true"></span></button>`;
      }
    }
    return html;
  }
  function keepBoardFocus(board, attribute, html) {
    const focused = board.contains(document.activeElement) ? document.activeElement.getAttribute(attribute) : null;
    board.innerHTML = html;
    if (focused !== null) {
      const same = board.querySelector(`[${attribute}="${focused}"]:not(:disabled)`), next = board.querySelector('button:not(:disabled)');
      (same || next || board)?.focus({preventScroll: true});
    }
  }
  function renderDots() {
    const state = states.dots, you = state.boxes.filter(v => v === 'you').length, bot = state.boxes.filter(v => v === 'bot').length;
    keepBoardFocus($('dotsBoard'), 'data-dots', dotsMarkup());
    $('dotsYou').textContent = you; $('dotsBot').textContent = bot;
    $('dotsStatus').textContent = state.result ? `${sideName(state.result)} takes the board, ${Math.max(you, bot)} to ${Math.min(you, bot)}.` : state.turn === 'bot' ? 'Shri is choosing a line…' : 'Your turn. Close a box to claim it and play again.';
    if (state.result) onFinish('dots', state.result);
  }
  $('dotsBoard').addEventListener('click', event => {
    const button = event.target.closest('[data-dots]'), state = states.dots;
    if (!button || !canPlay('dots') || state.turn !== 'you' || !dotsMoves(state).includes(Number(button.dataset.dots))) return;
    states.dots = dotsMove(state, Number(button.dataset.dots)); renderDots(); onSave(); resume('dots');
  });

  function renderMemory() {
    const state = states.memory, locked = state.open.length === 2 || !!state.result;
    const html = state.deck.map((pattern, tile) => {
      const matched = state.matched.includes(tile), revealed = matched || state.open.includes(tile), item = MEMORY_PATTERNS[pattern];
      return `<button type="button" data-memory="${tile}" class="memory-tile ${revealed ? 'is-revealed' : ''} ${matched ? 'is-matched' : ''}" aria-label="${revealed ? item.name + ', ' : 'Reveal '}tile ${tile + 1}${matched ? ', matched' : ''}" ${matched || state.open.includes(tile) || locked ? 'disabled' : ''}>${revealed ? `<img src="assets/img/textiles/${item.src}" alt="" width="96" height="96"><span>${item.name}</span>` : '<img class="memory-back" src="assets/img/crafts/rangoli.webp" alt="" width="64" height="64">'}</button>`;
    }).join('');
    keepBoardFocus($('memoryBoard'), 'data-memory', html);
    $('memoryPairs').textContent = `${state.matched.length / 2} / 6`;
    $('memoryTurns').textContent = state.turns;
    $('memoryStatus').textContent = state.result ? `All six pairs found in ${state.turns} turns. A lotus for you!` : locked ? 'Different patterns. Take a look before they turn over.' : state.matched.length ? 'Keep going. Find another matching pair.' : state.open.length ? 'One pattern uncovered. Find its partner.' : 'Turn over any two tiles. Find all six pairs.';
    if (state.result) onFinish('memory', state.result);
  }
  $('memoryBoard').addEventListener('click', event => {
    const button = event.target.closest('[data-memory]');
    if (!button || !canPlay('memory')) return;
    const next = memoryMove(states.memory, Number(button.dataset.memory));
    if (next === states.memory) return;
    states.memory = next; renderMemory(); onSave(); resume('memory');
  });

  // Arrow keys complement Tab and the native column picker.
  function boardKeys(board, attribute, columns) {
    board.addEventListener('keydown', event => {
      const button = event.target.closest('button'), directions = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
      if (!button || !directions[event.key]) return;
      event.preventDefault();
      const buttons = [...board.querySelectorAll('button')], index = buttons.indexOf(button), [dx, dy] = directions[event.key];
      let x = attribute === 'data-dots' ? Number(button.dataset.x) : index % columns;
      let y = attribute === 'data-dots' ? Number(button.dataset.y) : Math.floor(index / columns);
      for (let step = 0; step < 12; step++) {
        x += dx; y += dy;
        if (x < 0 || x >= columns || y < 0) break;
        const target = attribute === 'data-dots' ? buttons.find(b => Number(b.dataset.x) === x && Number(b.dataset.y) === y) : buttons[y * columns + x];
        if (target && !target.disabled) { target.focus(); break; }
      }
    });
  }
  boardKeys($('connectColumns'), 'data-connect', 7);
  boardKeys($('dotsBoard'), 'data-dots', 7);
  boardKeys($('memoryBoard'), 'data-memory', 4);

  function render(game) {
    if (game === 'connect') renderConnect();
    if (game === 'dots') renderDots();
    if (game === 'memory') renderMemory();
  }
  function resume(game) {
    if (!TABLE_GAME_IDS.includes(game)) return;
    render(game);
    const state = states[game];
    if (!canPlay(game) || state.result) return;
    if (game === 'memory' && state.open.length === 2) {
      schedule(() => { states.memory = closeMemoryPair(states.memory); renderMemory(); onSave(); }, 1100);
    } else if (game !== 'memory' && state.turn === 'bot') {
      onMood('thinking');
      schedule(() => {
        if (!canPlay(game)) return;
        if (game === 'connect') {
          const col = connectChoice(states.connect);
          if (col !== null) states.connect = connectMove(states.connect, col);
        } else {
          const edge = dotsChoice(states.dots);
          if (edge !== null) states.dots = dotsMove(states.dots, edge);
        }
        render(game); onSave();
        if (!states[game].result) { onMood('confident'); resume(game); }
      }, 600);
    }
  }
  return {
    has: game => TABLE_GAME_IDS.includes(game),
    state: game => states[game],
    snapshot: () => structuredClone(states),
    restore(game, state) { if (validTableGame(game, state)) states[game] = structuredClone(state); },
    reset(game) { if (factories[game]) { states[game] = factories[game](); render(game); } },
    render, resume,
    turnLabel(game) {
      if (states[game].result) return 'Match complete';
      return game === 'memory' ? `Solo · ${states.memory.matched.length / 2} of 6 pairs` : states[game].turn === 'bot' ? 'Shri is thinking…' : 'Your move';
    },
    lock(game) {
      root.querySelector('#panel' + game[0].toUpperCase() + game.slice(1)).querySelectorAll('[data-connect],[data-dots],[data-memory],#connectDrop,#connectColumn').forEach(control => control.disabled = true);
    }
  };
}
