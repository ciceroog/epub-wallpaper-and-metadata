/* =============================================================================
   epub-capa.js — interface da ferramenta de capa + metadados de EPUB.
   Depende de zip-epub.js (ler/gravar .zip) e epub-opf.js (ler/gravar o
   miolo do EPUB). Tudo roda no navegador.
   ============================================================================= */
'use strict';

/* -----------------------------------------------------------------------------
   Perfis de tela — mesma lista do criador de capas, mais "Tamanho original"
   (não redimensiona, só aplica os ajustes de enquadramento se for o caso).
   --------------------------------------------------------------------------- */
const PROFILES = [
  { id:'ORIGINAL', name:'Tamanho original da imagem', w:0, h:0, levels:16, color:true, group:'Recomendado' },

  { id:'XTEX34', name:'XTEINK X3/X4', w:480, h:800, levels:16, color:false, group:'XTEINK' },

  { id:'K1',    name:'Kindle 1',                   w:600,  h:670,  levels:4,  color:false, group:'Kindle' },
  { id:'K2',    name:'Kindle 2',                   w:600,  h:670,  levels:15, color:false, group:'Kindle' },
  { id:'K34',   name:'Kindle Keyboard/Touch',      w:600,  h:800,  levels:16, color:false, group:'Kindle' },
  { id:'K57',   name:'Kindle 5/7',                 w:600,  h:800,  levels:16, color:false, group:'Kindle' },
  { id:'K810',  name:'Kindle 8/10',                w:600,  h:800,  levels:16, color:false, group:'Kindle' },
  { id:'K11',   name:'Kindle 11',                  w:1072, h:1448, levels:16, color:false, group:'Kindle' },
  { id:'KV',    name:'Kindle Voyage',              w:1072, h:1448, levels:16, color:false, group:'Kindle' },
  { id:'KDX',   name:'Kindle DX/DXG',              w:824,  h:1000, levels:16, color:false, group:'Kindle' },
  { id:'KPW',   name:'Kindle Paperwhite 1/2',      w:758,  h:1024, levels:16, color:false, group:'Kindle' },
  { id:'KPW34', name:'Kindle Paperwhite 3/4',      w:1072, h:1448, levels:16, color:false, group:'Kindle' },
  { id:'KPW5',  name:'Kindle Paperwhite 5/Sig.',   w:1236, h:1648, levels:16, color:false, group:'Kindle' },
  { id:'KPW6',  name:'Kindle Paperwhite 6',        w:1272, h:1696, levels:16, color:false, group:'Kindle' },
  { id:'KO',    name:'Kindle Oasis 2/3',           w:1264, h:1680, levels:16, color:false, group:'Kindle' },
  { id:'KCS',   name:'Kindle Colorsoft',           w:1272, h:1696, levels:16, color:true,  group:'Kindle' },
  { id:'KS',    name:'Kindle Scribe 1/2',          w:1860, h:2480, levels:16, color:false, group:'Kindle' },
  { id:'KS3',   name:'Kindle Scribe 3',            w:1986, h:2648, levels:16, color:false, group:'Kindle' },
  { id:'KSCS',  name:'Kindle Scribe Colorsoft',    w:1986, h:2648, levels:16, color:true,  group:'Kindle' },

  { id:'KoMT',  name:'Kobo Mini/Touch',            w:600,  h:800,  levels:16, color:false, group:'Kobo' },
  { id:'KoG',   name:'Kobo Glo',                   w:768,  h:1024, levels:16, color:false, group:'Kobo' },
  { id:'KoGHD', name:'Kobo Glo HD',                w:1072, h:1448, levels:16, color:false, group:'Kobo' },
  { id:'KoA',   name:'Kobo Aura',                  w:758,  h:1024, levels:16, color:false, group:'Kobo' },
  { id:'KoAHD', name:'Kobo Aura HD',               w:1080, h:1440, levels:16, color:false, group:'Kobo' },
  { id:'KoAH2O',name:'Kobo Aura H2O',              w:1080, h:1430, levels:16, color:false, group:'Kobo' },
  { id:'KoAO',  name:'Kobo Aura ONE',              w:1404, h:1872, levels:16, color:false, group:'Kobo' },
  { id:'KoN',   name:'Kobo Nia',                   w:758,  h:1024, levels:16, color:false, group:'Kobo' },
  { id:'KoC',   name:'Kobo Clara HD/Clara 2E',     w:1072, h:1448, levels:16, color:false, group:'Kobo' },
  { id:'KoCC',  name:'Kobo Clara Colour',          w:1072, h:1448, levels:16, color:true,  group:'Kobo' },
  { id:'KoL',   name:'Kobo Libra H2O/Libra 2',     w:1264, h:1680, levels:16, color:false, group:'Kobo' },
  { id:'KoLC',  name:'Kobo Libra Colour',          w:1264, h:1680, levels:16, color:true,  group:'Kobo' },
  { id:'KoF',   name:'Kobo Forma',                 w:1440, h:1920, levels:16, color:false, group:'Kobo' },
  { id:'KoS',   name:'Kobo Sage',                  w:1440, h:1920, levels:16, color:false, group:'Kobo' },
  { id:'KoE',   name:'Kobo Elipsa',                w:1404, h:1872, levels:16, color:false, group:'Kobo' },

  { id:'Rmk1',      name:'reMarkable 1',           w:1404, h:1872, levels:16, color:false, group:'reMarkable' },
  { id:'Rmk2',      name:'reMarkable 2',           w:1404, h:1872, levels:16, color:false, group:'reMarkable' },
  { id:'RmkPP',     name:'reMarkable Paper Pro',   w:1620, h:2160, levels:16, color:false, group:'reMarkable' },
  { id:'RmkPPMove', name:'reMarkable Paper Pro Move', w:954, h:1696, levels:16, color:false, group:'reMarkable' },

  { id:'OTHER', name:'Tamanho personalizado', w:0, h:0, levels:16, color:true, group:'Outro' },
];
const byId = id => PROFILES.find(p => p.id === id);

