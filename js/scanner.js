// Card scanner: finds the card in a photo, then reads the name (top left),
// the set number and rarity symbol (bottom corner) and looks for the
// 1st Edition stamp (left side, just under the picture).

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

// Greyscale picture of a real 1st Edition stamp (38 × 28), taken from a card
// scaled to 500 × 700 px. Used to recognise the stamp on other cards.
const STAMP_W = 38, STAMP_H = 28;
const STAMP = [186,182,181,187,189,186,186,185,183,178,189,187,174,155,155,184,164,100,69,65,58,78,140,169,126,110,146,166,164,166,155,153,152,149,137,135,130,129,183,186,183,188,183,182,185,186,186,185,185,179,152,75,97,170,182,156,119,73,95,142,171,162,86,69,122,174,164,170,164,158,152,152,146,145,137,136,183,181,183,187,182,181,184,184,179,181,186,186,162,84,71,140,177,181,137,71,107,168,174,148,79,100,154,164,162,167,160,156,151,152,144,145,147,140,185,180,186,188,183,183,182,185,174,176,180,185,179,121,60,105,168,179,131,74,104,168,166,111,62,115,167,161,164,145,144,159,158,157,152,151,150,154,187,188,190,189,180,184,181,172,127,108,131,159,178,161,70,79,146,177,135,67,100,161,164,90,69,138,170,148,94,67,76,111,156,165,152,167,157,155,187,182,186,186,183,173,173,120,67,69,63,91,139,166,106,65,118,167,133,62,102,164,145,71,93,151,149,72,56,68,65,51,116,167,168,167,170,174,183,184,189,186,184,174,123,60,83,128,108,60,96,155,146,74,93,153,145,100,131,164,115,63,117,159,92,53,90,142,119,58,102,168,166,163,161,163,182,185,187,183,180,179,131,67,79,118,155,112,75,134,166,123,118,135,115,102,106,123,117,120,152,153,75,69,135,145,92,87,125,173,173,164,166,163,186,185,184,180,179,178,170,127,72,75,108,112,96,130,166,133,94,67,46,61,56,46,67,95,134,147,71,69,102,71,62,108,153,171,171,170,165,169,189,187,186,182,183,181,178,176,141,74,53,55,85,136,119,64,54,48,60,74,63,48,40,47,60,104,106,55,48,55,97,150,171,165,177,173,172,173,190,192,184,181,187,182,184,186,176,145,73,65,124,110,55,54,69,72,92,124,139,88,52,48,44,63,111,133,115,135,164,165,153,147,124,142,164,171,189,186,179,163,131,148,171,175,173,168,152,139,138,65,48,54,82,131,152,173,167,101,56,55,42,53,87,153,160,132,115,92,78,59,55,95,167,171,190,187,176,140,82,126,132,113,154,125,130,161,98,52,58,62,80,104,122,173,164,92,46,67,59,57,62,116,136,61,58,54,50,54,77,129,175,175,191,190,177,123,70,129,113,102,148,90,107,144,77,54,54,67,69,88,122,171,164,91,54,70,62,52,58,94,142,107,108,84,51,67,111,141,163,177,189,184,175,109,53,73,76,87,91,70,127,126,69,55,53,68,60,71,119,172,161,89,67,57,61,58,61,82,161,168,108,62,62,76,75,78,146,182,186,182,166,116,78,72,68,61,53,72,133,112,51,59,58,63,64,72,117,171,161,83,70,59,72,65,65,83,134,105,62,67,69,75,84,105,149,182,188,185,180,172,165,156,145,127,112,114,150,110,49,64,60,52,61,72,121,168,160,88,69,67,65,70,58,80,138,124,100,124,139,151,160,176,184,178,188,186,189,188,187,183,181,177,170,168,170,119,53,59,55,53,55,69,120,169,160,95,65,67,65,67,69,87,150,173,175,175,180,177,180,187,176,183,193,192,187,184,180,179,181,181,178,176,174,136,62,59,52,58,73,83,127,172,160,93,78,60,62,59,79,103,163,180,179,172,181,177,176,182,179,173,187,190,190,185,174,176,177,176,181,184,175,153,75,52,51,55,67,78,127,177,163,83,78,61,56,62,75,127,173,182,179,176,172,181,180,181,176,180,187,182,188,185,176,176,182,177,175,177,176,172,109,52,54,57,72,103,146,177,171,128,97,75,64,61,100,153,183,178,179,172,178,183,182,181,179,180,187,188,187,180,180,179,178,179,177,174,175,177,163,90,54,64,82,120,133,137,137,136,99,70,81,89,147,178,180,181,182,182,181,181,180,180,182,174,192,193,192,187,178,179,186,179,176,179,181,180,172,155,95,60,60,65,64,65,68,63,65,72,90,134,178,178,180,188,183,182,187,180,176,183,176,181,193,190,187,187,184,185,179,182,186,180,176,182,181,177,160,113,78,56,54,55,59,60,81,107,147,175,185,179,184,182,185,185,184,179,182,179,183,187,188,192,188,187,184,181,180,184,184,180,181,176,177,175,177,175,160,129,105,98,107,123,149,173,180,187,183,176,182,187,189,182,188,185,182,178,185,177,190,195,185,189,189,186,188,186,189,185,184,184,182,181,182,184,181,182,178,175,175,177,177,178,182,187,186,186,188,188,179,185,192,189,178,178,186,181,190,195,193,194,194,184,187,184,186,188,184,185,183,178,181,182,181,181,182,185,182,181,177,180,178,179,187,183,184,185,184,187,184,185,185,178,184,189,190,192,196,195,192,185,184,181,179,181,181,182,184,180,184,185,183,182,180,182,185,185,178,179,183,183,186,180,182,184,184,183,185,185,185,183,189,191];

