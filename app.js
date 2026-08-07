/* =============================================================================
   Criador de Capas para E-readers — versão web (Canvas API)
   Tudo roda no navegador. Nenhuma imagem é enviada a servidor algum.
   ============================================================================= */

'use strict';

/* -----------------------------------------------------------------------------
   1. PERFIS DOS APARELHOS
   Campos: id, name, w, h (retrato), levels (tons de cinza), color (painel
   Kaleido), group (marca, para agrupar no menu).
   Obs.: o XTEINK usa 16 níveis aqui (dá um resultado bem melhor que 4).
         Para experimentar, troque `levels` para 4 ou 8 na linha do 'XTEX34'.
   --------------------------------------------------------------------------- */
const PROFILES = [
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

  { id:'OTHER', name:'Tamanho personalizado', w:0, h:0, levels:16, color:false, group:'Outro' },
];

const FORCE_BMP = { XTEX34: true };   // perfis que exportam sempre em .bmp

const byId = id => PROFILES.find(p => p.id === id);

/* -----------------------------------------------------------------------------
   2. NÚCLEO DE PROCESSAMENTO (funções puras — sem DOM)
   --------------------------------------------------------------------------- */

// Dimensões do canvas conforme perfil + orientação.
function canvasDims(profile, orientation, customW, customH) {
  let w = profile.w, h = profile.h;
  if (profile.id === 'OTHER') { w = Math.max(1, customW|0); h = Math.max(1, customH|0); }
  const portrait = [Math.min(w, h), Math.max(w, h)];   // natural = retrato
  return orientation === 'landscape'
    ? { w: portrait[1], h: portrait[0] }
    : { w: portrait[0], h: portrait[1] };
}

// Extensão de saída: forçada em perfis especiais, senão o formato escolhido.
function outputExt(profileId, chosenFormat) {
  if (FORCE_BMP[profileId]) return 'bmp';
  return chosenFormat;   // 'png' | 'webp' | 'jpeg'
}

// Posiciona a origem no canvas destino (fit + escala + pan) e desenha.
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
    const rCover   = Math.max(cw / sw, ch / sh);
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

// Codificador de BMP 24-bit (o canvas não exporta BMP nativamente).
// Retorna os bytes crus (ArrayBuffer) — usado tanto no download único quanto no ZIP em lote.
function encodeBMPBytes(imageData) {
  const { width, height, data } = imageData;
  const rowSize = (width * 3 + 3) & ~3;          // múltiplo de 4 bytes
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = new ArrayBuffer(fileSize);
  const dv = new DataView(buf);

  // BITMAPFILEHEADER (14 bytes)
  dv.setUint8(0, 0x42); dv.setUint8(1, 0x4D);    // "BM"
  dv.setUint32(2, fileSize, true);
  dv.setUint32(6, 0, true);
  dv.setUint32(10, 54, true);                    // offset dos pixels

  // BITMAPINFOHEADER (40 bytes)
  dv.setUint32(14, 40, true);
  dv.setInt32(18, width, true);
  dv.setInt32(22, height, true);                 // positivo = bottom-up
  dv.setUint16(26, 1, true);
  dv.setUint16(28, 24, true);                    // bits por pixel
  dv.setUint32(30, 0, true);                     // sem compressão
  dv.setUint32(34, pixelArraySize, true);
  dv.setInt32(38, 2835, true);                   // ~72 DPI
  dv.setInt32(42, 2835, true);
  dv.setUint32(46, 0, true);
  dv.setUint32(50, 0, true);

  let pos = 54;
  for (let y = height - 1; y >= 0; y--) {        // linhas de baixo para cima
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      dv.setUint8(pos++, data[i + 2]);           // B
      dv.setUint8(pos++, data[i + 1]);           // G
      dv.setUint8(pos++, data[i]);               // R
    }
    pos += rowSize - width * 3;                  // padding (já é zero)
  }
  return buf;
}

// Wrapper que embrulha os bytes num Blob (usado no download de uma única capa).
function encodeBMP(imageData) {
  return new Blob([encodeBMPBytes(imageData)], { type: 'image/bmp' });
}

