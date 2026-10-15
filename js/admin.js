// Add & manage cards. Everything is saved by committing straight to the
// GitHub repository with the GitHub API, so no server is needed.

const $ = id => document.getElementById(id);
const FRONT_MAX = 1400;   // longest side of saved full-size photos (px)
const THUMB_MAX = 420;    // longest side of gallery thumbnails (px)
const SOURCE_MAX = 4000;  // photos bigger than this are scaled down when loaded

// ====================================================================
// Settings
// ====================================================================
const SETTINGS_KEY = 'pkc-settings';
const DEFAULT_SETTINGS = { owner: 'legaljoker', repo: 'Pokemoncards', branch: 'main', token: '' };

function getSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }; }
  catch { return { ...DEFAULT_SETTINGS }; }
}
function putSettings(s) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

function fillSettingsForm() {
  const s = getSettings();
  $('sOwner').value = s.owner;
  $('sRepo').value = s.repo;
  $('sBranch').value = s.branch;
  $('sToken').value = s.token;
  $('needSettings').hidden = !!s.token;
}

$('saveSettings').addEventListener('click', async () => {
  const s = {
    owner: $('sOwner').value.trim(),
    repo: $('sRepo').value.trim(),
    branch: $('sBranch').value.trim() || 'main',
    token: $('sToken').value.trim(),
  };
  putSettings(s);
  fillSettingsForm();
  const st = $('settingsStatus');
  setStatus(st, 'Testing…');
  try {
    const info = await gh(`/repos/${s.owner}/${s.repo}`);
    if (info.permissions && !info.permissions.push) throw new Error('This token can read the repository but cannot save to it. Set Contents to “Read and write”.');
    setStatus(st, '✔ Connected! You can add cards now.', 'ok');
  } catch (e) {
    setStatus(st, '✖ ' + e.message, 'err');
  }
});

$('forgetToken').addEventListener('click', () => {
  putSettings({ ...getSettings(), token: '' });
  fillSettingsForm();
  setStatus($('settingsStatus'), 'Token removed from this device.', 'ok');
});