/* -----------------------------------------------------------------------------
   Idiomas — português primeiro, inglês em seguida, depois alfabético (nomes
   em português). Código ISO 639-1 de 2 letras: é o formato mais aceito por
   leitores de e-book, incluindo os que não reconhecem variantes regionais
   (pt-BR) ou códigos de 3 letras (por, eng).
   --------------------------------------------------------------------------- */
const LANGUAGES = [
  ['pt', 'Português'], ['en', 'Inglês'],
  ['de', 'Alemão'], ['ca', 'Catalão'], ['zh', 'Chinês'], ['ko', 'Coreano'],
  ['da', 'Dinamarquês'], ['es', 'Espanhol'], ['fi', 'Finlandês'], ['fr', 'Francês'],
  ['el', 'Grego'], ['nl', 'Holandês'], ['hu', 'Húngaro'], ['it', 'Italiano'],
  ['ja', 'Japonês'], ['no', 'Norueguês'], ['pl', 'Polonês'], ['ro', 'Romeno'],
  ['ru', 'Russo'], ['sv', 'Sueco'], ['tr', 'Turco'], ['uk', 'Ucraniano'],
];

/* -----------------------------------------------------------------------------
   Composição da imagem no canvas — mesma lógica do criador de capas.
   --------------------------------------------------------------------------- */
function outDims(profile, customW, customH, imgW, imgH) {
  if (profile.id === 'ORIGINAL') return { w: imgW, h: imgH };
  if (profile.id === 'OTHER') return { w: Math.max(1, customW | 0), h: Math.max(1, customH | 0) };
  return { w: profile.w, h: profile.h };
}

