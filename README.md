# Capa e metadados de EPUB

Ferramenta de página única para trocar (ou inserir) a capa de um arquivo
`.epub` e ajustar seus metadados básicos — ISBN, autor, editora, data de
publicação e idioma — direto no navegador, sem instalar nada.

**Roda 100% no navegador.** O EPUB é lido, editado e remontado inteiramente
na máquina de quem usa. Nenhum arquivo é enviado a servidor algum. A página
não carrega nenhum script externo: sem CDN, sem rastreadores, sem
dependências.

Funciona com **EPUB2 e EPUB3**. Tudo o que a ferramenta não toca —
capítulos, fontes, estilos, o resto dos metadados — sai do arquivo
exatamente como entrou.

---

## Índice

1. [O que o programa faz](#o-que-o-programa-faz)
2. [Como usar — passo a passo](#como-usar--passo-a-passo)
3. [Metadados editáveis](#metadados-editáveis)
4. [Perguntas frequentes](#perguntas-frequentes)
5. [Limitações conhecidas](#limitações-conhecidas)
6. [Estrutura do projeto](#estrutura-do-projeto)
7. [Publicar no GitHub Pages](#publicar-no-github-pages)

---

## O que o programa faz

- Lê um `.epub`, acha a capa atual (se houver) e mostra ela na tela
- Permite **substituir a capa** por uma imagem nova, com os mesmos ajustes
  de enquadramento do [criador de capas para
  e-readers](https://ciceroog.github.io/): preencher, encaixar ou esticar,
  escala, posição e um perfil de tela (Kindle, Kobo, reMarkable, XTEINK ou
  tamanho personalizado)
- Se o EPUB **não tiver nenhuma capa**, insere uma do zero, já declarada do
  jeito que os leitores de e-book esperam (compatível com EPUB2 e EPUB3 ao
  mesmo tempo)
- Corrige automaticamente qualquer outra página do próprio EPUB que
  referencie o nome do arquivo da capa (comum em livros gerados pelo
  Calibre, que costumam ter uma página `cover.xhtml` separada)
- Mostra os **metadados básicos já preenchidos**, lidos do próprio arquivo:
  ISBN, autor, editora, data de publicação e idioma
- Só edita metadados se a caixa **"Editar metadados"** estiver marcada —
  campo deixado como estava não é alterado
- Idioma sai gravado no código de 2 letras (ISO 639-1) — o formato mais
  amplamente aceito por leitores de e-book, mais compatível que variantes
  regionais (`pt-BR`) ou códigos de 3 letras (`por`)
- Baixa um `.epub` novo, pronto — a montagem do arquivo (incluindo a regra
  do `mimetype` sem compressão, que faz um `.epub` ser reconhecido como tal)
  também é feita pelo próprio `zip-epub.js`, sem biblioteca externa

---

## Como usar — passo a passo

### Passo 1 — Abrir o EPUB
Clique em **"Abrir EPUB"** ou solte o arquivo na área de pré-visualização.
Ele é lido inteiro ali mesmo; a capa atual (se existir) já aparece na tela.

### Passo 2 — Capa
Se quiser trocar a capa, clique em **"Substituir capa"** (ou **"Enviar
capa"**, se o livro ainda não tiver nenhuma) e escolha uma imagem. Os
controles de tamanho e enquadramento aparecem só depois de enviar a imagem
nova — a capa original, enquanto não for substituída, é mantida exatamente
como está no arquivo. Dá pra desfazer a substituição a qualquer momento com
**"Desfazer, manter a capa original"**.

### Passo 3 — Tamanho e enquadramento (só se substituiu a capa)
- **Tamanho original da imagem** — não redimensiona.
- Ou escolha um perfil de e-reader — a imagem sai no tamanho exato da tela
  daquele aparelho.
- **Preencher** cobre o quadro inteiro (corta o excedente); **Encaixar**
  mostra a imagem inteira com bordas; **Esticar** força as dimensões, pode
  distorcer.
- Ajuste fino com os sliders de escala e posição, ou arraste a imagem
  direto na pré-visualização e use a roda do mouse pra dar zoom.
- Formato de saída: JPEG (com controle de qualidade) ou PNG.

### Passo 4 — Metadados
Marque **"Editar metadados"** para habilitar os campos. Eles já vêm
preenchidos com o que estava no arquivo — mude só o que quiser; o que não
for tocado permanece igual.

### Passo 5 — Salvar
Clique em **"Baixar EPUB atualizado"**. O download começa com o nome do
livro original, seguido de `_editado.epub`.

---

## Metadados editáveis

| Campo | Onde fica gravado no EPUB |
|---|---|
| ISBN | `<dc:identifier>` com `opf:scheme="ISBN"` (ou `urn:isbn:`, se era assim que já estava) |
| Autor | `<dc:creator>` |
| Editora | `<dc:publisher>` |
| Publicação | `<dc:date>` |
| Idioma | `<dc:language>`, código ISO 639-1 de 2 letras |

Esses são os campos que também aparecem no Calibre. **Pontuação** e
**Etiquetas**, do Calibre, não ficam dentro do arquivo `.epub` — vivem no
banco de dados interno do próprio Calibre (`metadata.db`) e por isso não
aparecem aqui.

---

## Perguntas frequentes

**Preciso ter o Calibre instalado?**
Não. É só um site, roda em qualquer navegador atual (Chrome, Firefox,
Edge, Safari).

**Funciona com qualquer EPUB?**
Funciona com EPUB2 e EPUB3, os dois padrões em uso hoje. Arquivos muito
antigos ou fora do padrão podem não ser reconhecidos — a ferramenta avisa
na tela se não conseguir abrir o arquivo, em vez de travar em silêncio.

**A capa some se eu editar só os metadados?**
Não. Só a capa nova (a que você enviou depois de abrir o livro) é
processada; se você não enviar nenhuma, a capa original é mantida como
está, bytes idênticos.

**E se o EPUB não tiver capa nenhuma?**
A ferramenta avisa e permite enviar uma — ela entra declarada tanto no
padrão EPUB2 (`<meta name="cover">`) quanto no EPUB3
(`properties="cover-image"`), pra funcionar no maior número possível de
leitores.

---

## Limitações conhecidas

- Não gera nem edita uma página de rosto (`cover.xhtml`) nova — se o EPUB
  já tinha uma, ela é mantida e a referência à imagem é corrigida
  automaticamente; se não tinha, a capa entra só como imagem, sem página
  dedicada (a maioria dos leitores já reconhece a imagem sozinha)
- Só edita os cinco campos listados acima — título, sinopse, série e outros
  metadados do `.opf` não são tocados nem mostrados
- Arquivos muito grandes (EPUBs com muitas imagens ou fontes embutidas)
  podem demorar alguns segundos a mais para processar, já que o arquivo
  inteiro é descompactado e remontado no navegador

---

## Estrutura do projeto

```
epub-wallpaper-and-metadata/
├── index.html      ← estrutura da página
├── style.css       ← aparência (compartilhado em espírito com o criador de capas)
├── epub-capa.css   ← estilos específicos desta ferramenta
├── epub-capa.js     ← interface: upload, ajuste de capa, formulário de metadados
├── epub-opf.js      ← leitura/gravação do .opf: metadados e localização da capa
└── zip-epub.js       ← leitura/escrita de .zip (o "miolo" de um .epub), sem biblioteca externa
```

---

## Publicar no GitHub Pages

Se este repositório ainda não está publicado:

1. No repositório, vá em **Settings → Pages**.
2. Em **Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha `main` (ou a branch onde estão os arquivos) e a
   pasta `/ (root)`. Clique em **Save**.
4. Depois de alguns minutos, o site fica disponível em
   `https://<seu-usuário>.github.io/<nome-do-repositório>/` — no caso deste
   projeto, <https://ciceroog.github.io/epub-wallpaper-and-metadata>.

Para atualizar depois de qualquer mudança nos arquivos:

1. Suba os arquivos alterados na raiz do repositório (**Add file → Upload
   files**, ou `git push`, se estiver usando linha de comando).
2. Espere o deploy automático — acompanhe o progresso na aba **Actions** do
   repositório, costuma levar de 30 segundos a 2 minutos.
3. Recarregue a página ignorando o cache (**Ctrl+Shift+R** ou **Cmd+Shift+R**
   no Mac), já que o GitHub Pages manda os arquivos com alguns minutos de
   cache no navegador.

---

*Reaproveita, em parte, o mecanismo de ajuste de imagem e a lista de
perfis de e-reader do [criador de capas para
e-readers](https://ciceroog.github.io/).*