function setStatus(el, msg, kind = '') {
  el.textContent = msg;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

// ====================================================================
// GitHub API
// ====================================================================
async function gh(path, opts = {}) {
  const s = getSettings();
  if (!s.token) throw new Error('No GitHub token yet — add one in Settings.');
  const res = await fetch('https://api.github.com' + path, {
    ...opts,
    cache: 'no-store',
    headers: {
      Authorization: 'Bearer ' + s.token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    let msg = `GitHub said ${res.status}`;
    try { const j = await res.json(); if (j.message) msg += ': ' + j.message; } catch { }
    if (res.status === 401) msg = 'GitHub rejected the token (expired or mistyped?). Check Settings.';
    if (res.status === 404) msg += ' — check the username/repository in Settings and that the token has access to it.';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

function repoBase() {
  const s = getSettings();
  return `/repos/${s.owner}/${s.repo}`;
}

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
function textToBase64(text) { return bytesToBase64(new TextEncoder().encode(text)); }

// Always read the list from GitHub itself (not the website) so it is never stale.
async function readCards() {
  const s = getSettings();
  try {
    const f = await gh(`${repoBase()}/contents/data/cards.json?ref=${encodeURIComponent(s.branch)}`);
    const bin = atob(f.content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)).cards || [];
  } catch (e) {
    if (e.status === 404) return [];
    throw e;
  }
}

function cardsJsonFile(cards) {
  return { path: 'data/cards.json', base64: textToBase64(JSON.stringify({ cards }, null, 2) + '\n') };
}

// Commit many files (adds, replacements and deletions) as one single commit.
async function commitFiles(changes, message, onProgress) {
  const s = getSettings();
  const base = repoBase();
  const ref = await gh(`${base}/git/ref/heads/${encodeURIComponent(s.branch)}`);
  const parentSha = ref.object.sha;
  const parent = await gh(`${base}/git/commits/${parentSha}`);
  const uploads = changes.filter(c => !c.delete);
  const tree = [];
  let done = 0;
  for (const c of changes) {
    if (c.delete) {
      tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const blob = await gh(`${base}/git/blobs`, { method: 'POST', body: JSON.stringify({ content: c.base64, encoding: 'base64' }) });
    tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha });
    onProgress?.(++done, uploads.length);
  }
  const newTree = await gh(`${base}/git/trees`, { method: 'POST', body: JSON.stringify({ base_tree: parent.tree.sha, tree }) });
  const commit = await gh(`${base}/git/commits`, { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [parentSha] }) });
  await gh(`${base}/git/refs/heads/${encodeURIComponent(s.branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
}

// ====================================================================
// Image helpers
// ====================================================================
function loadImageFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Modern browsers apply the photo's rotation (EXIF) when drawing.
      const c = scaledCanvas(img, SOURCE_MAX, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(url);
      resolve(c);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open that photo.')); };
    img.src = url;
  });
}

function scaledCanvas(src, maxDim, w = src.width, h = src.height) {
  const s = Math.min(1, maxDim / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * s));
  c.height = Math.max(1, Math.round(h * s));
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

function cropCanvas(src, x, y, w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  c.getContext('2d').drawImage(src, x, y, w, h, 0, 0, c.width, c.height);
  return c;
}

function rotateCanvas(src) {
  const c = document.createElement('canvas');
  c.width = src.height;
  c.height = src.width;
  const ctx = c.getContext('2d');
  ctx.translate(c.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return c;
}

async function canvasToBase64(canvas, maxDim, quality = 0.85) {
  const c = scaledCanvas(canvas, maxDim);
  const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', quality));
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

function previewUrl(canvas) {
  return scaledCanvas(canvas, 300).toDataURL('image/jpeg', 0.8);
}

function slugify(s) {
  return normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'card';
}
function newId(name) {
  return slugify(name) + '-' + Math.random().toString(36).slice(2, 7);
}
function imagePath(id, kind) {
  // A timestamp in the name means replaced photos never show an old cached copy.
  return `images/cards/${id}-${kind}-${Date.now().toString(36)}.jpg`;
}

// ====================================================================
// Card scanning (the reading itself lives in scanner.js)
// ====================================================================
const SCAN_FIELDS = ['name', 'number', 'rarity', 'firstEdition'];

function setField(el, item, field, value) {
  item[field] = value;
  const inp = el.querySelector(`[data-f=${field}]`);
  if (!inp) return;
  if (inp.type === 'checkbox') inp.checked = !!value; else inp.value = value;
}

// Scan a card photo and fill in what was found. With onlyBlank, fields
// that already have something in them are left alone.
async function applyScan(canvas, item, el, { onlyBlank = false, onChange } = {}) {
  const hint = el.querySelector('.ocr-hint');
  try {
    const r = await scanCard(canvas, msg => { hint.textContent = msg; });
    if (!el.isConnected) return;
    const notes = [];
    const fill = (field, value) => {
      if (!value) return false;
      if (onlyBlank && item[field]) return false;
      setField(el, item, field, value);
      return true;
    };
    if (r.name && fill('name', r.name.name)) notes.push(r.name.sure ? '✔ name' : '⚠ name — please check');
    else if (!item.name) notes.push('✖ name not read — please type it');
    if (fill('number', r.number)) notes.push('✔ number');
    else if (!item.number) notes.push('✖ number not read');
    if (fill('rarity', r.rarity)) notes.push('✔ symbol');
    else if (!item.rarity) notes.push('✖ symbol not read — pick it');
    if (r.firstEdition && fill('firstEdition', true)) notes.push('✔ 1st Edition stamp');
    hint.textContent = notes.join(' · ') + (notes.some(n => n.startsWith('✔')) ? ' — please double-check' : '');
    onChange?.();
  } catch (e) {
    hint.textContent = 'Scanner unavailable — please type the details';
    console.error(e);
  }
}

function loadUrlToCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(scaledCanvas(img, SOURCE_MAX, img.naturalWidth, img.naturalHeight));
    img.onerror = () => reject(new Error('Could not load ' + url + ' (if you just saved it, wait a minute)'));
    img.src = url;
  });
}

// ====================================================================
// Binder page splitter
// ====================================================================
const split = { src: null };
const splitInputs = ['gCols', 'gRows', 'mTop', 'mBottom', 'mLeft', 'mRight', 'gapX', 'gapY'];

function splitParams() {
  const v = id => parseFloat($(id).value) || 0;
  return {
    cols: Math.max(1, Math.round(v('gCols'))), rows: Math.max(1, Math.round(v('gRows'))),
    top: v('mTop') / 100, bottom: v('mBottom') / 100, left: v('mLeft') / 100, right: v('mRight') / 100,
    gapX: v('gapX') / 100, gapY: v('gapY') / 100,
  };
}

function splitCells() {
  const { width: W, height: H } = split.src;
  const p = splitParams();
  const x0 = W * p.left, y0 = H * p.top;
  const innerW = W * (1 - p.left - p.right), innerH = H * (1 - p.top - p.bottom);
  const cw = (innerW - W * p.gapX * (p.cols - 1)) / p.cols;
  const ch = (innerH - H * p.gapY * (p.rows - 1)) / p.rows;
  const cells = [];
  if (cw <= 0 || ch <= 0) return cells;
  for (let r = 0; r < p.rows; r++)
    for (let c = 0; c < p.cols; c++)
      cells.push({ x: x0 + c * (cw + W * p.gapX), y: y0 + r * (ch + H * p.gapY), w: cw, h: ch });
  return cells;
}

function drawSplit() {
  if (!split.src) return;
  const canvas = $('splitCanvas');
  const disp = scaledCanvas(split.src, 1100);
  canvas.width = disp.width;
  canvas.height = disp.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(disp, 0, 0);
  const s = disp.width / split.src.width;
  ctx.lineWidth = Math.max(2, disp.width / 300);
  ctx.font = `bold ${Math.round(disp.width / 30)}px system-ui, sans-serif`;
  splitCells().forEach((cell, i) => {
    ctx.strokeStyle = '#ff2a2a';
    ctx.fillStyle = 'rgba(255,42,42,.10)';
    ctx.fillRect(cell.x * s, cell.y * s, cell.w * s, cell.h * s);
    ctx.strokeRect(cell.x * s, cell.y * s, cell.w * s, cell.h * s);
    ctx.fillStyle = '#ff2a2a';
    ctx.fillText(String(i + 1), cell.x * s + 6, cell.y * s + disp.width / 28);
  });
}

function setGrid(cols, rows) {
  $('gCols').value = cols;
  $('gRows').value = rows;
  drawSplit();
}

$('binderFile').addEventListener('change', async e => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    split.src = await loadImageFile(file);
  } catch (err) { alert(err.message); return; }
  // Guess the layout from the photo's shape: wide photo → 4 across, tall → 2 across.
  if (split.src.width > split.src.height) setGrid(4, 2); else setGrid(2, 4);
  $('splitBox').hidden = false;
  $('splitBox').scrollIntoView({ behavior: 'smooth' });
});

document.querySelectorAll('[data-grid]').forEach(b => b.addEventListener('click', () => {
  const [c, r] = b.dataset.grid.split('x').map(Number);
  setGrid(c, r);
}));
splitInputs.forEach(id => $(id).addEventListener('input', drawSplit));

$('rotateBtn').addEventListener('click', () => {
  if (!split.src) return;
  split.src = rotateCanvas(split.src);
  setGrid($('gRows').value, $('gCols').value);
});

$('cancelSplit').addEventListener('click', () => {
  split.src = null;
  $('splitBox').hidden = true;
});

$('splitBtn').addEventListener('click', () => {
  const cells = splitCells();
  if (!cells.length) { alert('The edges/gaps are too large — make them smaller.'); return; }
  cells.forEach(cell => addToQueue(cropCanvas(split.src, cell.x, cell.y, cell.w, cell.h)));
  split.src = null;
  $('splitBox').hidden = true;
  $('queueBox').scrollIntoView({ behavior: 'smooth' });
});

$('singleFiles').addEventListener('change', async e => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const f of files) {
    try { addToQueue(await loadImageFile(f)); } catch (err) { alert(err.message); }
  }
  if (files.length) $('queueBox').scrollIntoView({ behavior: 'smooth' });
});

// ====================================================================
// New-card queue
// ====================================================================
const queue = [];

function itemFieldsHtml(item) {
  const opt = (v, label) => `<option value="${v}" ${item.rarity === v ? 'selected' : ''}>${label}</option>`;
  return `
    <input data-f="name" placeholder="Card name (e.g. Pikachu)" value="${escapeHtml(item.name)}" autocapitalize="words">
    <div class="ocr-hint"></div>
    <div class="row2">
      <input data-f="number" placeholder="No. (e.g. 51/111)" value="${escapeHtml(item.number)}" inputmode="numeric">
      <select data-f="rarity" aria-label="Rarity symbol">
        ${opt('', 'Symbol?')}${opt('common', '● Common')}${opt('uncommon', '◆ Uncommon')}${opt('rare', '★ Rare')}${opt('promo', '★ Promo')}
      </select>
    </div>
    <label class="check small-check"><input type="checkbox" data-f="firstEdition" ${item.firstEdition ? 'checked' : ''}> 1st Edition</label>
    <input data-f="set" placeholder="Set (optional)" value="${escapeHtml(item.set)}">
    <input data-f="notes" placeholder="Notes (optional)" value="${escapeHtml(item.notes)}">`;
}

function thumbsHtml(frontSrc, backSrc) {
  return `<img class="t-front" src="${escapeHtml(frontSrc)}" alt="Front">
    ${backSrc ? `<img class="t-back" src="${escapeHtml(backSrc)}" alt="Back">` : '<div class="noback t-back">No back photo</div>'}`;
}

function bindFields(el, item, onChange) {
  el.querySelectorAll('[data-f]').forEach(inp => {
    const ev = inp.type === 'checkbox' || inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(ev, () => {
      item[inp.dataset.f] = inp.type === 'checkbox' ? inp.checked : inp.value;
      onChange?.();
    });
  });
}

function setBackThumb(el, src) {
  const old = el.querySelector('.t-back');
  const tmp = document.createElement('div');
  tmp.innerHTML = src ? `<img class="t-back" src="${escapeHtml(src)}" alt="Back">` : '<div class="noback t-back">No back photo</div>';
  old.replaceWith(tmp.firstElementChild);
}

function addToQueue(canvas) {
  const item = { front: canvas, back: null, name: '', set: '', number: '', rarity: '', firstEdition: false, notes: '' };
  queue.push(item);
  const el = document.createElement('div');
  el.className = 'qi';
  el.innerHTML = `
    <div class="thumbs">${thumbsHtml(previewUrl(canvas), null)}</div>
    <div class="fields">
      ${itemFieldsHtml(item)}
      <div class="btn-row">
        <button class="btn small" data-a="ocr">🔍 Scan again</button>
        <label class="btn small file-btn">Add back<input type="file" accept="image/*"></label>
        <button class="btn small" data-a="rotate">⟳</button>
        <button class="btn small danger" data-a="remove">Remove</button>
      </div>
    </div>`;
  bindFields(el, item);
  el.querySelector('[data-a=ocr]').addEventListener('click', () => {
    SCAN_FIELDS.forEach(f => setField(el, item, f, f === 'firstEdition' ? false : ''));
    applyScan(item.front, item, el);
  });
  el.querySelector('[data-a=rotate]').addEventListener('click', () => {
    item.front = rotateCanvas(item.front);
    el.querySelector('.t-front').src = previewUrl(item.front);
  });
  el.querySelector('[data-a=remove]').addEventListener('click', () => {
    queue.splice(queue.indexOf(item), 1);
    el.remove();
    updateQueueBox();
  });
  el.querySelector('input[type=file]').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    item.back = await loadImageFile(f);
    setBackThumb(el, previewUrl(item.back));
  });
  $('queue').appendChild(el);
  updateQueueBox();
  if ($('autoOcr').checked) applyScan(item.front, item, el, { onlyBlank: true });
}

function updateQueueBox() {
  $('queueBox').hidden = queue.length === 0;
  $('saveQueue').textContent = `💾 Save ${queue.length} card${queue.length === 1 ? '' : 's'} to my site`;
  $('saveQueue').disabled = queue.length === 0;
}

$('clearQueue').addEventListener('click', () => {
  if (!confirm('Remove all cards from this list? (Nothing has been saved yet.)')) return;
  queue.length = 0;
  $('queue').innerHTML = '';
  updateQueueBox();
});

$('saveQueue').addEventListener('click', async () => {
  const st = $('queueStatus');
  const unnamed = queue.filter(i => !i.name.trim()).length;
  if (unnamed && !confirm(`${unnamed} card(s) have no name and won't show up in searches. Save anyway?`)) return;
  const btn = $('saveQueue');
  btn.disabled = true;
  try {
    setStatus(st, 'Preparing photos…');
    const cards = await readCards();
    const files = [];
    const now = new Date().toISOString();
    for (const item of queue) {
      const id = newId(item.name);
      const card = {
        id,
        name: item.name.trim(),
        set: item.set.trim(),
        number: item.number.trim(),
        rarity: item.rarity,
        firstEdition: !!item.firstEdition,
        notes: item.notes.trim(),
        front: imagePath(id, 'front'),
        thumb: imagePath(id, 'thumb'),
        added: now,
      };
      files.push({ path: card.front, base64: await canvasToBase64(item.front, FRONT_MAX) });
      files.push({ path: card.thumb, base64: await canvasToBase64(item.front, THUMB_MAX, 0.8) });
      if (item.back) {
        card.back = imagePath(id, 'back');
        files.push({ path: card.back, base64: await canvasToBase64(item.back, FRONT_MAX) });
      }
      cards.push(card);
    }
    files.push(cardsJsonFile(cards));
    await commitFiles(files, `Add ${queue.length} card(s)`, (n, total) => setStatus(st, `Uploading ${n} of ${total}…`));
    queue.length = 0;
    $('queue').innerHTML = '';
    updateQueueBox();
    $('queueBox').hidden = false;
    setStatus(st, '✔ Saved! Your site will show them in about a minute.', 'ok');
    manageLoaded = false;
  } catch (e) {
    setStatus(st, '✖ ' + e.message, 'err');
  } finally {
    btn.disabled = queue.length === 0;
  }
});

// ====================================================================
// Manage existing cards
// ====================================================================
let manageCards = [];
let manageLoaded = false;

async function loadManage() {
  const st = $('manageLoadStatus');
  setStatus(st, 'Loading…');
  $('manageList').innerHTML = '';
  try {
    manageCards = (await readCards()).map(c => ({ card: c, edit: { ...c }, newFront: null, newBack: null, removeBack: false, deleted: false }));
    manageCards.sort((a, b) => (a.card.name || '').localeCompare(b.card.name || ''));
    manageCards.forEach(m => $('manageList').appendChild(manageItemEl(m)));
    manageLoaded = true;
    setStatus(st, manageCards.length ? `${manageCards.length} cards` : 'No cards yet.');
    filterManage();
  } catch (e) {
    setStatus(st, '✖ ' + e.message, 'err');
  }
}

const EDIT_FIELDS = ['name', 'set', 'number', 'rarity', 'firstEdition', 'notes'];

function isDirty(m) {
  return m.deleted || m.newFront || m.newBack || m.removeBack ||
    EDIT_FIELDS.some(f => (m.edit[f] || '') !== (m.card[f] || ''));
}

function manageItemEl(m) {
  const el = document.createElement('div');
  el.className = 'qi';
  m.el = el;
  el.innerHTML = `
    <div class="thumbs">${thumbsHtml(m.card.thumb || m.card.front, m.card.back)}</div>
    <div class="fields">
      ${itemFieldsHtml(m.edit)}
      <div class="btn-row">
        <label class="btn small file-btn">Front photo<input type="file" accept="image/*" data-side="front"></label>
        <label class="btn small file-btn">Back photo<input type="file" accept="image/*" data-side="back"></label>
        <button class="btn small" data-a="noback" ${m.card.back ? '' : 'hidden'}>Remove back</button>
        <button class="btn small" data-a="scan">🔍 Scan</button>
        <button class="btn small danger" data-a="delete">Delete</button>
      </div>
    </div>`;
  const mark = () => el.classList.toggle('dirty', !!isDirty(m));
  m.mark = mark;
  bindFields(el, m.edit, mark);
  el.querySelector('[data-a=scan]').addEventListener('click', () => scanManaged(m, false));
  el.querySelectorAll('input[type=file]').forEach(inp => inp.addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const c = await loadImageFile(f);
    if (inp.dataset.side === 'front') {
      m.newFront = c;
      el.querySelector('.t-front').src = previewUrl(c);
    } else {
      m.newBack = c;
      m.removeBack = false;
      setBackThumb(el, previewUrl(c));
      el.querySelector('[data-a=noback]').hidden = false;
    }
    mark();
  }));
  el.querySelector('[data-a=noback]').addEventListener('click', e => {
    m.newBack = null;
    m.removeBack = !!m.card.back;
    setBackThumb(el, null);
    e.target.hidden = true;
    mark();
  });
  el.querySelector('[data-a=delete]').addEventListener('click', e => {
    m.deleted = !m.deleted;
    el.classList.toggle('deleted', m.deleted);
    e.target.textContent = m.deleted ? 'Undo delete' : 'Delete';
    mark();
  });
  return el;
}