/* -----------------------------------------------------------------------------
   2b. GERADOR DE .ZIP — implementação própria, sem biblioteca externa
   A versão anterior baixava o JSZip de um CDN. Se o CDN estivesse bloqueado
   (bloqueador de anúncios, rede corporativa, offline, extensão de privacidade),
   a variável global JSZip nunca existia e o botão simplesmente não fazia nada.
   Agora o ZIP é montado aqui mesmo, com deflate nativo do navegador
   (CompressionStream) e queda para "armazenado, sem compressão" quando o
   navegador não tiver esse recurso.
   --------------------------------------------------------------------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(d) {
  d = d || new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time: time & 0xFFFF, date: date & 0xFFFF };
}

async function deflateRaw(bytes) {
  if (typeof CompressionStream === 'undefined') return null;
  try {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch (_) {
    return null;
  }
}

class ZipWriter {
  constructor() {
    this.parts = [];
    this.dir = [];
    this.offset = 0;
    this.stamp = dosDateTime();
    this.enc = new TextEncoder();
  }

  async addFile(name, bytes) {
    const nameBytes = this.enc.encode(name);
    const crc = crc32(bytes);
    let method = 0, payload = bytes;
    const packed = await deflateRaw(bytes);
    if (packed && packed.length < bytes.length) { method = 8; payload = packed; }

    const lfh = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(lfh.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);              // versão necessária
    dv.setUint16(6, 0x0800, true);          // nomes em UTF-8
    dv.setUint16(8, method, true);
    dv.setUint16(10, this.stamp.time, true);
    dv.setUint16(12, this.stamp.date, true);
    dv.setUint32(14, crc, true);
    dv.setUint32(18, payload.length, true);
    dv.setUint32(22, bytes.length, true);
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);
    lfh.set(nameBytes, 30);

    this.parts.push(lfh, payload);
    this.dir.push({ nameBytes, crc, method, comp: payload.length, size: bytes.length, offset: this.offset });
    this.offset += lfh.length + payload.length;
  }

  finish() {
    const cdStart = this.offset;
    for (const c of this.dir) {
      const h = new Uint8Array(46 + c.nameBytes.length);
      const dv = new DataView(h.buffer);
      dv.setUint32(0, 0x02014b50, true);
      dv.setUint16(4, 20, true);
      dv.setUint16(6, 20, true);
      dv.setUint16(8, 0x0800, true);
      dv.setUint16(10, c.method, true);
      dv.setUint16(12, this.stamp.time, true);
      dv.setUint16(14, this.stamp.date, true);
      dv.setUint32(16, c.crc, true);
      dv.setUint32(20, c.comp, true);
      dv.setUint32(24, c.size, true);
      dv.setUint16(28, c.nameBytes.length, true);
      dv.setUint32(38, 0, true);
      dv.setUint32(42, c.offset, true);
      h.set(c.nameBytes, 46);
      this.parts.push(h);
      this.offset += h.length;
    }
    const eocd = new Uint8Array(22);
    const dv = new DataView(eocd.buffer);
    dv.setUint32(0, 0x06054b50, true);
    dv.setUint16(8, this.dir.length, true);
    dv.setUint16(10, this.dir.length, true);
    dv.setUint32(12, this.offset - cdStart, true);
    dv.setUint32(16, cdStart, true);
    this.parts.push(eocd);
    return new Blob(this.parts, { type: 'application/zip' });
  }
}

// Exporta para módulos (usado só nos testes em Node).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PROFILES, canvasDims, outputExt, drawComposition,
                     quantizeGray, ditherGray, encodeBMP, encodeBMPBytes,
                     crc32, ZipWriter };
}

/* -----------------------------------------------------------------------------
   3. INTERFACE (só executa no navegador)
   --------------------------------------------------------------------------- */