function drawComposition(ctx, img, cw, ch, fit, scale, panX, panY, bg) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const sw = img.width, sh = img.height;
  let dw, dh;
  if (fit === 'stretch') {
    dw = cw; dh = ch;
  } else {
    const rCover = Math.max(cw / sw, ch / sh);
    const rContain = Math.min(cw / sw, ch / sh);
    const ratio = (fit === 'cover') ? rCover : rContain;
    dw = sw * ratio; dh = sh * ratio;
  }
  dw *= scale; dh *= scale;

  const offX = (cw - dw) / 2 + panX * cw / 2;
  const offY = (ch - dh) / 2 + panY * ch / 2;
  ctx.drawImage(img, offX, offY, dw, dh);
}

// Luminância perceptual.
function luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

// Quantização simples para N tons de cinza (sem dithering).
function quantizeGray(imageData, levels) {
  const d = imageData.data;
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.round(Math.round(luma(d[i], d[i+1], d[i+2]) / step) * step);
    d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
  }
}

// Dithering Floyd–Steinberg para N tons de cinza.
function ditherGray(imageData, levels) {
  const { width: w, height: h, data: d } = imageData;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = luma(d[i], d[i+1], d[i+2]);

  const step = 255 / (levels - 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const old = gray[idx];
      const q = Math.round(old / step) * step;
      const err = old - q;
      gray[idx] = q;
      if (x + 1 < w)              gray[idx + 1]     += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0)               gray[idx + w - 1] += err * 3 / 16;
                                 gray[idx + w]     += err * 5 / 16;
        if (x + 1 < w)           gray[idx + w + 1] += err * 1 / 16;
      }
    }
  }
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255;
  }
}

// Aplica a composição e, se for o caso, a conversão pra tons de cinza — a
// mesma lógica usada nos dois lugares: pré-visualização e exportação final.
function paint(targetCtx, img, cw, ch, adj, bg, colorMode, dither, levels) {
  drawComposition(targetCtx, img, cw, ch, adj.fit, adj.scale / 100, adj.panX / 100, adj.panY / 100, bg);
  if (colorMode === 'pb') {
    const data = targetCtx.getImageData(0, 0, cw, ch);
    dither ? ditherGray(data, levels) : quantizeGray(data, levels);
    targetCtx.putImageData(data, 0, 0);
  }
}

/* -----------------------------------------------------------------------------
   Interface
   --------------------------------------------------------------------------- */
const MAX_PREVIEW = 720;

const state = {
  // arquivo original
  bookName: '', entries: null, byName: null, opfPath: '', opfDoc: null, parsed: null,
  // capa
  newCoverImg: null,       // Image() da capa nova, se o usuário substituiu
  adj: { fit: 'cover', scale: 100, panX: 0, panY: 0 },
  profileId: 'ORIGINAL', customW: 1600, customH: 2400, bgLight: true,
  colorMode: 'cor', dither: true,
  format: 'jpeg', quality: 90,
};