// ---------- small canvas helpers ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// Copy part of the card (given as fractions of the card box) into a new canvas.
function cardRegion(src, box, left, top, right, bottom, outWidth, filter) {
  const x = box.x + box.w * left, y = box.y + box.h * top;
  const w = box.w * (right - left), h = box.h * (bottom - top);
  const scale = outWidth ? outWidth / w : 1;
  const c = makeCanvas(w * scale, h * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  if (filter) ctx.filter = filter;
  ctx.drawImage(src, x, y, w, h, 0, 0, c.width, c.height);
  return c;
}

// Black text on white: each pixel is compared with the average brightness
// around it, so coloured or uneven card backgrounds drop out.
function binarize(canvas, radius, k) {
  const { g, w, h } = grey(canvas);
  const S = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) { row += g[y * w + x]; S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row; }
  }
  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d');
  const id = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - radius), y1 = Math.min(h, y + radius + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius), x1 = Math.min(w, x + radius + 1);
      const sum = S[y1 * (w + 1) + x1] - S[y0 * (w + 1) + x1] - S[y1 * (w + 1) + x0] + S[y0 * (w + 1) + x0];
      const mean = sum / ((x1 - x0) * (y1 - y0));
      const v = g[y * w + x] < mean - k ? 0 : 255;
      const i = (y * w + x) * 4;
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
    }
  }
  ctx.putImageData(id, 0, 0);
  return out;
}

