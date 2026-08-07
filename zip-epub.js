/* =============================================================================
   zip-epub.js — leitura e escrita de arquivos ZIP, para manipular EPUBs.
   Tudo roda no navegador, sem bibliotecas externas.

   Um .epub é um .zip com uma regra extra: o primeiro arquivo, "mimetype",
   tem que vir sem compressão e ser literalmente a primeira coisa no arquivo.
   Fora essa regra, é um ZIP comum — por isso a leitura e a escrita aqui
   servem tanto para o .zip de capas em lote quanto para o .epub.
   ============================================================================= */
'use strict';

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

async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* -----------------------------------------------------------------------------
   Leitura — devolve, na ordem original, uma lista de { name, bytes } já
   descompactados. Não tenta ser um leitor de ZIP genérico e completo (não
   cobre ZIP64 nem criptografia): cobre o que um .epub real usa.
   --------------------------------------------------------------------------- */
async function readZip(buffer) {
  const bytes = new Uint8Array(buffer);
  const dv = new DataView(buffer);

  // Acha o End Of Central Directory a partir do fim do arquivo.
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  const minPos = Math.max(0, bytes.length - 22 - 65535);
  for (let i = bytes.length - 22; i >= minPos; i--) {
    if (dv.getUint32(i, true) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('arquivo não parece ser um .zip/.epub válido (fim do índice não encontrado)');

  const total = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);

  const entries = [];
  let p = cdOffset;
  const CD_SIG = 0x02014b50;
  for (let i = 0; i < total; i++) {
    if (dv.getUint32(p, true) !== CD_SIG) throw new Error('índice central do .zip corrompido');
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const nameBytes = bytes.subarray(p + 46, p + 46 + nameLen);
    const name = new TextDecoder('utf-8').decode(nameBytes);

    entries.push({ name, method, compSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }

  const out = [];
  for (const e of entries) {
    if (e.name.endsWith('/')) continue;   // pasta, sem conteúdo
    const lp = e.localOffset;
    const localNameLen = dv.getUint16(lp + 26, true);
    const localExtraLen = dv.getUint16(lp + 28, true);
    const dataStart = lp + 30 + localNameLen + localExtraLen;
    const raw = bytes.slice(dataStart, dataStart + e.compSize);
    const data = e.method === 8 ? await inflateRaw(raw) : raw;
    out.push({ name: e.name, bytes: data });
  }
  return out;
}

/* -----------------------------------------------------------------------------
   Escrita — recebe uma lista de { name, bytes, store? } na ordem desejada.
   store=true força "sem compressão" (usado só no mimetype do epub).
   --------------------------------------------------------------------------- */
class ZipWriter {
  constructor() {
    this.parts = [];
    this.dir = [];
    this.offset = 0;
    this.stamp = dosDateTime();
    this.enc = new TextEncoder();
  }

  async addFile(name, bytes, opts) {
    const forceStore = !!(opts && opts.store);
    const nameBytes = this.enc.encode(name);
    const crc = crc32(bytes);
    let method = 0, payload = bytes;
    if (!forceStore) {
      const packed = await deflateRaw(bytes);
      if (packed && packed.length < bytes.length) { method = 8; payload = packed; }
    }

    const lfh = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(lfh.buffer);
    dv.setUint32(0, 0x04034b50, true);
    dv.setUint16(4, 20, true);
    dv.setUint16(6, 0x0800, true);
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { crc32, readZip, ZipWriter };
}