const $ = sel => document.querySelector(sel);
const el = {
  stage: $('#stage'), epubEmpty: $('#epub-empty'), epubDropzone: $('#epub-dropzone'),
  epubFile: $('#epub-file'), epubStatus: $('#epub-status'),
  focusView: $('#focus-view'), bookName: $('#book-name'),
  frame: $('#frame'), canvas: $('#preview'), coverNone: $('#cover-none'),
  dims: $('#dims'), coverTag: $('#cover-tag'),

  coverCard: $('#cover-card'), coverDropzone: $('#cover-dropzone'), coverFile: $('#cover-file'),
  coverLabel: $('#cover-label'), coverDropzoneText: $('#cover-dropzone-text'), coverUndo: $('#cover-undo'),

  adjustCard: $('#adjust-card'), profile: $('#profile'), profileInfo: $('#profile-info'),
  custom: $('#custom'), customW: $('#custom-w'), customH: $('#custom-h'),
  bg: $('#bg'), scale: $('#scale'), panX: $('#panx'), panY: $('#pany'),
  scaleNum: $('#scale-num'), panXNum: $('#panx-num'), panYNum: $('#pany-num'), reset: $('#reset'),
  qualityRow: $('#quality-row'), quality: $('#quality'), qualityOut: $('#quality-out'),

  colorCard: $('#color-card'), ditherRow: $('#dither-row'), dither: $('#dither'),

  metaCard: $('#meta-card'), metaEdit: $('#meta-edit'), metaFields: $('#meta-fields'),
  metaIsbn: $('#meta-isbn'), metaCreator: $('#meta-creator'), metaPublisher: $('#meta-publisher'),
  metaDate: $('#meta-date'), metaLanguage: $('#meta-language'),

  exportCard: $('#export-card'), saveEpub: $('#save-epub'), saveHint: $('#save-epub-hint'),
  epubProgress: $('#epub-progress'), epubFill: $('#epub-fill'),
};
const ctx = el.canvas.getContext('2d', { willReadFrequently: true });

/* -- Menu de perfis ----------------------------------------------------------- */
(function buildProfileSelect() {
  const groups = {};
  PROFILES.forEach(p => { (groups[p.group] ||= []).push(p); });
  for (const g of Object.keys(groups)) {
    const og = document.createElement('optgroup');
    og.label = g;
    groups[g].forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = (p.id === 'OTHER' || p.id === 'ORIGINAL') ? p.name : `${p.name} — ${p.w}×${p.h}`;
      og.appendChild(o);
    });
    el.profile.appendChild(og);
  }
  el.profile.value = state.profileId;
})();

/* -- Menu de idiomas ----------------------------------------------------------- */
(function buildLanguageSelect() {
  LANGUAGES.forEach(([code, name]) => {
    const o = document.createElement('option');
    o.value = code;
    o.textContent = `${name} (${code})`;
    el.metaLanguage.appendChild(o);
  });
})();

function matchLanguage(rawCode) {
  if (!rawCode) return 'pt';
  const two = rawCode.trim().slice(0, 2).toLowerCase();
  return LANGUAGES.some(([c]) => c === two) ? two : 'pt';
}

/* -----------------------------------------------------------------------------
   Renderização da capa em foco
   --------------------------------------------------------------------------- */
let rafPending = false;
function scheduleRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => { rafPending = false; render(); });
}

// Devolve a imagem a desenhar: a nova, se o usuário substituiu; senão a
// original do EPUB (só pra pré-visualizar — a original não é reprocessada
// no arquivo final a menos que o usuário mexa nela).
function activeImage() { return state.newCoverImg || state.originalCoverImg || null; }

function render() {
  const img = activeImage();
  if (!img) { updateEmptyCoverUI(); return; }
  el.coverNone.hidden = true;
  el.canvas.style.display = 'block';

  const prof = byId(state.profileId);
  const full = outDims(prof, state.customW, state.customH, img.width, img.height);
  const f = Math.min(1, MAX_PREVIEW / Math.max(full.w, full.h));
  const cw = Math.max(1, Math.round(full.w * f));
  const ch = Math.max(1, Math.round(full.h * f));

  el.canvas.width = cw; el.canvas.height = ch;
  const bg = state.bgLight ? '#ffffff' : '#000000';
  paint(ctx, img, cw, ch, state.adj, bg, state.colorMode, state.dither, prof.levels || 16);

  fitCanvasToStage(full.w, full.h);
  el.dims.textContent = `${full.w} × ${full.h} px`;

  const usingNew = !!state.newCoverImg;
  el.coverTag.textContent = usingNew ? 'Nova capa (ainda não salva)' : 'Capa original do EPUB';
  el.coverTag.classList.toggle('is-original', !usingNew);
}