function grey(canvas) {
  const { width: w, height: h } = canvas;
  const d = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const g = new Float32Array(w * h);
  for (let i = 0; i < g.length; i++) g[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  return { g, w, h };
}

// ---------- 1. find the card inside the photo ----------
// Two ways: the yellow border, or "everything that isn't background".
// Whichever box is closest to a real card's shape (63 × 88 mm) wins.
function findCard(src) {
  const small = makeCanvas(1, 1);
  const s = Math.min(1, 320 / Math.max(src.width, src.height));
  small.width = Math.max(1, Math.round(src.width * s));
  small.height = Math.max(1, Math.round(src.height * s));
  small.getContext('2d').drawImage(src, 0, 0, small.width, small.height);
  const { width: w, height: h } = small;
  const d = small.getContext('2d').getImageData(0, 0, w, h).data;

  const k = Math.max(2, Math.floor(0.03 * Math.min(w, h)));
  const ring = [[], [], []];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= k && x < w - k && y >= k && y < h - k) continue;
    const i = (y * w + x) * 4;
    ring[0].push(d[i]); ring[1].push(d[i + 1]); ring[2].push(d[i + 2]);
  }
  const median = a => a.sort((p, q) => p - q)[a.length >> 1];
  const bg = ring.map(median);

  const yelCols = new Array(w).fill(0), yelRows = new Array(h).fill(0);
  const difCols = new Array(w).fill(0), difRows = new Array(h).fill(0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (r > 110 && g > 90 && g > 0.62 * r && g < 1.15 * r && b < 0.72 * g && mx - mn > 45) { yelCols[x]++; yelRows[y]++; }
    if (Math.hypot(r - bg[0], g - bg[1], b - bg[2]) > 60) { difCols[x]++; difRows[y]++; }
  }
  const longestRun = (counts, thr) => {
    let best = [0, -1], start = -1;
    counts.concat([0]).forEach((v, i) => {
      if (v > thr && start < 0) start = i;
      else if (v <= thr && start >= 0) { if (i - start > best[1] - best[0]) best = [start, i]; start = -1; }
    });
    return best;
  };
  let best = null;
  for (const [cols, rows, f] of [[yelCols, yelRows, 0.03], [difCols, difRows, 0.35]]) {
    const [x0, x1] = longestRun(cols, f * h), [y0, y1] = longestRun(rows, f * w);
    const bw = x1 - x0, bh = y1 - y0;
    if (bw <= 0 || bh <= 0) continue;
    const score = Math.abs(bw / bh - 0.716) + (bw * bh / (w * h) < 0.3 ? 0.5 : 0);
    if (!best || score < best.score) best = { score, x: x0 / s, y: y0 / s, w: bw / s, h: bh / s };
  }
  if (best && best.score < 0.1) return { x: best.x, y: best.y, w: best.w, h: best.h, found: true };
  return { x: 0, y: 0, w: src.width, h: src.height, found: false };
}

// ---------- 2. 1st Edition stamp ----------
let stampScales = null;
function stampTemplates() {
  if (stampScales) return stampScales;
  const base = makeCanvas(STAMP_W, STAMP_H);
  const id = base.getContext('2d').createImageData(STAMP_W, STAMP_H);
  STAMP.forEach((v, i) => { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; });
  base.getContext('2d').putImageData(id, 0, 0);
  stampScales = [0.85, 0.93, 1, 1.08, 1.16].map(s => {
    const c = makeCanvas(STAMP_W * s, STAMP_H * s);
    c.getContext('2d').drawImage(base, 0, 0, c.width, c.height);
    const t = grey(c);
    const mean = t.g.reduce((a, b) => a + b, 0) / t.g.length;
    const sd = Math.sqrt(t.g.reduce((a, b) => a + (b - mean) ** 2, 0) / t.g.length) || 1;
    t.g = t.g.map(v => (v - mean) / sd);
    return t;
  });
  return stampScales;
}

// How closely the best spot left of the picture matches the stamp (0–1).
function firstEditionScore(src, box) {
  const card = makeCanvas(500, 700);
  card.getContext('2d').drawImage(src, box.x, box.y, box.w, box.h, 0, 0, 500, 700);
  const { g, w } = grey(card);
  let best = -1;
  for (const t of stampTemplates()) {
    const n = t.w * t.h;
    for (let y = Math.floor(0.47 * 700); y < 0.61 * 700 - t.h; y += 2) {
      for (let x = Math.floor(0.02 * 500); x < 0.22 * 500 - t.w; x += 2) {
        let sum = 0, sq = 0;
        for (let ty = 0; ty < t.h; ty++) for (let tx = 0; tx < t.w; tx++) { const v = g[(y + ty) * w + x + tx]; sum += v; sq += v * v; }
        const mean = sum / n, sd = Math.sqrt(Math.max(sq / n - mean * mean, 1e-6));
        let acc = 0;
        for (let ty = 0; ty < t.h; ty++) for (let tx = 0; tx < t.w; tx++) acc += (g[(y + ty) * w + x + tx] - mean) * t.g[ty * t.w + tx];
        best = Math.max(best, acc / (n * sd));
      }
    }
  }
  return best;
}

