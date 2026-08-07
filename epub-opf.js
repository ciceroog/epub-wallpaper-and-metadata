/* =============================================================================
   epub-opf.js — leitura e gravação do "miolo" de metadados de um EPUB (o
   arquivo .opf) e localização/troca da imagem de capa.
   Funções puras: recebem o Document já parseado (DOMParser) e devolvem dados
   ou mutam o Document, sem tocar em DOM da página nem em rede.
   ============================================================================= */
'use strict';

const NS = {
  container: 'urn:oasis:names:tc:opendocument:xmlns:container',
  opf: 'http://www.idpf.org/2007/opf',
  dc:  'http://purl.org/dc/elements/1.1/',
};

// Acha o caminho do .opf dentro do zip, a partir do META-INF/container.xml.
function findOpfPath(containerXmlText) {
  const doc = new DOMParser().parseFromString(containerXmlText, 'application/xml');
  if (doc.querySelector('parsererror')) throw new Error('META-INF/container.xml inválido');
  const rootfile = doc.getElementsByTagNameNS(NS.container, 'rootfile')[0]
                 || doc.getElementsByTagName('rootfile')[0];
  if (!rootfile) throw new Error('container.xml não aponta para nenhum arquivo .opf');
  const path = rootfile.getAttribute('full-path');
  if (!path) throw new Error('container.xml sem o caminho do .opf');
  return path;
}

function dirOf(path) {
  const i = path.lastIndexOf('/');
  return i === -1 ? '' : path.slice(0, i + 1);
}

// Resolve um href do manifest (relativo ao .opf) para um caminho dentro do zip.
function resolveHref(opfPath, href) {
  const base = dirOf(opfPath);
  // hrefs de manifest não costumam ter '../', mas resolvemos mesmo assim.
  const parts = (base + href).split('/');
  const out = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue;
    if (part === '..') out.pop(); else out.push(part);
  }
  return out.join('/');
}

function firstText(el) {
  return el ? (el.textContent || '').trim() : '';
}

function dcFirst(metadataEl, localName) {
  const list = metadataEl.getElementsByTagNameNS(NS.dc, localName);
  return list.length ? list[0] : null;
}

/* -----------------------------------------------------------------------------
   Leitura: acha a imagem de capa (EPUB2 e EPUB3) e os metadados básicos.
   --------------------------------------------------------------------------- */
function readOpf(opfDoc, opfPath) {
  const pkg = opfDoc.documentElement;
  const metadata = pkg.getElementsByTagNameNS(NS.opf, 'metadata')[0]
                 || pkg.getElementsByTagName('metadata')[0];
  const manifest = pkg.getElementsByTagNameNS(NS.opf, 'manifest')[0]
                 || pkg.getElementsByTagName('manifest')[0];
  if (!metadata || !manifest) throw new Error('.opf sem <metadata> ou <manifest>');

  const items = [...manifest.getElementsByTagName('item')];
  const itemById = id => items.find(it => it.getAttribute('id') === id);

  // --- capa: EPUB3 primeiro (properties="cover-image"), senão EPUB2 (meta name="cover") ---
  let coverItem = items.find(it => (it.getAttribute('properties') || '').split(/\s+/).includes('cover-image'));
  if (!coverItem) {
    const metaCover = [...metadata.getElementsByTagName('meta')]
      .find(m => (m.getAttribute('name') || '').toLowerCase() === 'cover');
    if (metaCover) coverItem = itemById(metaCover.getAttribute('content'));
  }
  const cover = coverItem ? {
    id: coverItem.getAttribute('id'),
    href: coverItem.getAttribute('href'),
    path: resolveHref(opfPath, coverItem.getAttribute('href')),
    mediaType: coverItem.getAttribute('media-type') || '',
  } : null;

  // --- metadados básicos ---
  const titleEl = dcFirst(metadata, 'title');
  const creatorEl = dcFirst(metadata, 'creator');
  const publisherEl = dcFirst(metadata, 'publisher');
  const languageEl = dcFirst(metadata, 'language');
  const dateEl = dcFirst(metadata, 'date');

  const identifiers = [...metadata.getElementsByTagNameNS(NS.dc, 'identifier')];
  const isbnEl = identifiers.find(el => {
    const scheme = (el.getAttributeNS(NS.opf, 'scheme') || el.getAttribute('opf:scheme') || '').toLowerCase();
    const text = firstText(el).toLowerCase();
    return scheme === 'isbn' || /^urn:isbn:/.test(text) || /^isbn[:\s]/.test(text);
  }) || null;
  let isbn = '';
  if (isbnEl) isbn = firstText(isbnEl).replace(/^urn:isbn:/i, '').replace(/^isbn[:\s]*/i, '').trim();

  return {
    isEpub3: pkg.getAttribute('version') === '3.0' || pkg.getAttribute('version') === '3.0.1',
    cover,
    title: firstText(titleEl),
    creator: firstText(creatorEl),
    publisher: firstText(publisherEl),
    language: firstText(languageEl),
    date: firstText(dateEl),
    isbn,
    manifest, metadata,   // devolvidos para a gravação reaproveitar os nós
  };
}