function updateEmptyCoverUI() {
  const hasBook = !!state.entries;
  if (!hasBook) return;
  el.canvas.style.display = 'none';
  el.coverNone.hidden = false;
  el.dims.textContent = '—';
  el.coverTag.textContent = '';
}

function fitCanvasToStage(fullW, fullH) {
  const FRAME_PADDING = 20; // 10px de cada lado, os mesmos do .frame no CSS
  const maxW = el.stage.clientWidth - 48 - FRAME_PADDING;
  const maxH = el.stage.clientHeight - 130 - FRAME_PADDING;
  const scale = Math.min(maxW / fullW, maxH / fullH, 1.2);
  el.canvas.style.width = Math.round(fullW * scale) + 'px';
  el.canvas.style.height = Math.round(fullH * scale) + 'px';
}

window.addEventListener('resize', () => { if (state.entries) scheduleRender(); });

/* -----------------------------------------------------------------------------
   Carregar o EPUB
   --------------------------------------------------------------------------- */
async function loadEpub(file) {
  el.epubStatus.className = 'hint';
  el.epubStatus.textContent = 'Lendo o arquivo…';
  try {
    const buf = await file.arrayBuffer();
    const entries = await readZip(buf);
    const byName = new Map(entries.map(e => [e.name, e]));

    const containerEntry = byName.get('META-INF/container.xml');
    if (!containerEntry) throw new Error('não achei META-INF/container.xml — isso não parece um EPUB válido.');
    const containerText = new TextDecoder('utf-8').decode(containerEntry.bytes);
    const opfPath = findOpfPath(containerText);

    const opfEntry = byName.get(opfPath);
    if (!opfEntry) throw new Error(`o container aponta para "${opfPath}", mas esse arquivo não está no EPUB.`);
    const opfText = new TextDecoder('utf-8').decode(opfEntry.bytes);
    const opfDoc = new DOMParser().parseFromString(opfText, 'application/xml');
    if (opfDoc.querySelector('parsererror')) throw new Error('o arquivo .opf deste EPUB está com XML inválido.');

    const parsed = readOpf(opfDoc, opfPath);

    state.bookName = (file.name || 'livro').replace(/\.epub$/i, '');
    state.entries = entries;
    state.byName = byName;
    state.opfPath = opfPath;
    state.opfDoc = opfDoc;
    state.parsed = parsed;
    state.newCoverImg = null;
    state.adj = { fit: 'cover', scale: 100, panX: 0, panY: 0 };

    // carrega a imagem de capa atual, se existir
    state.originalCoverImg = null;
    if (parsed.cover) {
      const coverEntry = byName.get(parsed.cover.path);
      if (coverEntry) {
        const blob = new Blob([coverEntry.bytes], { type: parsed.cover.mediaType || 'image/*' });
        state.originalCoverImg = await blobToImage(blob);
      }
    }

    el.epubStatus.className = 'hint is-loaded';
    el.epubStatus.textContent = `Carregado: ${file.name} (${parsed.isEpub3 ? 'EPUB 3' : 'EPUB 2'})`;

    showLoadedUI();
  } catch (err) {
    console.error(err);
    el.epubStatus.className = 'hint is-error';
    el.epubStatus.textContent = 'Não deu para abrir este EPUB: ' + err.message;
  }
}

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('formato de imagem da capa não suportado pelo navegador')); };
    img.src = url;
  });
}

function showLoadedUI() {
  el.epubEmpty.hidden = true;
  el.focusView.hidden = false;
  el.bookName.textContent = state.bookName;

  el.coverCard.hidden = false;
  el.adjustCard.hidden = false;
  el.colorCard.hidden = false;
  el.metaCard.hidden = false;
  el.exportCard.hidden = false;

  el.coverLabel.textContent = state.parsed.cover ? 'Substituir capa' : 'Enviar capa';
  el.coverDropzoneText.textContent = state.parsed.cover
    ? 'ou solte uma imagem aqui para trocar a atual'
    : 'ou solte uma imagem aqui para criar a capa';
  el.coverUndo.hidden = true;

  fillMetadataFields();
  updateFormatUI();
  syncAdjustControls();
  updateColorUI();
  scheduleRender();
  updateSaveHint();
}