// ---------- 3. rarity symbol ----------
// Draw a black circle, diamond and star and see which one best matches the
// little symbol just right of the set number.
function symbolTemplate(kind, size) {
  const big = makeCanvas(size * 8 + 16, size * 8 + 16);
  const ctx = big.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, big.width, big.height);
  ctx.fillStyle = '#000';
  const c = big.width / 2, r = size * 4;
  ctx.beginPath();
  if (kind === 'common') ctx.arc(c, c, r * 0.85, 0, Math.PI * 2);
  else if (kind === 'uncommon') { ctx.moveTo(c, c - r); ctx.lineTo(c + r * 0.85, c); ctx.lineTo(c, c + r); ctx.lineTo(c - r * 0.85, c); }
  else for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r;
    ctx.lineTo(c + rr * Math.cos(a), c + rr * Math.sin(a) + r * 0.08);
  }
  ctx.closePath(); ctx.fill();
  const t = makeCanvas(size + 2, size + 2);
  const tctx = t.getContext('2d');
  tctx.imageSmoothingQuality = 'high';
  tctx.filter = 'blur(0.6px)';
  tctx.drawImage(big, 0, 0, t.width, t.height);
  const g = grey(t);
  const mean = g.g.reduce((a, b) => a + b, 0) / g.g.length;
  const sd = Math.sqrt(g.g.reduce((a, b) => a + (b - mean) ** 2, 0) / g.g.length) || 1;
  g.g = g.g.map(v => (v - mean) / sd);
  return g;
}

// Best normalised match of template t anywhere inside grey image g (−1…1).
function bestMatch(g, t) {
  let best = -1;
  for (let y = 0; y + t.h <= g.h; y++) {
    for (let x = 0; x + t.w <= g.w; x++) {
      let sum = 0, sq = 0;
      for (let ty = 0; ty < t.h; ty++) for (let tx = 0; tx < t.w; tx++) { const v = g.g[(y + ty) * g.w + x + tx]; sum += v; sq += v * v; }
      const n = t.w * t.h, mean = sum / n, sd = Math.sqrt(Math.max(sq / n - mean * mean, 0));
      if (sd < 1) continue;
      let acc = 0;
      for (let ty = 0; ty < t.h; ty++) for (let tx = 0; tx < t.w; tx++) acc += (g.g[(y + ty) * g.w + x + tx] - mean) * t.g[ty * t.w + tx];
      best = Math.max(best, acc / (n * sd));
    }
  }
  return best;
}

// wordBox: where the number was read in the strip. Returns 'common' | 'uncommon' | 'rare' | ''.
function classifyRarity(strip, wordBox) {
  const h = wordBox.y1 - wordBox.y0;
  if (h < 4) return '';
  // Shrink so the digits are ~16 px tall (the size the templates are made for).
  const scale = 16 / h;
  const x0 = Math.max(0, wordBox.x1 - 1.5 * h), x1 = Math.min(strip.width, wordBox.x1 + 2.8 * h);
  const y0 = Math.max(0, wordBox.y0 - 0.5 * h), y1 = Math.min(strip.height, wordBox.y1 + 0.5 * h);
  const c = makeCanvas((x1 - x0) * scale, (y1 - y0) * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(strip, x0, y0, x1 - x0, y1 - y0, 0, 0, c.width, c.height);
  const g = grey(c);
  const scores = {};
  for (const kind of ['common', 'uncommon', 'rare']) {
    scores[kind] = Math.max(...[11, 13, 15, 17].map(size => bestMatch(g, symbolTemplate(kind, size))));
  }
  const [first, second] = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  // Leave it blank (so you pick it) unless one shape is a clear winner.
  return first[1] >= 0.72 && first[1] - second[1] >= 0.02 ? first[0] : '';
}

// ---------- 4. text reading (OCR) ----------
let ocrWorkerPromise = null;
let sparseWorkerPromise = null;
let ocrChain = Promise.resolve();
let pokemonNames = null;

// A second reader set up for scattered bits of text (used for the set number).
function getSparseWorker() {
  if (!sparseWorkerPromise) {
    sparseWorkerPromise = getOcrWorker().then(async () => {
      const w = await Tesseract.createWorker('eng');
      await w.setParameters({ tessedit_pageseg_mode: '11' });
      return w;
    });
    sparseWorkerPromise.catch(() => { sparseWorkerPromise = null; });
  }
  return sparseWorkerPromise;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load ' + src));
    document.head.appendChild(s);
  });
}

