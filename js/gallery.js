const els = {
  grid: document.getElementById('grid'),
  count: document.getElementById('count'),
  empty: document.getElementById('empty'),
  search: document.getElementById('search'),
  sort: document.getElementById('sort'),
  filter: document.getElementById('filter'),
  viewer: document.getElementById('viewer'),
  stage: document.getElementById('vStage'),
  flipper: document.getElementById('vFlipper'),
  front: document.getElementById('vFront'),
  back: document.getElementById('vBack'),
  name: document.getElementById('vName'),
  sub: document.getElementById('vSub'),
  notes: document.getElementById('vNotes'),
  flip: document.getElementById('vFlip'),
  prev: document.getElementById('vPrev'),
  next: document.getElementById('vNext'),
  close: document.getElementById('vClose'),
};

let allCards = [];
let shown = [];
let current = -1;

async function load() {
  try {
    const res = await fetch('data/cards.json?v=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();
    allCards = data.cards || [];
  } catch (e) {
    els.empty.hidden = false;
    els.empty.textContent = 'Could not load the card list.';
    return;
  }
  const params = new URLSearchParams(location.search);
  if (params.get('q')) els.search.value = params.get('q');
  render();
  openFromHash();
}

function render() {
  const q = els.search.value.trim();
  const f = els.filter.value;
  shown = allCards.filter(c => cardMatches(c, q) &&
    (!f || (f === 'first' ? c.firstEdition : f === 'back' ? c.back : c.rarity === f)));
  const sort = els.sort.value;
  if (sort === 'name') shown.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }));
  else if (sort === 'number') shown.sort((a, b) => (parseInt(a.number) || 9999) - (parseInt(b.number) || 9999) || (a.number || '').localeCompare(b.number || ''));
  else if (sort === 'new') shown.sort((a, b) => (b.added || '').localeCompare(a.added || ''));
  else shown.sort((a, b) => (a.added || '').localeCompare(b.added || ''));

  els.grid.innerHTML = shown.map((c, i) => `
    <button class="card-tile" data-i="${i}">
      <div class="img-wrap"><img loading="lazy" src="${escapeHtml(c.thumb || c.front)}" alt="${escapeHtml(c.name)}"></div>
      ${c.back ? '<span class="badge">↻ back</span>' : ''}
      ${c.firstEdition ? '<span class="badge badge-left">1st Ed.</span>' : ''}
      <div class="name">${escapeHtml(c.name || 'Unnamed card')}</div>
      <div class="sub">${escapeHtml(cardSubtitle(c)) || '&nbsp;'}</div>
    </button>`).join('');

  els.count.textContent = allCards.length
    ? (q || els.filter.value ? `${shown.length} of ${allCards.length} cards` : `${allCards.length} cards`)
    : '';
  els.empty.hidden = shown.length > 0;
  els.empty.textContent = allCards.length
    ? 'No cards match your search.'
    : 'No cards yet. Tap “＋ Add” to upload your first ones.';
}

els.grid.addEventListener('click', e => {
  const tile = e.target.closest('.card-tile');
  if (tile) openViewer(Number(tile.dataset.i));
});
els.search.addEventListener('input', render);
els.sort.addEventListener('change', render);
els.filter.addEventListener('change', render);

// ---------- Viewer ----------
function openViewer(i) {
  current = i;
  showCard();
  els.viewer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showCard() {
  const c = shown[current];
  if (!c) return;
  els.flipper.classList.remove('flipped');
  els.front.src = c.front;
  els.front.alt = (c.name || 'Card') + ' (front)';
  els.back.src = c.back || '';
  els.back.alt = (c.name || 'Card') + ' (back)';
  els.name.textContent = c.name || 'Unnamed card';
  els.sub.textContent = cardSubtitle(c);
  els.notes.textContent = c.notes || '';
  els.flip.hidden = !c.back;
  els.flip.textContent = 'Show back';
  els.prev.disabled = current <= 0;
  els.next.disabled = current >= shown.length - 1;
  history.replaceState(null, '', '#card=' + encodeURIComponent(c.id));
}

function closeViewer() {
  els.viewer.classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search);
}

function flip() {
  if (!shown[current]?.back) return;
  const flipped = els.flipper.classList.toggle('flipped');
  els.flip.textContent = flipped ? 'Show front' : 'Show back';
}

function go(delta) {
  const n = current + delta;
  if (n >= 0 && n < shown.length) { current = n; showCard(); }
}

function openFromHash() {
  const m = location.hash.match(/^#card=(.+)$/);
  if (!m) return;
  const id = decodeURIComponent(m[1]);
  const i = shown.findIndex(c => c.id === id);
  if (i >= 0) openViewer(i);
}

els.flip.addEventListener('click', flip);
els.flipper.addEventListener('click', flip);
els.prev.addEventListener('click', () => go(-1));
els.next.addEventListener('click', () => go(1));
els.close.addEventListener('click', closeViewer);
document.addEventListener('keydown', e => {
  if (!els.viewer.classList.contains('open')) return;
  if (e.key === 'Escape') closeViewer();
  else if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
  else if (e.key === ' ' || e.key === 'f') { e.preventDefault(); flip(); }
});

// Swipe left/right to change cards (ignored while pinch-zooming).
let touchStart = null;
els.stage.addEventListener('touchstart', e => {
  touchStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
}, { passive: true });
els.stage.addEventListener('touchend', e => {
  if (!touchStart || (window.visualViewport && visualViewport.scale > 1.05)) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  touchStart = null;
});

load();