/* -----------------------------------------------------------------------------
   Gravação de metadados: atualiza os nós existentes ou cria os que faltarem,
   preservando o prefixo dc: já usado no arquivo.
   --------------------------------------------------------------------------- */
function dcPrefix(opfDoc) {
  const any = opfDoc.getElementsByTagNameNS(NS.dc, '*')[0];
  return any ? (any.prefix || 'dc') : 'dc';
}

function setDcValue(opfDoc, metadataEl, localName, value, attrs) {
  let el = dcFirst(metadataEl, localName);
  if (!value) return el; // não apaga campos existentes se o campo ficou vazio
  if (!el) {
    const prefix = dcPrefix(opfDoc);
    el = opfDoc.createElementNS(NS.dc, `${prefix}:${localName}`);
    metadataEl.appendChild(el);
  }
  el.textContent = value;
  if (attrs) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function writeMetadata(opfDoc, parsed, changes) {
  const { metadata } = parsed;
  if (changes.isbn) {
    let el = null;
    const identifiers = [...metadata.getElementsByTagNameNS(NS.dc, 'identifier')];
    el = identifiers.find(e => {
      const scheme = (e.getAttributeNS(NS.opf, 'scheme') || e.getAttribute('opf:scheme') || '').toLowerCase();
      const text = firstText(e).toLowerCase();
      return scheme === 'isbn' || /^urn:isbn:/.test(text) || /^isbn[:\s]/.test(text);
    });
    if (el) {
      // preserva o formato encontrado (com ou sem prefixo urn:isbn:)
      const hadUrn = /^urn:isbn:/i.test(firstText(el));
      el.textContent = hadUrn ? `urn:isbn:${changes.isbn}` : changes.isbn;
    } else {
      const prefix = dcPrefix(opfDoc);
      el = opfDoc.createElementNS(NS.dc, `${prefix}:identifier`);
      el.setAttributeNS(NS.opf, 'opf:scheme', 'ISBN');
      el.textContent = changes.isbn;
      metadata.appendChild(el);
    }
  }
  if (changes.creator)   setDcValue(opfDoc, metadata, 'creator', changes.creator);
  if (changes.publisher) setDcValue(opfDoc, metadata, 'publisher', changes.publisher);
  if (changes.date)      setDcValue(opfDoc, metadata, 'date', changes.date);
  if (changes.language)  setDcValue(opfDoc, metadata, 'language', changes.language);
}

/* -----------------------------------------------------------------------------
   Troca ou inserção da capa no manifest. Devolve o caminho (dentro do zip)
   onde os novos bytes da imagem devem ser gravados.
   --------------------------------------------------------------------------- */
function ensureCover(opfDoc, opfPath, parsed, newExt, newMediaType) {
  const { manifest, metadata } = parsed;

  if (parsed.cover) {
    // Já existe capa: troca só a extensão/tipo se o formato mudou, mantém o resto.
    const item = [...manifest.getElementsByTagName('item')]
      .find(it => it.getAttribute('id') === parsed.cover.id);
    if (!item) throw new Error('item de manifest da capa não encontrado');
    if (newExt) {
      const newHref = parsed.cover.href.replace(/\.[^./]+$/, '') + '.' + newExt;
      item.setAttribute('href', newHref);
      item.setAttribute('media-type', newMediaType);
      return resolveHref(opfPath, newHref);
    }
    return parsed.cover.path;
  }

  // Sem capa: cria um item novo e declara nos dois padrões (EPUB2 + EPUB3),
  // sem exigir uma página .xhtml de capa — a maioria dos leitores já reconhece
  // a imagem sozinha.
  const dir = dirOf(opfPath);
  const href = 'cover-inserida.' + newExt;
  const id = 'cover-img-inserida';

  const item = opfDoc.createElementNS(NS.opf, 'item');
  item.setAttribute('id', id);
  item.setAttribute('href', href);
  item.setAttribute('media-type', newMediaType);
  item.setAttribute('properties', 'cover-image');
  manifest.appendChild(item);

  const meta = opfDoc.createElementNS(NS.opf, 'meta');
  meta.setAttribute('name', 'cover');
  meta.setAttribute('content', id);
  metadata.appendChild(meta);

  return dir + href;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NS, findOpfPath, resolveHref, readOpf, writeMetadata, ensureCover, dirOf };
}
