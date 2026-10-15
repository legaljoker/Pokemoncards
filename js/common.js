// Helpers shared by the gallery and the admin page.

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function normalize(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const RARITY = {
  common: { symbol: '●', label: 'Common' },
  uncommon: { symbol: '◆', label: 'Uncommon' },
  rare: { symbol: '★', label: 'Rare' },
  promo: { symbol: '★', label: 'Promo' },
};

// True if every word typed in the search box appears in the card's text.
function cardMatches(card, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = normalize([card.name, card.set, card.number, card.notes,
    RARITY[card.rarity]?.label, card.firstEdition ? '1st first edition' : ''].join(' '));
  return words.every(w => hay.includes(w));
}

// e.g. "1st Edition · Neo Genesis · 51/111 ◆"
function cardSubtitle(card) {
  const num = [card.number, RARITY[card.rarity]?.symbol].filter(Boolean).join(' ');
  return [card.firstEdition ? '1st Edition' : '', card.set, num].filter(Boolean).join(' · ');
}