function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (window.Tesseract ? Promise.resolve() : loadScript(TESSERACT_URL)).then(() => Tesseract.createWorker('eng'));
    ocrWorkerPromise.catch(() => { ocrWorkerPromise = null; });
  }
  return ocrWorkerPromise;
}

const SPECIAL_NAMES = {
  'mr-mime': 'Mr. Mime', 'mime-jr': 'Mime Jr.', 'mr-rime': 'Mr. Rime', 'farfetchd': "Farfetch'd",
  'sirfetchd': "Sirfetch'd", 'nidoran-f': 'Nidoran♀', 'nidoran-m': 'Nidoran♂', 'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z', 'type-null': 'Type: Null', 'jangmo-o': 'Jangmo-o', 'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o', 'flabebe': 'Flabébé',
};

async function getPokemonNames() {
  if (pokemonNames) return pokemonNames;
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem('pkc-names') || 'null'); } catch { }
  if (!raw) {
    try {
      const res = await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=2000');
      raw = (await res.json()).results.map(r => r.name);
      try { localStorage.setItem('pkc-names', JSON.stringify(raw)); } catch { }
    } catch { raw = []; }
  }
  pokemonNames = raw.map(n => ({
    display: SPECIAL_NAMES[n] || n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' '),
    key: n.replace(/[^a-z]/g, ''),
  }));
  return pokemonNames;
}

