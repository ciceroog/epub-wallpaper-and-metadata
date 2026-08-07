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

  // --- série: calibre:series (EPUB2, mais universal) primeiro; se não achar,
  // tenta o padrão "oficial" do EPUB3 (belongs-to-collection) ---
  const metas = [...metadata.getElementsByTagName('meta')];
  let series = '', seriesIndex = '';
  const calSeries = metas.find(m => (m.getAttribute('name') || '').toLowerCase() === 'calibre:series');
  const calIndex = metas.find(m => (m.getAttribute('name') || '').toLowerCase() === 'calibre:series_index');
  if (calSeries) series = calSeries.getAttribute('content') || '';
  if (calIndex) seriesIndex = calIndex.getAttribute('content') || '';
  if (!series) {
    const collMeta = metas.find(m => m.getAttribute('property') === 'belongs-to-collection');
    if (collMeta) {
      const id = collMeta.getAttribute('id');
      const typeMeta = id && metas.find(m => m.getAttribute('refines') === '#' + id && m.getAttribute('property') === 'collection-type');
      const isSeries = !typeMeta || firstText(typeMeta).toLowerCase() === 'series';
      if (isSeries) {
        series = firstText(collMeta);
        if (!seriesIndex) {
          const posMeta = id && metas.find(m => m.getAttribute('refines') === '#' + id && m.getAttribute('property') === 'group-position');
          if (posMeta) seriesIndex = firstText(posMeta);
        }
      }
    }
  }

  return {
    isEpub3: pkg.getAttribute('version') === '3.0' || pkg.getAttribute('version') === '3.0.1',
    cover,
    title: firstText(titleEl),
    creator: firstText(creatorEl),
    publisher: firstText(publisherEl),
    language: firstText(languageEl),
    date: firstText(dateEl),
    isbn,
    series, seriesIndex,
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
  if (changes.series)    writeSeries(opfDoc, metadata, changes.series, changes.seriesIndex);
}

// Grava a série nos dois padrões em uso: calibre:series / calibre:series_index
// (EPUB2, o mais universalmente reconhecido, inclusive pelo próprio Calibre) e
// belongs-to-collection (o padrão "oficial" do EPUB3) — igual foi feito com a
// capa, declarando dos dois jeitos pra máxima compatibilidade entre leitores.
function writeSeries(opfDoc, metadata, series, seriesIndex) {
  const metasNow = () => [...metadata.getElementsByTagName('meta')];

  // --- calibre:series / calibre:series_index ---
  let calSeries = metasNow().find(m => (m.getAttribute('name') || '').toLowerCase() === 'calibre:series');
  if (!calSeries) {
    calSeries = opfDoc.createElementNS(NS.opf, 'meta');
    calSeries.setAttribute('name', 'calibre:series');
    metadata.appendChild(calSeries);
  }
  calSeries.setAttribute('content', series);

  if (seriesIndex) {
    let calIndex = metasNow().find(m => (m.getAttribute('name') || '').toLowerCase() === 'calibre:series_index');
    if (!calIndex) {
      calIndex = opfDoc.createElementNS(NS.opf, 'meta');
      calIndex.setAttribute('name', 'calibre:series_index');
      metadata.appendChild(calIndex);
    }
    calIndex.setAttribute('content', seriesIndex);
  }

  // --- belongs-to-collection (EPUB3) ---
  let collMeta = metasNow().find(m => m.getAttribute('property') === 'belongs-to-collection');
  let collId;
  if (!collMeta) {
    collMeta = opfDoc.createElementNS(NS.opf, 'meta');
    collId = 'series-title';
    collMeta.setAttribute('id', collId);
    collMeta.setAttribute('property', 'belongs-to-collection');
    metadata.appendChild(collMeta);
  } else {
    collId = collMeta.getAttribute('id');
    if (!collId) { collId = 'series-title'; collMeta.setAttribute('id', collId); }
  }
  collMeta.textContent = series;

  let typeMeta = metasNow().find(m => m.getAttribute('refines') === '#' + collId && m.getAttribute('property') === 'collection-type');
  if (!typeMeta) {
    typeMeta = opfDoc.createElementNS(NS.opf, 'meta');
    typeMeta.setAttribute('refines', '#' + collId);
    typeMeta.setAttribute('property', 'collection-type');
    metadata.appendChild(typeMeta);
  }
  typeMeta.textContent = 'series';

  if (seriesIndex) {
    let posMeta = metasNow().find(m => m.getAttribute('refines') === '#' + collId && m.getAttribute('property') === 'group-position');
    if (!posMeta) {
      posMeta = opfDoc.createElementNS(NS.opf, 'meta');
      posMeta.setAttribute('refines', '#' + collId);
      posMeta.setAttribute('property', 'group-position');
      metadata.appendChild(posMeta);
    }
    posMeta.textContent = seriesIndex;
  }
}

/* -----------------------------------------------------------------------------
   Troca ou inserção da capa no manifest. Devolve { path, href } — o caminho
   dentro do zip e o href tal como escrito no manifest (para atualizar outras
   referências, como a página cover.xhtml que aponta pro nome do arquivo).
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
      return { path: resolveHref(opfPath, newHref), href: newHref };
    }
    return { path: parsed.cover.path, href: parsed.cover.href };
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

  return { path: dir + href, href };
}

/* -----------------------------------------------------------------------------
   Quando o nome do arquivo da capa muda (porque o formato de exportação é
   diferente do original), outros arquivos do próprio EPUB podem apontar pro
   nome antigo — o exemplo mais comum é uma página "cover.xhtml" com
   <img src="cover.png">, gerada por quase todo software de EPUB (Calibre
   inclusive). Sem isso, a página de capa do livro fica com uma imagem
   quebrada, mesmo com o manifest apontando certo pro arquivo novo.

   Aqui a gente varre os arquivos de texto do EPUB (menos o .opf, que é
   regravado à parte) e troca as ocorrências do href antigo pelo novo, nas
   formas mais comuns de aparecer numa referência relativa.
   --------------------------------------------------------------------------- */
function renameCoverReferences(byName, opfPath, oldHref, newHref) {
  if (!oldHref || !newHref || oldHref === newHref) return;
  const oldBase = oldHref.split('/').pop();
  const newBase = newHref.split('/').pop();
  const pairs = [
    [oldHref, newHref],
    ['./' + oldHref, './' + newHref],
    ['../' + oldHref, '../' + newHref],
    [oldBase, newBase],
  ];

  for (const [name, entry] of byName) {
    if (name === opfPath) continue;                  // o .opf é regravado à parte
    if (!/\.(xhtml|html|htm|ncx|css|svg|opf)$/i.test(name)) continue;
    let text;
    try { text = new TextDecoder('utf-8').decode(entry.bytes); } catch (_) { continue; }
    let newText = text, changed = false;
    for (const [from, to] of pairs) {
      if (from && newText.includes(from)) { newText = newText.split(from).join(to); changed = true; }
    }
    if (changed) entry.bytes = new TextEncoder().encode(newText);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NS, findOpfPath, resolveHref, readOpf, writeMetadata, ensureCover, renameCoverReferences, dirOf };
}
