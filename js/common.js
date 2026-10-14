// Helpers shared by the gallery and the admin page.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function normalize(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// True if every word typed in the search box appears in the card's text.
function cardMatches(card, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalize([card.name, card.set, card.number, card.notes].join(' '));
  return words.every(w => hay.includes(w));
}

function cardSubtitle(card) {
  return [card.set, card.number ? '#' + card.number : ''].filter(Boolean).join(' · ');
}
