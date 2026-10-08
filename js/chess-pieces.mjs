/* Solid Staunton silhouettes, with separate light and dark pieces. */
const shapes={
 p:'<circle cx="22.5" cy="12" r="5"/><path d="M18 17c-2 3-2 6 0 8l-4 8h17l-4-8c2-2 2-5 0-8Z"/><path d="M12 34h21v5H12Z"/>',
 r:'<path d="M12 6h5v5h4V6h4v5h4V6h5v11l-5 4 1 12H15l1-12-4-4Z"/><path d="M12 33h21v6H12Z"/>',
 n:'<path d="m12 34 2-9 5-6-7 3-5-4L18 7l6-2 5 3c7 6 7 15 4 26Z"/><path d="M11 34h24v5H11Z"/><path class="piece-detail" d="m18 9 1 5m6-3 3 3-6 7m-11-3 4-2"/><circle class="piece-eye" cx="22" cy="12" r="1.2"/>',
 b:'<path d="M22.5 5c-9 7-12 13-6 18l3 2-6 8h19l-6-8 3-2c6-5 3-11-7-18Z"/><path d="M11 34h23v5H11Z"/><path class="piece-detail" d="m25 11-6 9M17 27h11"/>',
 q:'<path d="m10 13 6 18h13l6-18-9 8-3.5-12L19 21Z"/><circle cx="10" cy="11" r="2.4"/><circle cx="22.5" cy="7" r="2.4"/><circle cx="35" cy="11" r="2.4"/><path d="M13 32h19v4H13Zm-2 4h23v4H11Z"/>',
 k:'<path d="M21 3h3v4h4v3h-4v5h-3v-5h-4V7h4Z"/><path d="M21 17c-3-5-12-4-12 2 0 5 7 10 8 13h11c1-3 8-8 8-13 0-6-9-7-12-2Z"/><path d="M13 32h19v4H13Zm-2 4h23v4H11Z"/>'
};
export function chessPieceSVG(piece){return `<svg class="chess-piece piece-${piece.color}" viewBox="0 0 45 45" aria-hidden="true" focusable="false"><g>${shapes[piece.type]||''}</g></svg>`;}
