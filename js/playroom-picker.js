/* Shows every game as a chip, so all nine are visible at once. The <select> stays as the
   source of truth (and as the picker on narrow screens); a chip just changes its value. */
(function () {
  'use strict';
  var select = document.getElementById('playGameSelect');
  var dialog = document.getElementById('playroomDialog');
  if (!select || !dialog) return;

  var chips = document.createElement('div');
  chips.className = 'play-chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'Choose a game');
  Array.prototype.forEach.call(select.options, function (option) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'play-chip';
    chip.dataset.game = option.value;
    chip.textContent = option.textContent;
    chip.addEventListener('click', function () {
      if (select.value === option.value) return;
      select.value = option.value;
      select.dispatchEvent(new Event('change', {bubbles: true}));
    });
    chips.appendChild(chip);
  });
  select.closest('.play-game-picker').appendChild(chips);

  function sync() {
    Array.prototype.forEach.call(chips.children, function (chip) {
      var current = chip.dataset.game === select.value;
      chip.setAttribute('aria-pressed', String(current));
      if (current && dialog.open) chip.scrollIntoView({block: 'nearest', inline: 'nearest'});
    });
  }
  select.addEventListener('change', sync);
  // The room can reopen on a saved game, so match the chips whenever it opens.
  new MutationObserver(sync).observe(dialog, {attributes: true, attributeFilter: ['open']});
  sync();
})();