function levenshtein(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

const PREFIXES = ['dark', 'light', 'shining', 'radiant', 'alolan', 'galarian', 'hisuian', 'paldean', 'mega', 'shadow'];
const OWNERS = ['brock', 'misty', 'surge', 'erika', 'koga', 'sabrina', 'blaine', 'giovanni', 'rocket'];
const SUFFIXES = ['VMAX', 'VSTAR', 'V', 'GX', 'EX', 'ex', 'BREAK', 'LV.X', 'Prime', 'LEGEND', 'δ'];
const ENERGY = /\b(grass|fire|water|lightning|psychic|fighting|darkness|metal|fairy|dragon|colorless)\s*energy\b/i;

// Turn OCR text into the most likely card name.
function guessName(text, names, minScore = 0.72) {
  const raw = text.split(/\s+/).filter(Boolean);
  const keys = raw.map(t => t.toLowerCase().replace(/[^a-z]/g, ''));
  let best = null;
  for (let i = 0; i < keys.length; i++) {
    // One word, or two/three glued together (OCR sometimes splits names).
    for (let span = 1; span <= 3 && i + span <= keys.length; span++) {
      const k = keys.slice(i, i + span).join('');
      if (k.length < 3) continue;
      for (const n of names) {
        if (Math.abs(n.key.length - k.length) > 4) continue;
        let score;
        if (n.key === k) score = 1 + n.key.length / 100;
        else {
          if (k.length < 5) continue;
          score = 1 - levenshtein(k, n.key) / Math.max(k.length, n.key.length);
        }
        if (score >= minScore && (!best || score > best.score)) best = { display: n.display, start: i, end: i + span, score };
      }
    }
  }
  if (best) {
    let name = best.display;
    let before = keys[best.start - 1] || '';
    if (before === 's' && keys[best.start - 2]) before = keys[best.start - 2] + 's';
    // OCR often garbles the start of "Misty's" etc., so compare the end of the word.
    const owner = before.length >= 4 && OWNERS.find(o => before === o || levenshtein(before.slice(-(o.length + 1)), o + 's') <= 1);
    if (owner) name = (owner === 'surge' ? "Lt. Surge's " : owner[0].toUpperCase() + owner.slice(1) + "'s ") + name;
    else if (PREFIXES.includes(before)) name = before[0].toUpperCase() + before.slice(1) + ' ' + name;
    const after = (raw[best.end] || '').replace(/[^A-Za-z.δ]/g, '');
    const suf = SUFFIXES.find(s => s === after || (s.length > 2 && s.toLowerCase() === after.toLowerCase()));
    if (suf) name += ' ' + suf;
    return name;
  }
  const energy = text.match(ENERGY);
  if (energy) return energy[1][0].toUpperCase() + energy[1].slice(1).toLowerCase() + ' Energy';
  return '';
}

// Lines of text, biggest letters first (the name is the largest text at the top).
function linesBySize(data) {
  return (data.lines || [])
    .map(l => {
      const real = l.words.filter(w => /[A-Za-z]{3}/.test(w.text));
      const hs = (real.length ? real : l.words).map(w => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b);
      return { text: l.text.trim(), size: hs[hs.length >> 1] || 0 };
    })
    .filter(l => l.text && !/\b(basic pok|stage \d|stage|evolves|put .+ on)/i.test(l.text))
    .sort((a, b) => b.size - a.size);
}

async function readName(worker, names, src, box) {
  const attempts = [
    // [left, top, right, bottom, clean up background?]
    [0.03, 0.025, 0.75, 0.13, false],  // top-left, where the name is printed
    [0.03, 0.025, 0.75, 0.13, true],
    [0.00, 0.00, 1.00, 0.18, true],    // wider, in case the card wasn't found exactly
  ];
  let unsure = '';
  for (const [i, [l, t, r, b, clean]] of attempts.entries()) {
    const sure = i < 2 && box.found; // a guess from the whole photo needs checking
    const region = cardRegion(src, box, l, t, r, b, 1400, clean ? 'grayscale(1)' : 'grayscale(1) contrast(1.5)');
    const { data } = await worker.recognize(clean ? binarize(region, 30, 15) : region);
    const lines = linesBySize(data);
    // The biggest text is almost always the name, so be more forgiving there.
    if (lines[0]) {
      const g = guessName(lines[0].text, names, 0.6);
      if (g) return { name: g, sure };
    }
    const g = guessName(data.text, names);
    if (g) return { name: g, sure };
    if (!unsure && lines[0]) unsure = lines[0].text.replace(/[^A-Za-z' .-]/g, '').replace(/\s+/g, ' ').trim();
  }
  return unsure.length >= 3 ? { name: unsure, sure: false } : null;
}

// Set number like 51/111, in the bottom-right (older cards) or bottom-left (newer cards).
// Card counts of real sets — used to pick the right reading when OCR mistakes the "/" for a 1.
const SET_SIZES = new Set([102, 64, 62, 130, 82, 132, 111, 75, 105, 110, 165, 147, 144, 109, 100, 97, 95, 101, 92,
  108, 113, 106, 115, 114, 98, 123, 99, 146, 103, 90, 96, 116, 122, 124, 135, 149, 153, 156, 160, 162, 163, 145, 119,
  83, 112, 121, 159, 167, 172, 175, 182, 185, 189, 191, 192, 193, 195, 196, 198, 202, 203, 204, 207, 214, 236, 264,
  73, 78, 68, 72, 94, 70, 71, 25, 30, 32, 10, 11, 12, 16, 17, 18, 20, 22, 24, 36, 40, 53]);
const DIGITISH = { O: '0', o: '0', D: '0', Q: '0', I: '1', l: '1', '|': '1', i: '1', ']': '1', '[': '1', S: '5', s: '5', B: '8', Z: '2', z: '2', '§': '6', b: '6', G: '6', g: '9', q: '9' };

// Find "a/b" in one OCR word. Returns { a, b, end } where end is the index of the last digit of b.
function parseNumber(text) {
  const chars = [...text];
  const fixed = chars.map(c => (c === '/' || /\d/.test(c)) ? c : (DIGITISH[c] || (c === '\\' ? '/' : '#'))).join('');
  const options = [];
  const consider = (a, b, end, why) => {
    const A = parseInt(a, 10), B = parseInt(b, 10);
    if (!A || !SET_SIZES.has(B) || A > B + 60 || a.length > 3 || b.length > 3) return;
    options.push({ a: A, b: B, bs: b, end, score: why === 'slash' ? 1 : 0 });
  };
  // A real slash: digits / digits (maybe followed by a misread rarity symbol).
  const re = /(\d{1,3})\/(\d{1,4})/g;
  let m;
  while ((m = re.exec(fixed))) {
    const a = m[1], digits = m[2];
    for (let len = Math.min(3, digits.length); len >= 1; len--)
      consider(a, digits.slice(0, len), m.index + a.length + len, 'slash');
  }
  // No slash: a "1" in the middle of a run of digits may really be the slash.
  const runs = /\d{3,8}/g;
  while ((m = runs.exec(fixed))) {
    const run = m[0];
    for (let i = 1; i < run.length - 1; i++) {
      if (run[i] !== '1') continue;
      const a = run.slice(0, i), rest = run.slice(i + 1);
      for (let len = Math.min(3, rest.length); len >= 1; len--)
        consider(a, rest.slice(0, len), m.index + i + len, 'one');
    }
  }
  if (!options.length) return null;
  options.sort((x, y) => y.score - x.score || y.bs.length - x.bs.length);
  return options[0];
}

// Where the set number can be: bottom-right (older cards) or bottom-left (newer cards).
const NUMBER_AREAS = [[0.50, 0.88, 1.00, 0.995], [0.00, 0.88, 0.50, 0.995]];
// Four slightly different ways of reading the same strip: [zoom, clean-up radius,
// clean-up strength, sparse-text reader?]. Picked by testing on real card photos.
const NUMBER_READS = [[3.5, 12, 18, true], [2.5, 20, 25, false], [3.5, 12, 25, false], [2.5, 12, 18, true]];

async function readNumber(worker, sparseWorker, src, box) {
  for (const [l, t, r, b] of NUMBER_AREAS) {
    const found = [];
    for (const [zoom, radius, strength, sparse] of NUMBER_READS) {
      // Zoom is relative to a card ~800 px wide, whatever the photo size.
      const strip = cardRegion(src, box, l, t, r, b, 800 * (r - l) * zoom, 'grayscale(1)');
      const { data } = await (sparse ? sparseWorker : worker).recognize(binarize(strip, Math.round(radius * zoom), strength));
      const seen = new Set();
      for (const word of data.words || []) {
        const n = parseNumber(word.text);
        if (!n) continue;
        const number = `${n.a}/${n.bs}`;
        if (seen.has(number)) continue;
        seen.add(number);
        found.push({ number, word, strip, end: n.end });
      }
    }
    // Only trust a number that at least two of the readings agree on.
    const votes = {};
    for (const f of found) (votes[f.number] ||= []).push(f);
    const best = Object.values(votes).filter(v => v.length >= 2).sort((a, b) => b.length - a.length)[0];
    if (!best) continue;

    // The rarity symbol sits just right of the number's last digit.
    const rarityVotes = {};
    for (const f of best) {
      try {
        const rr = classifyRarity(f.strip, f.word.bbox);
        if (rr) rarityVotes[rr] = (rarityVotes[rr] || 0) + 1;
      } catch (e) { console.warn(e); }
    }
    const rarity = Object.keys(rarityVotes).sort((a, b) => rarityVotes[b] - rarityVotes[a])[0] || '';
    return { number: best[0].number, rarity };
  }
  return { number: '', rarity: '' };
}

// Scan one card photo. Jobs run one at a time so a phone isn't overloaded.
function scanCard(canvas, onStatus) {
  const job = ocrChain.then(async () => {
    onStatus?.('🔍 Scanning card…');
    const [worker, sparseWorker, names] = await Promise.all([getOcrWorker(), getSparseWorker(), getPokemonNames()]);
    const box = findCard(canvas);
    const result = { name: null, number: '', rarity: '', firstEdition: false, cardFound: box.found };
    result.name = await readName(worker, names, canvas, box);
    const num = await readNumber(worker, sparseWorker, canvas, box);
    result.number = num.number; result.rarity = num.rarity;
    result.stampScore = firstEditionScore(canvas, box);
    result.firstEdition = result.stampScore > 0.72;
    return result;
  });
  ocrChain = job.catch(() => { });
  return job;
}