function fillMetadataFields() {
  const p = state.parsed;
  el.metaIsbn.value = p.isbn || '';
  el.metaCreator.value = p.creator || '';
  el.metaPublisher.value = p.publisher || '';
  el.metaDate.value = p.date || '';
  el.metaLanguage.value = matchLanguage(p.language);
}

/* -- Eventos de upload do EPUB ------------------------------------------------ */
el.epubFile.addEventListener('change', e => {
  if (e.target.files[0]) loadEpub(e.target.files[0]);
  e.target.value = '';
});
[el.stage, el.epubDropzone].forEach(target => {
  ['dragover', 'dragenter'].forEach(ev => target.addEventListener(ev, e => {
    e.preventDefault();
    if (!state.entries) target.classList.add('drag');
  }));
  ['dragleave', 'drop'].forEach(ev => target.addEventListener(ev, e => { e.preventDefault(); target.classList.remove('drag'); }));
  target.addEventListener('drop', e => {
    if (state.entries) return; // já tem livro carregado — arraste vai para a capa
    const f = [...e.dataTransfer.files].find(f => /\.epub$/i.test(f.name));
    if (f) loadEpub(f);
  });
});

/* -- Substituir a capa --------------------------------------------------------- */
async function setNewCover(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    state.newCoverImg = await blobToImage(file);
    state.adj = { fit: 'cover', scale: 100, panX: 0, panY: 0 };
    el.coverUndo.hidden = false;
    syncAdjustControls();
    scheduleRender();
    updateSaveHint();
  } catch (err) {
    el.epubStatus.className = 'hint is-error';
    el.epubStatus.textContent = 'Não deu para abrir essa imagem: ' + err.message;
  }
}
el.coverFile.addEventListener('change', e => { setNewCover(e.target.files[0]); e.target.value = ''; });
el.coverDropzone.addEventListener('dragover', e => { e.preventDefault(); el.coverDropzone.classList.add('drag'); });
el.coverDropzone.addEventListener('dragleave', () => el.coverDropzone.classList.remove('drag'));
el.coverDropzone.addEventListener('drop', e => {
  e.preventDefault();
  el.coverDropzone.classList.remove('drag');
  setNewCover(e.dataTransfer.files[0]);
});
// soltar no palco, com livro já carregado, também troca a capa
el.stage.addEventListener('drop', e => {
  if (!state.entries) return;
  const f = [...e.dataTransfer.files].find(f => f.type.startsWith('image/'));
  if (f) setNewCover(f);
});
el.coverUndo.addEventListener('click', () => {
  state.newCoverImg = null;
  el.coverUndo.hidden = true;
  scheduleRender();
  updateSaveHint();
});

/* -- Enquadramento e posição --------------------------------------------------- */
function syncAdjustControls() {
  el.scale.value = el.scaleNum.value = state.adj.scale;
  el.panX.value = el.panXNum.value = state.adj.panX;
  el.panY.value = el.panYNum.value = state.adj.panY;
  const fitRadio = document.querySelector(`input[name=fit][value=${state.adj.fit}]`);
  if (fitRadio) fitRadio.checked = true;
}

