# Capas para E-readers — versão web

Ferramenta de página única para transformar imagens em capas de e-book
compatíveis com a tela de dezenas de e-readers (Kindle, Kobo, reMarkable e
XTEINK). Converte para preto e branco na paleta de tons de cinza do aparelho
(com ou sem dithering) ou mantém colorido, com pré-visualização ao vivo e
ajustes de orientação, enquadramento, posição e escala.

**Roda 100% no navegador.** Nenhuma imagem é enviada para servidor algum —
todo o processamento (composição, conversão e exportação) acontece
localmente, na máquina de quem usa. A página não carrega nenhum script
externo: sem CDN, sem rastreadores, sem dependências.

---

## Índice

1. [O que o programa faz](#o-que-o-programa-faz)
2. [Mosaico e modo foco](#mosaico-e-modo-foco)
3. [Como usar — passo a passo](#como-usar--passo-a-passo)
4. [Aparelhos suportados](#aparelhos-suportados)
5. [Preto e branco x colorido](#preto-e-branco-x-colorido)
6. [Formato de saída](#formato-de-saída)
7. [Perguntas frequentes](#perguntas-frequentes)
8. [Limitações conhecidas](#limitações-conhecidas)
9. [Estrutura do projeto](#estrutura-do-projeto)

---

## O que o programa faz

- Enquadra imagens para a resolução exata da tela do e-reader escolhido
- **Aceita várias imagens de uma vez** — arraste um lote inteiro, cole ou
  selecione múltiplos arquivos; todas aparecem num **mosaico** com a
  pré-visualização já convertida
- **Ajuste individual por imagem** — clique numa capa do mosaico para abri-la
  em foco e mexer só nela, ou mexa nos controles com o mosaico aberto para
  aplicar a mudança à fila inteira
- Converte para **preto e branco** usando a paleta de tons de cinza do painel
  (4, 15 ou 16 níveis) — com ou sem *dithering* (Floyd–Steinberg)
- Mantém **colorido** para os painéis Kaleido (Colorsoft, Clara Colour etc.)
- Aceita **arrastar-e-soltar** ou **colar (Ctrl+V)**
- No modo foco, deixa **arrastar a imagem na pré-visualização** para
  reposicionar e usar a **roda do mouse** para dar zoom
- Exporta a capa em foco em **PNG, WebP ou JPEG** — exceto o perfil
  XTEINK X3/X4, sempre em **BMP** — ou **baixa a fila inteira num .zip**,
  respeitando os ajustes próprios de cada imagem

---

## Mosaico e modo foco

O palco tem dois estados, e é o escopo dos controles que muda entre eles:

| | Mosaico | Foco |
|---|---|---|
| Quando aparece | ao soltar 2 ou mais imagens de uma vez | ao clicar numa capa, ou com uma imagem só |
| O que mostra | todas as capas convertidas, lado a lado | uma capa grande, na moldura do aparelho |
| Enquadramento, escala e posição | valem para **todas** as imagens da fila | valem **só** para a imagem aberta |
| Etiqueta no painel | `TODAS` | `SÓ ESTA` |

Atalhos no modo foco: **←** e **→** trocam de imagem, **Esc** volta ao
mosaico. O botão **"Aplicar estes ajustes a todas"** copia o enquadramento da
imagem aberta para a fila inteira.

Aparelho de destino, orientação, cor, dithering e cor das bordas são sempre
globais — valem para a fila toda nos dois modos.

---

## Como usar — passo a passo

### Passo 1 — Abrir as imagens
Clique em **"Abrir imagens"**, arraste os arquivos até a área de
pré-visualização, ou cole com **Ctrl+V**. Um lote com duas ou mais imagens
abre direto no mosaico; uma imagem sozinha abre em foco. A fila mantém a
ordem em que os arquivos foram escolhidos.

### Passo 2 — Escolher o aparelho de destino
Selecione o e-reader na lista (agrupada por marca). A resolução da tela e a
paleta de tons de cinza são aplicadas automaticamente. Se o seu aparelho não
estiver na lista, escolha **"Tamanho personalizado"** e digite largura e
altura. A orientação (retrato ou paisagem) fica logo abaixo.

### Passo 3 — Enquadramento e posição
- **Preencher** — a imagem cobre toda a tela, cortando o excedente (padrão).
- **Encaixar** — a imagem inteira aparece, com bordas (letterbox).
- **Esticar** — força as dimensões exatas, podendo distorcer.

Depois use os sliders (ou os campos numéricos ao lado) de **escala**,
**posição horizontal** e **posição vertical**. Repare na etiqueta no topo do
painel: ela diz se a mudança vai para todas as imagens ou só para a que está
aberta.

### Passo 4 — Cor
- **Preto e branco** — converte para a paleta de cinza do aparelho.
  Ative o **dithering** para simular tons intermediários com pontilhado
  (recomendado para fotos; para arte chapada, pode desligar).
- **Colorido** — mantém as cores (indicado para painéis Kaleido).
- **Bordas brancas/pretas** — cor das bordas no modo "Encaixar".

### Passo 5 — Exportar e salvar
Escolha o formato (PNG, WebP ou JPEG — o XTEINK ignora essa escolha e usa
BMP). Com uma capa aberta em foco, **"Salvar capa"** baixa só ela. Com 2 ou
mais imagens na fila, **"Baixar as N capas (.zip)"** processa tudo e entrega
um único `.zip`, com uma barra de progresso enquanto monta.

---

## Aparelhos suportados

Kindle (1, 2, 11, Keyboard/Touch, 5/7, 8/10, DX, Paperwhite 1–6, Voyage,
Oasis, Colorsoft, Scribe 1/2/3, Scribe Colorsoft e variantes de resolução),
Kobo (Mini/Touch, Glo, Glo HD, Aura, Aura HD/H2O/ONE, Nia, Clara HD/2E,
Clara Colour, Libra, Libra Colour, Forma, Sage, Elipsa), reMarkable (1, 2,
Paper Pro, Paper Pro Move) e **XTEINK X3/X4**. Há ainda a opção **"Tamanho
personalizado"** para qualquer resolução.

---

## Preto e branco x colorido

A maioria dos e-readers tem tela **monocromática** e exibe apenas tons de
cinza:

| Paleta     | Níveis de cinza | Aparelhos típicos                    |
|------------|-----------------|---------------------------------------|
| Palette4   | 4               | Kindle 1                               |
| Palette15  | 15              | Kindle 2                               |
| Palette16  | 16              | Praticamente todos os demais, incluindo o XTEINK X3/X4 |

Alguns modelos recentes têm tela **colorida** (tecnologia Kaleido) — para
eles, o programa já sugere automaticamente o modo **Colorido**:
Kindle Colorsoft, Kindle Scribe Colorsoft, Kobo Clara Colour e
Kobo Libra Colour.

> O **dithering** só afeta o modo preto e branco. Ele troca a falta de tons
> por um padrão pontilhado que, à distância, simula meios-tons — ótimo para
> fotografias em telas com poucos níveis de cinza. Sem dithering, o
> resultado fica mais "chapado" (posterizado), o que costuma favorecer artes
> com poucas cores sólidas.

---

## Formato de saída

Você escolhe entre **PNG** (padrão, sem perdas — recomendado para preservar
o dithering exatamente como calculado), **WebP** e **JPEG**.

**Exceção:** o perfil **XTEINK X3/X4** exporta **obrigatoriamente em BMP**
(24-bit), independentemente do formato escolhido. A interface avisa quando
esse perfil está selecionado e desabilita a escolha de formato.

O `.zip` é montado pelo próprio `app.js`, usando o `CompressionStream` nativo
do navegador (deflate). Em navegadores sem esse recurso, os arquivos entram
no `.zip` sem compressão — maior, mas igualmente válido.

---

## Perguntas frequentes

**Por que PNG em vez de JPEG como padrão?**
A conversão para e-reader gera imagens posterizadas e, com dithering, cheias
de pixels isolados alternando entre tons — exatamente a textura que a
compressão do JPEG mais destrói, borrando o pontilhado. O PNG preserva o
resultado exatamente como calculado.

**A imagem colorida ficou "lavada" no e-reader. Por quê?**
Telas Kaleido têm gama de cores reduzida e uma camada que diminui um pouco a
nitidez e a saturação. Isso é uma limitação física do painel, não do arquivo.

**Devo usar "Preencher" ou "Encaixar"?**
"Preencher" ocupa a tela inteira (melhor visual, mas corta as bordas).
"Encaixar" mostra a arte completa com bordas. Para capas, "Preencher" costuma
ficar melhor; ajuste a posição para não cortar títulos importantes.

**Minhas fotos ficam salvas em algum lugar?**
Não. Todo o processamento acontece na memória do navegador; nada é enviado
ou armazenado em servidor.

---

## Limitações conhecidas

- Aparelho de destino, orientação e cor são globais: para gerar a mesma fila
  para dois aparelhos diferentes, exporte, troque o perfil e exporte de novo
- Formatos de entrada aceitos: qualquer imagem que o navegador saiba abrir
  (JPG, PNG, WebP, GIF, BMP); a saída é sempre PNG, WebP, JPEG ou BMP
- No modo colorido não há simulação exata da paleta Kaleido de cada
  aparelho; as cores são preservadas e redimensionadas para a resolução da
  tela
- Imagens de origem muito grandes ou filas muito longas deixam o mosaico e a
  geração do `.zip` mais lentos em computadores mais fracos — o mosaico
  desenha as peças em lotes para não travar a interface, mas o `.zip` de uma
  fila grande em BMP pode passar de centenas de MB antes da compressão

---

## Estrutura do projeto

```
capas-web/
├── index.html   ← estrutura da página
├── style.css    ← aparência
├── app.js       ← perfis, composição, conversão P&B, dithering, BMP e ZIP
└── README.md    ← este arquivo
```

---

*Baseado no programa desktop "Criador de Capas para E-readers" e inspirado no
Xteink X4 Wallpaper Maker.*