// Scan a saved card; only blank details are filled in.
async function scanManaged(m) {
  const hint = m.el.querySelector('.ocr-hint');
  try {
    hint.textContent = 'Loading photo…';
    const canvas = m.newFront || await loadUrlToCanvas(m.card.front);
    await applyScan(canvas, m.edit, m.el, { onlyBlank: true, onChange: m.mark });
  } catch (e) {
    hint.textContent = '✖ ' + e.message;
  }
}

$('scanAll').addEventListener('click', async () => {
  const todo = manageCards.filter(m => !m.deleted && (!m.edit.name || !m.edit.number || !m.edit.rarity));
  if (!todo.length) { setStatus($('manageLoadStatus'), 'Every card already has a name, number and symbol.'); return; }
  if (!confirm(`Scan ${todo.length} card(s) that are missing a name, number or symbol? Only blank details get filled in. This can take a few minutes.`)) return;
  $('scanAll').disabled = true;
  for (const [i, m] of todo.entries()) {
    setStatus($('manageLoadStatus'), `Scanning ${i + 1} of ${todo.length}…`);
    await scanManaged(m);
  }
  $('scanAll').disabled = false;
  setStatus($('manageLoadStatus'), `Done. Check the highlighted cards, then tap “Save changes”.`, 'ok');
});