function onProfileChange() {
  state.profileId = el.profile.value;
  const p = byId(state.profileId);
  el.custom.style.display = (p.id === 'OTHER') ? 'flex' : 'none';

  state.colorMode = p.color ? 'cor' : 'pb';
  const colorRadio = document.querySelector(`input[name=color][value=${state.colorMode}]`);
  if (colorRadio) colorRadio.checked = true;
  updateColorUI();

  el.profileInfo.textContent = p.id === 'ORIGINAL'
    ? 'Mantém a resolução da imagem enviada, sem redimensionar.'
    : p.id === 'OTHER'
      ? 'Defina a largura e a altura em pixels.'
      : `Redimensiona a capa para ${p.w}×${p.h}px${p.color ? ' · painel colorido' : ` · ${p.levels} tons de cinza`}.`;
  scheduleRender();
}
el.profile.addEventListener('change', onProfileChange);
el.customW.addEventListener('input', () => { state.customW = +el.customW.value; scheduleRender(); });
el.customH.addEventListener('input', () => { state.customH = +el.customH.value; scheduleRender(); });

document.querySelectorAll('input[name=fit]').forEach(r =>
  r.addEventListener('change', e => { state.adj.fit = e.target.value; scheduleRender(); }));
el.bg.addEventListener('change', e => { state.bgLight = e.target.checked; scheduleRender(); });

document.querySelectorAll('input[name=color]').forEach(r =>
  r.addEventListener('change', e => { state.colorMode = e.target.value; updateColorUI(); scheduleRender(); }));
el.dither.addEventListener('change', e => { state.dither = e.target.checked; scheduleRender(); });

function updateColorUI() {
  el.ditherRow.style.opacity = state.colorMode === 'pb' ? '1' : '.45';
  el.dither.disabled = state.colorMode !== 'pb';
}

function bindSliderNumber(slider, number, min, max, key) {
  const apply = v => {
    v = Math.max(min, Math.min(max, Math.round(+v || 0)));
    slider.value = v; number.value = v;
    state.adj[key] = v;
    scheduleRender();
  };
  slider.addEventListener('input', () => apply(slider.value));
  number.addEventListener('input', () => apply(number.value));
  number.addEventListener('blur', () => apply(number.value));
  return apply;
}
const applyScale = bindSliderNumber(el.scale, el.scaleNum, 10, 300, 'scale');
const applyPanX = bindSliderNumber(el.panX, el.panXNum, -100, 100, 'panX');
const applyPanY = bindSliderNumber(el.panY, el.panYNum, -100, 100, 'panY');
el.reset.addEventListener('click', () => { applyScale(100); applyPanX(0); applyPanY(0); });

let drag = null;
el.canvas.addEventListener('pointerdown', e => {
  if (!activeImage()) return;
  el.canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, px: state.adj.panX, py: state.adj.panY };
});
el.canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  const rect = el.canvas.getBoundingClientRect();
  applyPanX(drag.px + (e.clientX - drag.x) / rect.width * 200);
  applyPanY(drag.py + (e.clientY - drag.y) / rect.height * 200);
});
el.canvas.addEventListener('pointerup', () => drag = null);
el.canvas.addEventListener('pointercancel', () => drag = null);
el.canvas.addEventListener('wheel', e => {
  if (!activeImage()) return;
  e.preventDefault();
  applyScale(state.adj.scale + (e.deltaY < 0 ? 5 : -5));
}, { passive: false });

document.querySelectorAll('input[name=cformat]').forEach(r =>
  r.addEventListener('change', e => { state.format = e.target.value; updateFormatUI(); }));
el.quality.addEventListener('input', e => { state.quality = +e.target.value; el.qualityOut.textContent = state.quality; });
function updateFormatUI() {
  el.qualityRow.style.display = state.format === 'jpeg' ? 'block' : 'none';
}

/* -- Metadados: checkbox mestre habilita/desabilita os campos ----------------- */
function setMetaEnabled(on) {
  [el.metaIsbn, el.metaCreator, el.metaPublisher, el.metaDate, el.metaLanguage]
    .forEach(f => f.disabled = !on);
  el.metaFields.classList.toggle('is-disabled', !on);
}
el.metaEdit.addEventListener('change', e => setMetaEnabled(e.target.checked));
setMetaEnabled(false);

