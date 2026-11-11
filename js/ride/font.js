// Sunday Ride: a tiny bitmap font for the HUD and the roadside boards. Glyphs are five pixels tall.

const ROWS = {
  A: '.#. #.# ### #.# #.#', B: '##. #.# ##. #.# ##.', C: '.## #.. #.. #.. .##', D: '##. #.# #.# #.# ##.',
  E: '### #.. ##. #.. ###', F: '### #.. ##. #.. #..', G: '.## #.. #.# #.# .##', H: '#.# #.# ### #.# #.#',
  I: '### .#. .#. .#. ###', J: '..# ..# ..# #.# .#.', K: '#.# #.# ##. #.# #.#', L: '#.. #.. #.. #.. ###',
  M: '#...# ##.## #.#.# #...# #...#', N: '#..# ##.# #.## #..# #..#', O: '.#. #.# #.# #.# .#.', P: '##. #.# ##. #.. #..',
  Q: '.#. #.# #.# ### .##', R: '##. #.# ##. #.# #.#', S: '.## #.. .#. ..# ##.', T: '### .#. .#. .#. .#.',
  U: '#.# #.# #.# #.# ###', V: '#.# #.# #.# #.# .#.', W: '#...# #...# #.#.# ##.## #...#', X: '#.# #.# .#. #.# #.#',
  Y: '#.# #.# .#. .#. .#.', Z: '### ..# .#. #.. ###',
  0: '### #.# #.# #.# ###', 1: '.#. ##. .#. .#. ###', 2: '##. ..# .#. #.. ###', 3: '##. ..# .#. ..# ##.',
  4: '#.# #.# ### ..# ..#', 5: '### #.. ##. ..# ##.', 6: '.## #.. ### #.# ###', 7: '### ..# .#. .#. .#.',
  8: '### #.# ### #.# ###', 9: '### #.# ### ..# ##.',
  ' ': '.. .. .. .. ..', '.': '. . . . #', ',': '.. .. .. .# #.', '!': '# # # . #', '?': '##. ..# .#. ... .#.',
  ':': '. # . # .', '/': '..# ..# .#. #.. #..', '-': '... ... ### ... ...', "'": '# # . . .', '+': '... .#. ### .#. ...',
  '<': '..# .#. #.. .#. ..#', '>': '#.. .#. ..# .#. #..', '%': '#.# ..# .#. #.. #.#',
};

const GLYPHS = {};
for (const [ch, rows] of Object.entries(ROWS)) GLYPHS[ch] = rows.split(' ');

// Number plates use a strict three-pixel cell, so any four characters fit the same plate.
const NARROW = { M: '#.# ### ### #.# #.#', N: '##. #.# #.# #.# #.#', W: '#.# #.# ### ### #.#' };
const PLATE = { ...GLYPHS };
for (const [ch, rows] of Object.entries(NARROW)) PLATE[ch] = rows.split(' ');

export function drawPlate(ctx, text, x, y, color) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of String(text).toUpperCase()) {
    const rows = PLATE[ch] || PLATE['-'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (rows[r][c] === '#') ctx.fillRect(cx + c, y + r, 1, 1);
    cx += 4;
  }
}
const glyph = ch => GLYPHS[ch] || GLYPHS['?'];

export function textWidth(text, scale = 1) {
  let w = 0;
  for (const ch of String(text).toUpperCase()) w += glyph(ch)[0].length + 1;
  return Math.max(0, w - 1) * scale;
}

// align: 'left' (x is the left edge), 'center' or 'right'.
export function drawText(ctx, text, x, y, color, scale = 1, align = 'left') {
  const str = String(text).toUpperCase();
  let cx = align === 'center' ? Math.round(x - textWidth(str, scale) / 2) : align === 'right' ? x - textWidth(str, scale) : x;
  ctx.fillStyle = color;
  for (const ch of str) {
    const rows = glyph(ch);
    for (let r = 0; r < 5; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) if (row[c] === '#') ctx.fillRect(cx + c * scale, y + r * scale, scale, scale);
    }
    cx += (rows[0].length + 1) * scale;
  }
}

export function drawTextShadow(ctx, text, x, y, color, scale = 1, align = 'left', shadow = '#1a1512') {
  drawText(ctx, text, x + 1, y + 1, shadow, scale, align);
  drawText(ctx, text, x, y, color, scale, align);
}