if (typeof document !== 'undefined') {

  const MAX_PREVIEW = 720;   // resolução máxima do preview em foco (lado maior)
  const MAX_TILE    = 300;   // resolução máxima de cada peça do mosaico

  // Ajustes que pertencem a CADA imagem, não à fila inteira.
  const newAdj = () => ({ fit: 'cover', scale: 100, panX: 0, panY: 0 });

  const state = {
    queue: [],             // [{id, name, img, thumb, adj, tile}]
    activeId: null,        // id da imagem em foco
    view: 'focus',         // 'focus' | 'mosaic'
    // configurações globais (valem para a fila inteira)
    profileId: 'XTEX34', orientation: 'portrait',
    colorMode: 'pb', dither: true, bgLight: true,
    customW: 1072, customH: 1448,
    format: 'png', quality: 92,
  };
  let idCounter = 0;
  let seqCounter = 0;   // mantém a fila na ordem em que os arquivos foram escolhidos

  const $ = sel => document.querySelector(sel);
  const el = {
    stage:      $('#stage'),
    mosaicView: $('#mosaic-view'),
    mosaic:     $('#mosaic'),
    mosaicCount:$('#mosaic-count'),
    focusView:  $('#focus-view'),
    focusBar:   $('#focus-bar'),
    focusName:  $('#focus-name'),
    backGrid:   $('#back-grid'),
    prevImg:    $('#prev-img'),
    nextImg:    $('#next-img'),
    frame:      $('#frame'),
    canvas:     $('#preview'),
    empty:      $('#empty'),
    dims:       $('#dims'),
    file:       $('#file'),
    fileName:   $('#file-name'),
    queueWrap:  $('#queue-wrap'),
    queueList:  $('#queue-list'),
    queueCount: $('#queue-count'),
    queueClear: $('#queue-clear'),
    queueGrid:  $('#queue-grid'),
    profile:    $('#profile'),
    profileInfo:$('#profile-info'),
    custom:     $('#custom'),
    customW:    $('#custom-w'),
    customH:    $('#custom-h'),
    dither:     $('#dither'),
    ditherRow:  $('#dither-row'),
    bg:         $('#bg'),
    scope:      $('#scope'),
    scopeTag:   $('#scope-tag'),
    scopeText:  $('#scope-text'),
    adjustHint: $('#adjust-hint'),
    scale:      $('#scale'),
    panX:       $('#panx'),
    panY:       $('#pany'),
    scaleNum:   $('#scale-num'),
    panXNum:    $('#panx-num'),
    panYNum:    $('#pany-num'),
    reset:      $('#reset'),
    applyAll:   $('#apply-all'),
    format:     $('#format'),
    formatRow:  $('#format-row'),
    quality:    $('#quality'),
    qualityRow: $('#quality-row'),
    qualityOut: $('#quality-out'),
    save:       $('#save'),
    saveHint:   $('#save-hint'),
    saveAll:    $('#save-all'),
    saveAllHint:$('#save-all-hint'),
    zipProgress:$('#zip-progress'),
    zipFill:    $('#zip-fill'),
    dropzone:   $('#dropzone'),
  };
  const ctx = el.canvas.getContext('2d', { willReadFrequently: true });

  const activeItem = () => state.queue.find(q => q.id === state.activeId) || null;

  // Imagens que os controles de enquadramento/posição afetam agora:
  // no mosaico, a fila inteira; no foco, só a imagem aberta.
  function editTargets() {
    if (state.view === 'mosaic') return state.queue;
    const it = activeItem();
    return it ? [it] : [];
  }

  // Ajustes que os sliders devem exibir.
  function shownAdj() {
    const t = editTargets();
    return t.length ? t[0].adj : newAdj();
  }

  /* -- Menu de perfis, agrupado por marca ------------------------------------- */
  (function buildProfileSelect() {
    const groups = {};
    PROFILES.forEach(p => { (groups[p.group] ||= []).push(p); });
    for (const g of Object.keys(groups)) {
      const og = document.createElement('optgroup');
      og.label = g;
      groups[g].forEach(p => {
        const o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.id === 'OTHER' ? p.name : `${p.name} — ${p.w}×${p.h}`;
        og.appendChild(o);
      });
      el.profile.appendChild(og);
    }
    el.profile.value = state.profileId;
  })();

  /* -- Composição de uma imagem num canvas qualquer --------------------------- */
  function paint(targetCtx, item, cw, ch) {
    const prof = byId(state.profileId);
    const a = item.adj;
    const bg = state.bgLight ? '#ffffff' : '#000000';
    drawComposition(targetCtx, item.img, cw, ch, a.fit,
                    a.scale / 100, a.panX / 100, a.panY / 100, bg);
    if (state.colorMode === 'pb') {
      const data = targetCtx.getImageData(0, 0, cw, ch);
      state.dither ? ditherGray(data, prof.levels) : quantizeGray(data, prof.levels);
      targetCtx.putImageData(data, 0, 0);
    }
  }

  function deviceDims() {
    return canvasDims(byId(state.profileId), state.orientation, state.customW, state.customH);
  }

  /* -- Renderização do modo FOCO ---------------------------------------------- */
  let rafPending = false;
  function scheduleRender() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; render(); });
  }

  function render() {
    if (state.view === 'mosaic') { renderMosaic(); return; }
    const item = activeItem();
    if (!item) return;

    const full = deviceDims();
    const f = Math.min(1, MAX_PREVIEW / Math.max(full.w, full.h));
    const cw = Math.max(1, Math.round(full.w * f));
    const ch = Math.max(1, Math.round(full.h * f));

    el.canvas.width = cw; el.canvas.height = ch;
    paint(ctx, item, cw, ch);

    fitCanvasToStage(full.w, full.h);
    el.dims.textContent = `${full.w} × ${full.h} px`;
  }

  function fitCanvasToStage(fullW, fullH) {
    const FRAME_PADDING = 20; // 10px de cada lado, os mesmos do .frame no CSS
    const maxW = el.stage.clientWidth - 48 - FRAME_PADDING;
    const maxH = el.stage.clientHeight - (state.queue.length > 1 ? 130 : 88) - FRAME_PADDING;
    const scale = Math.min(maxW / fullW, maxH / fullH, 1.2);
    el.canvas.style.width  = Math.round(fullW * scale) + 'px';
    el.canvas.style.height = Math.round(fullH * scale) + 'px';
  }

  /* -- Renderização do MOSAICO ------------------------------------------------ */
  // O DOM das peças é remontado só quando a fila muda; os pixels são
  // redesenhados em lotes pequenos, para a interface não travar com filas longas.
  function buildMosaic() {
    el.mosaic.innerHTML = '';
    state.queue.forEach((item, i) => {
      const tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'tile' + (item.id === state.activeId ? ' active' : '');
      tile.title = `${item.name} — clique para ajustar só esta`;

      const cv = document.createElement('canvas');
      cv.className = 'tile-canvas';
      tile.appendChild(cv);
      item.tile = cv;

      const bar = document.createElement('span');
      bar.className = 'tile-name';
      bar.textContent = item.name;
      tile.appendChild(bar);

      const num = document.createElement('span');
      num.className = 'tile-index';
      num.textContent = i + 1;
      tile.appendChild(num);

      const rm = document.createElement('span');
      rm.className = 'tile-remove';
      rm.setAttribute('role', 'button');
      rm.setAttribute('aria-label', `Remover ${item.name}`);
      rm.textContent = '×';
      rm.addEventListener('click', e => { e.stopPropagation(); removeItem(item.id); });
      tile.appendChild(rm);

      tile.addEventListener('click', () => focusItem(item.id));
      el.mosaic.appendChild(tile);
    });
    el.mosaicCount.textContent = state.queue.length
      ? `${state.queue.length} ${state.queue.length > 1 ? 'capas' : 'capa'} · ${deviceDims().w}×${deviceDims().h} px`
      : '';
  }

  let mosaicToken = 0;
  function renderMosaic() {
    const token = ++mosaicToken;
    const full = deviceDims();
    const f = Math.min(1, MAX_TILE / Math.max(full.w, full.h));
    const cw = Math.max(1, Math.round(full.w * f));
    const ch = Math.max(1, Math.round(full.h * f));

    let i = 0;
    const step = () => {
      if (token !== mosaicToken) return;             // um render mais novo assumiu
      const end = Math.min(i + 2, state.queue.length);
      for (; i < end; i++) {
        const item = state.queue[i];
        if (!item.tile) continue;
        item.tile.width = cw; item.tile.height = ch;
        paint(item.tile.getContext('2d', { willReadFrequently: true }), item, cw, ch);
      }
      if (i < state.queue.length) requestAnimationFrame(step);
    };
    step();

    el.mosaicCount.textContent = `${state.queue.length} capas · ${full.w}×${full.h} px`;
  }

  /* -- Alternância entre mosaico e foco --------------------------------------- */
  function setView(mode) {
    state.view = (mode === 'mosaic' && state.queue.length >= 2) ? 'mosaic' : 'focus';
    const isMosaic = state.view === 'mosaic';

    el.mosaicView.hidden = !isMosaic;
    el.focusView.hidden = isMosaic;
    el.stage.classList.toggle('is-mosaic', isMosaic);

    if (isMosaic) buildMosaic();
    syncControls();
    updateExportUI();
    scheduleRender();
  }

  function focusItem(id) {
    const item = state.queue.find(q => q.id === id);
    if (!item) return;
    state.activeId = id;
    state.view = 'focus';

    el.mosaicView.hidden = true;
    el.focusView.hidden = false;
    el.stage.classList.remove('is-mosaic');

    const idx = state.queue.findIndex(q => q.id === id);
    el.focusBar.hidden = state.queue.length < 2;
    el.focusName.textContent = `${item.name} · ${idx + 1} de ${state.queue.length}`;
    el.fileName.textContent = `${item.name} · original ${item.img.width}×${item.img.height}`;
    el.empty.style.display = 'none';
    el.canvas.style.display = 'block';

    renderQueueUI();
    syncControls();
    updateExportUI();
    scheduleRender();
  }

  function stepFocus(delta) {
    if (state.queue.length < 2) return;
    const idx = state.queue.findIndex(q => q.id === state.activeId);
    const next = (idx + delta + state.queue.length) % state.queue.length;
    focusItem(state.queue[next].id);
  }

  /* -- Carregar imagens ------------------------------------------------------- */
  let pending = 0;
  function loadFiles(fileList) {
    const files = [...(fileList || [])].filter(f => f && f.type.startsWith('image/'));
    if (!files.length) return;
    const batchSize = files.length;
    pending += batchSize;

    files.forEach(file => {
      const id = 'im' + (++idCounter);
      const seq = ++seqCounter;
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        state.queue.push({
          id, seq, img,
          name: (file.name || 'capa').replace(/\.[^.]+$/, '') || 'capa',
          thumb: makeThumb(img),
          adj: newAdj(),
          tile: null,
        });
        // arquivos grandes decodificam depois dos pequenos: reordena pela escolha
        state.queue.sort((a, b) => a.seq - b.seq);
        if (!state.activeId) state.activeId = id;
        done();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        console.warn('Não foi possível abrir:', file.name);
        done();
      };
      img.src = url;
    });

    function done() {
      pending--;
      renderQueueUI();
      updateExportUI();
      if (pending > 0) return;
      // Lote com várias imagens abre no mosaico; imagem avulsa vai direto pro foco.
      if (batchSize >= 2 && state.queue.length >= 2) setView('mosaic');
      else if (state.view === 'mosaic') { buildMosaic(); scheduleRender(); }
      else focusItem(state.activeId);
    }
  }

  // Miniatura do trilho — gerada localmente, sem servidor.
  function makeThumb(img) {
    const maxSide = 88;
    const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.72);
  }

  function removeItem(id) {
    const idx = state.queue.findIndex(q => q.id === id);
    if (idx === -1) return;
    state.queue.splice(idx, 1);

    if (state.activeId === id) {
      state.activeId = state.queue.length
        ? state.queue[Math.min(idx, state.queue.length - 1)].id
        : null;
    }
    if (!state.queue.length) return clearQueue();

    renderQueueUI();
    updateExportUI();
    if (state.view === 'mosaic' && state.queue.length >= 2) { buildMosaic(); scheduleRender(); }
    else focusItem(state.activeId);
  }

  function clearQueue() {
    state.queue = [];
    state.activeId = null;
    state.view = 'focus';
    el.mosaicView.hidden = true;
    el.focusView.hidden = false;
    el.stage.classList.remove('is-mosaic');
    el.focusBar.hidden = true;
    el.empty.style.display = 'flex';
    el.canvas.style.display = 'none';
    el.dims.textContent = '—';
    el.fileName.textContent = 'Nenhuma imagem carregada.';
    renderQueueUI();
    syncControls();
    updateExportUI();
  }

  function renderQueueUI() {
    el.queueWrap.style.display = state.queue.length ? 'block' : 'none';
    el.queueCount.textContent = state.queue.length
      ? `${state.queue.length} ${state.queue.length > 1 ? 'imagens' : 'imagem'}`
      : '';
    el.queueGrid.hidden = state.queue.length < 2;

    el.queueList.innerHTML = '';
    state.queue.forEach(item => {
      const fig = document.createElement('div');
      fig.className = 'thumb' + (item.id === state.activeId && state.view === 'focus' ? ' active' : '');
      fig.title = item.name;

      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = item.name;
      fig.appendChild(img);

      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'thumb-remove';
      rm.setAttribute('aria-label', `Remover ${item.name}`);
      rm.textContent = '×';
      rm.addEventListener('click', e => { e.stopPropagation(); removeItem(item.id); });
      fig.appendChild(rm);

      fig.addEventListener('click', () => focusItem(item.id));
      el.queueList.appendChild(fig);
    });
  }

  /* -- Escopo dos controles de enquadramento ---------------------------------- */
  function syncControls() {
    const targets = editTargets();
    const has = targets.length > 0;
    const a = shownAdj();

    el.scale.value = el.scaleNum.value = a.scale;
    el.panX.value  = el.panXNum.value  = a.panX;
    el.panY.value  = el.panYNum.value  = a.panY;
    const fitRadio = document.querySelector(`input[name=fit][value=${a.fit}]`);
    if (fitRadio) fitRadio.checked = true;

    [el.scale, el.scaleNum, el.panX, el.panXNum, el.panY, el.panYNum, el.reset]
      .forEach(c => c.disabled = !has);
    document.querySelectorAll('input[name=fit]').forEach(r => r.disabled = !has);

    const mosaic = state.view === 'mosaic';
    el.applyAll.hidden = mosaic || state.queue.length < 2;
    el.scope.hidden = !has;
    el.scopeTag.textContent = mosaic ? 'Todas' : 'Só esta';
    el.scopeTag.classList.toggle('scope-all', mosaic);

    if (!has) {
      el.scopeText.textContent = 'Carregue uma imagem para começar.';
    } else if (mosaic) {
      el.scopeText.textContent = `Mudanças aqui valem para as ${state.queue.length} capas da fila.`;
      el.adjustHint.textContent = 'Clique numa capa do mosaico para ajustar apenas ela.';
    } else {
      const it = activeItem();
      el.scopeText.textContent = state.queue.length > 1
        ? `Mudanças aqui valem só para “${it.name}”.`
        : 'Ajustes desta imagem.';
      el.adjustHint.textContent = 'Arraste a imagem na pré-visualização e use a roda do mouse para dar zoom.';
    }
  }

  // Aplica uma mudança de ajuste às imagens do escopo atual e redesenha.
  function applyAdj(patch) {
    const targets = editTargets();
    if (!targets.length) return;
    targets.forEach(t => Object.assign(t.adj, patch));
    scheduleRender();
  }

  /* -- Eventos de arquivo ----------------------------------------------------- */
  el.file.addEventListener('change', e => { loadFiles(e.target.files); e.target.value = ''; });
  el.queueClear.addEventListener('click', clearQueue);
  el.queueGrid.addEventListener('click', () => setView('mosaic'));
  el.backGrid.addEventListener('click', () => setView('mosaic'));
  el.prevImg.addEventListener('click', () => stepFocus(-1));
  el.nextImg.addEventListener('click', () => stepFocus(1));

  [el.stage, el.dropzone].forEach(target => {
    ['dragover', 'dragenter'].forEach(ev =>
      target.addEventListener(ev, e => { e.preventDefault(); target.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach(ev =>
      target.addEventListener(ev, e => { e.preventDefault(); target.classList.remove('drag'); }));
    target.addEventListener('drop', e => loadFiles(e.dataTransfer.files));
  });

  window.addEventListener('paste', e => {
    const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
    if (item) loadFiles([item.getAsFile()]);
  });

  window.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'Escape' && state.view === 'focus') setView('mosaic');
    if (state.view === 'focus') {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stepFocus(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepFocus(1); }
    }
  });

  /* -- Perfil ----------------------------------------------------------------- */
  function onProfileChange() {
    state.profileId = el.profile.value;
    const p = byId(state.profileId);

    state.colorMode = p.color ? 'cor' : 'pb';
    document.querySelector(`input[name=color][value=${state.colorMode}]`).checked = true;

    el.custom.style.display = (p.id === 'OTHER') ? 'flex' : 'none';

    let info;
    if (p.id === 'OTHER') {
      info = 'Defina a largura e a altura em pixels.';
    } else {
      const pal = p.levels === 4 ? '4 tons de cinza'
                : p.levels === 15 ? '15 tons de cinza' : '16 tons de cinza';
      info = `Tela ${p.w}×${p.h} · ${pal}${p.color ? ' · painel colorido' : ''}`;
    }
    if (FORCE_BMP[p.id]) info += ' · exporta sempre em .bmp';
    el.profileInfo.textContent = info;

    updateColorUI();
    updateExportUI();
    scheduleRender();
  }
  el.profile.addEventListener('change', onProfileChange);

  el.customW.addEventListener('input', () => { state.customW = +el.customW.value; scheduleRender(); updateExportUI(); });
  el.customH.addEventListener('input', () => { state.customH = +el.customH.value; scheduleRender(); updateExportUI(); });

  document.querySelectorAll('input[name=orient]').forEach(r =>
    r.addEventListener('change', e => { state.orientation = e.target.value; scheduleRender(); updateExportUI(); }));

  /* -- Enquadramento e posição (escopo variável) ------------------------------ */
  document.querySelectorAll('input[name=fit]').forEach(r =>
    r.addEventListener('change', e => applyAdj({ fit: e.target.value })));

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
      slider.value = v;
      number.value = v;
      applyAdj({ [key]: v });
    };
    slider.addEventListener('input', () => apply(slider.value));
    number.addEventListener('input', () => apply(number.value));
    number.addEventListener('blur',  () => apply(number.value));
    return apply;
  }

  const applyScale = bindSliderNumber(el.scale, el.scaleNum, 10,  300, 'scale');
  const applyPanX  = bindSliderNumber(el.panX,  el.panXNum, -100, 100, 'panX');
  const applyPanY  = bindSliderNumber(el.panY,  el.panYNum, -100, 100, 'panY');

  el.reset.addEventListener('click', () => { applyScale(100); applyPanX(0); applyPanY(0); });

  el.applyAll.addEventListener('click', () => {
    const it = activeItem();
    if (!it) return;
    state.queue.forEach(q => { if (q !== it) Object.assign(q.adj, it.adj); });
    el.applyAll.textContent = 'Aplicado às ' + state.queue.length + ' imagens';
    setTimeout(() => { el.applyAll.textContent = 'Aplicar estes ajustes a todas'; }, 1600);
    scheduleRender();
  });

  /* -- Arrastar e zoom na pré-visualização em foco ---------------------------- */
  let drag = null;
  el.canvas.addEventListener('pointerdown', e => {
    if (!activeItem() || state.view !== 'focus') return;
    el.canvas.setPointerCapture(e.pointerId);
    const a = activeItem().adj;
    drag = { x: e.clientX, y: e.clientY, px: a.panX, py: a.panY };
  });
  el.canvas.addEventListener('pointermove', e => {
    if (!drag) return;
    const rect = el.canvas.getBoundingClientRect();
    applyPanX(drag.px + (e.clientX - drag.x) / rect.width  * 200);
    applyPanY(drag.py + (e.clientY - drag.y) / rect.height * 200);
  });
  el.canvas.addEventListener('pointerup',     () => drag = null);
  el.canvas.addEventListener('pointercancel', () => drag = null);

  el.canvas.addEventListener('wheel', e => {
    if (!activeItem() || state.view !== 'focus') return;
    e.preventDefault();
    applyScale(activeItem().adj.scale + (e.deltaY < 0 ? 5 : -5));
  }, { passive: false });

  /* -- Formato e estado dos botões de exportação ------------------------------ */
  el.format.addEventListener('change', e => { state.format = e.target.value; updateExportUI(); });
  el.quality.addEventListener('input', e => { state.quality = +e.target.value; el.qualityOut.textContent = state.quality; });

  function updateExportUI() {
    const forced = FORCE_BMP[state.profileId];
    el.format.disabled = !!forced;
    const fmt = forced ? 'bmp' : state.format;
    const showQ = !forced && (fmt === 'jpeg' || fmt === 'webp');
    el.qualityRow.style.display = showQ ? 'block' : 'none';

    const n = state.queue.length;
    const inFocus = state.view === 'focus' && !!activeItem();

    el.save.disabled = !inFocus;
    el.save.textContent = 'Salvar capa';
    el.saveHint.textContent = !n
      ? 'Carregue uma imagem para salvar.'
      : !inFocus
        ? 'Abra uma capa do mosaico para salvar só ela.'
        : forced
          ? 'Este perfil exporta sempre em BMP 24-bit.'
          : `Saída em ${fmt.toUpperCase()}.`;

    el.saveAll.disabled = n < 2;
    el.saveAll.textContent = n >= 2 ? `Baixar as ${n} capas (.zip)` : 'Baixar todas (.zip)';
    el.saveAllHint.textContent = n < 2
      ? 'Carregue 2 ou mais imagens para exportar em lote.'
      : 'Cada capa sai com os seus próprios ajustes.';
  }

  /* -- Montagem em resolução real --------------------------------------------- */
  function renderExportCanvas(item) {
    const full = deviceDims();
    const oc = document.createElement('canvas');
    oc.width = full.w; oc.height = full.h;
    const octx = oc.getContext('2d', { willReadFrequently: true });
    paint(octx, item, full.w, full.h);
    return { oc, octx, full };
  }

  function mimeFor(ext) {
    return ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  }

  async function canvasBytes(oc, octx, full, ext) {
    if (ext === 'bmp') {
      return new Uint8Array(encodeBMPBytes(octx.getImageData(0, 0, full.w, full.h)));
    }
    const blob = await new Promise((res, rej) => {
      oc.toBlob(b => b ? res(b) : rej(new Error('o navegador não gerou a imagem')),
                mimeFor(ext), ext === 'png' ? undefined : state.quality / 100);
    });
    return new Uint8Array(await blob.arrayBuffer());
  }

  function triggerDownload(blobOrUrl, filename) {
    const url = typeof blobOrUrl === 'string' ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (typeof blobOrUrl !== 'string') setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* -- Salvar a capa em foco --------------------------------------------------- */
  // Síncrono do clique até o a.click() para PNG/WebP/JPEG: alguns navegadores
  // descartam downloads disparados muito depois do gesto do usuário.
  el.save.addEventListener('click', () => {
    const item = activeItem();
    if (!item) return;
    el.save.disabled = true; el.save.textContent = 'Gerando…';
    try {
      const { oc, octx, full } = renderExportCanvas(item);
      const ext = outputExt(state.profileId, state.format);
      if (ext === 'bmp') {
        triggerDownload(encodeBMP(octx.getImageData(0, 0, full.w, full.h)),
                        `${item.name}_${state.profileId}.bmp`);
      } else {
        const href = oc.toDataURL(mimeFor(ext), ext === 'png' ? undefined : state.quality / 100);
        triggerDownload(href, `${item.name}_${state.profileId}.${ext}`);
      }
    } catch (err) {
      console.error(err);
      updateExportUI();
      el.saveHint.textContent = 'Não deu para gerar o arquivo: ' + err.message;
      return;
    }
    updateExportUI();
  });

  /* -- Baixar a fila inteira em .zip ------------------------------------------ */
  el.saveAll.addEventListener('click', async () => {
    if (state.queue.length < 2 || el.saveAll.disabled) return;

    el.saveAll.disabled = true;
    el.zipProgress.hidden = false;
    el.zipFill.style.width = '0%';
    let finalMsg = '';

    try {
      const zip = new ZipWriter();
      const ext = outputExt(state.profileId, state.format);
      const used = new Set();
      const total = state.queue.length;

      for (let i = 0; i < total; i++) {
        const item = state.queue[i];
        el.saveAll.textContent = `Preparando ${i + 1} de ${total}…`;
        el.zipFill.style.width = Math.round(i / total * 100) + '%';
        await new Promise(r => setTimeout(r, 0));   // deixa a interface respirar

        const { oc, octx, full } = renderExportCanvas(item);
        const bytes = await canvasBytes(oc, octx, full, ext);

        let name = `${item.name}_${state.profileId}.${ext}`;
        let n = 2;
        while (used.has(name)) name = `${item.name}_${state.profileId}_${n++}.${ext}`;
        used.add(name);

        await zip.addFile(name, bytes);
        oc.width = oc.height = 0;                   // libera a memória do canvas
      }

      el.saveAll.textContent = 'Fechando o arquivo…';
      el.zipFill.style.width = '100%';
      triggerDownload(zip.finish(), `capas_${state.profileId}.zip`);
      finalMsg = `Pronto: ${total} capas no .zip.`;
    } catch (err) {
      finalMsg = 'Não deu para montar o .zip: ' + err.message;
      console.error(err);
    } finally {
      el.zipProgress.hidden = true;
      updateExportUI();
      if (finalMsg) el.saveAllHint.textContent = finalMsg;
    }
  });

  /* -- Inicialização ----------------------------------------------------------- */
  window.addEventListener('resize', () => { if (state.queue.length) scheduleRender(); });
  onProfileChange();
  updateColorUI();
  syncControls();
  updateExportUI();
}