/* -----------------------------------------------------------------------------
   Salvar: monta a capa (se substituída), grava metadados (se habilitado),
   remonta o .zip preservando tudo o mais como estava.
   --------------------------------------------------------------------------- */
function updateSaveHint() {
  el.saveHint.textContent = state.newCoverImg
    ? 'A capa nova substitui a atual. O resto do livro sai inalterado.'
    : 'Sem substituição de capa: a atual é mantida como está.';
}

el.saveEpub.addEventListener('click', async () => {
  if (!state.entries) return;
  el.saveEpub.disabled = true;
  el.epubProgress.hidden = false;
  el.epubFill.style.width = '20%';
  let finalMsg = '';

  try {
    const { parsed, opfDoc, opfPath, byName, entries } = state;

    // -- metadados --
    if (el.metaEdit.checked) {
      writeMetadata(opfDoc, parsed, {
        isbn: el.metaIsbn.value.trim(),
        creator: el.metaCreator.value.trim(),
        publisher: el.metaPublisher.value.trim(),
        date: el.metaDate.value.trim(),
        language: el.metaLanguage.value,
      });
    }
    el.epubFill.style.width = '40%';
    await new Promise(r => setTimeout(r, 0));

    // -- capa --
    let coverPath = parsed.cover ? parsed.cover.path : null;
    if (state.newCoverImg) {
      const prof = byId(state.profileId);
      const full = outDims(prof, state.customW, state.customH, state.newCoverImg.width, state.newCoverImg.height);
      const oc = document.createElement('canvas');
      oc.width = full.w; oc.height = full.h;
      const octx = oc.getContext('2d');
      const bg = state.bgLight ? '#ffffff' : '#000000';
      paint(octx, state.newCoverImg, full.w, full.h, state.adj, bg, state.colorMode, state.dither, prof.levels || 16);

      const mime = state.format === 'png' ? 'image/png' : 'image/jpeg';
      const ext = state.format === 'png' ? 'png' : 'jpg';
      const blob = await new Promise((res, rej) => oc.toBlob(b => b ? res(b) : rej(new Error('o navegador não gerou a imagem')),
                                                              mime, state.format === 'png' ? undefined : state.quality / 100));
      const newCoverBytes = new Uint8Array(await blob.arrayBuffer());

      const oldHref = parsed.cover ? parsed.cover.href : null;
      const { path: newPath, href: newHref } = ensureCover(opfDoc, opfPath, parsed, ext, mime);
      if (coverPath && coverPath !== newPath) byName.delete(coverPath);
      byName.set(newPath, { name: newPath, bytes: newCoverBytes });
      renameCoverReferences(byName, opfPath, oldHref, newHref);
      coverPath = newPath;
    }
    el.epubFill.style.width = '65%';
    await new Promise(r => setTimeout(r, 0));

    // -- opf atualizado --
    const newOpfText = new XMLSerializer().serializeToString(opfDoc);
    byName.set(opfPath, { name: opfPath, bytes: new TextEncoder().encode(newOpfText) });

    // -- remonta na ordem original, com a capa nova no fim se foi inserida --
    const order = entries.map(e => e.name);
    if (coverPath && !order.includes(coverPath)) order.push(coverPath);

    const w = new ZipWriter();
    for (const name of order) {
      const entry = byName.get(name);
      if (!entry) continue;
      await w.addFile(name, entry.bytes, { store: name === 'mimetype' });
    }
    el.epubFill.style.width = '90%';
    await new Promise(r => setTimeout(r, 0));

    const blob = w.finish();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${state.bookName}_editado.epub`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);

    el.epubFill.style.width = '100%';
    finalMsg = 'Pronto — EPUB atualizado baixado.';
  } catch (err) {
    console.error(err);
    finalMsg = 'Não deu para gerar o EPUB: ' + err.message;
  } finally {
    el.saveEpub.disabled = false;
    el.epubProgress.hidden = true;
    el.saveHint.textContent = finalMsg;
  }
});