function filterManage() {
  const q = $('manageSearch').value;
  manageCards.forEach(m => { m.el.hidden = !cardMatches(m.edit, q); });
}

$('manageSearch').addEventListener('input', filterManage);
$('reloadManage').addEventListener('click', () => {
  if (manageCards.some(isDirty) && !confirm('Discard your unsaved changes?')) return;
  loadManage();
});

$('saveManage').addEventListener('click', async () => {
  const st = $('manageStatus');
  const changed = manageCards.filter(isDirty);
  if (!changed.length) { setStatus(st, 'Nothing to save.'); return; }
  const deleting = changed.filter(m => m.deleted).length;
  if (deleting && !confirm(`Permanently delete ${deleting} card(s)?`)) return;
  const btn = $('saveManage');
  btn.disabled = true;
  try {
    setStatus(st, 'Preparing…');
    const cards = await readCards(); // fresh copy, in case it changed on another device
    const files = [];
    for (const m of changed) {
      const i = cards.findIndex(c => c.id === m.card.id);
      if (i < 0) continue;
      const c = cards[i];
      const removeFile = p => { if (p) files.push({ path: p, delete: true }); };
      if (m.deleted) {
        removeFile(c.front); removeFile(c.thumb); removeFile(c.back);
        cards.splice(i, 1);
        continue;
      }
      for (const f of ['name', 'set', 'number', 'notes']) c[f] = (m.edit[f] || '').trim();
      c.rarity = m.edit.rarity || '';
      c.firstEdition = !!m.edit.firstEdition;
      if (m.newFront) {
        removeFile(c.front); removeFile(c.thumb);
        c.front = imagePath(c.id, 'front');
        c.thumb = imagePath(c.id, 'thumb');
        files.push({ path: c.front, base64: await canvasToBase64(m.newFront, FRONT_MAX) });
        files.push({ path: c.thumb, base64: await canvasToBase64(m.newFront, THUMB_MAX, 0.8) });
      }
      if (m.newBack) {
        removeFile(c.back);
        c.back = imagePath(c.id, 'back');
        files.push({ path: c.back, base64: await canvasToBase64(m.newBack, FRONT_MAX) });
      } else if (m.removeBack) {
        removeFile(c.back);
        delete c.back;
      }
    }
    files.push(cardsJsonFile(cards));
    await commitFiles(files, `Update ${changed.length} card(s)`, (n, total) => setStatus(st, `Uploading ${n} of ${total}…`));
    setStatus(st, '✔ Saved! Your site will update in about a minute.', 'ok');
    await loadManage();
  } catch (e) {
    setStatus(st, '✖ ' + e.message, 'err');
  } finally {
    btn.disabled = false;
  }
});

// ====================================================================
// Tabs & startup
// ====================================================================
function showTab(name) {
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
  if (name === 'manage' && !manageLoaded && getSettings().token) loadManage();
}
document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

window.addEventListener('beforeunload', e => {
  if (queue.length || manageCards.some(isDirty)) { e.preventDefault(); e.returnValue = ''; }
});

fillSettingsForm();
if (!getSettings().token) showTab('settings');
