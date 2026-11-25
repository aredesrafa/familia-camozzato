# Família Camozzato — site

Novo site de [familiacamozzato.com.br](https://familiacamozzato.com.br), em [Astro](https://astro.build), publicado na [Cloudflare](https://developers.cloudflare.com/workers/static-assets/) (plano gratuito) e com gestão de conteúdo pelo [Pages CMS](https://pagescms.org) (configuração em `.pages.yml`).

## Rodar localmente

Requer Node 22.23.4 ou mais novo (ver `.nvmrc`).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gera dist/
```

## Onde fica o conteúdo

| Pasta | O que é | No CMS |
|---|---|---|
| `src/data/home.json` | Textos, foto e números da página inicial | Página inicial |
| `src/content/historias/` | Histórias (perfis de Destaques) | Histórias |
| `src/content/cidades/` | Cidades importantes | Lugares |
| `src/content/galerias/` | Álbum de fotos: uma galeria por arquivo `.yml`, com a lista de fotos e legendas | Álbum de fotos |
| `src/content/paginas/` | Páginas de A família (origem do nome, imigração, primeiros imigrantes), em `/familia/` | A família (páginas) |
| `src/content/nucleos/` | Os quatro núcleos imigrantes | Núcleos imigrantes |
| `src/content/marcos/` | Marcos da linha do tempo | Linha do tempo |
| `src/content/pessoas/` | Pessoas da árvore genealógica (pai, mãe e cônjuges apontam para o arquivo da outra pessoa). Relações montadas em `src/arvore.ts`; páginas `/arvore/` e `/pessoas/[id]/` | Árvore — pessoas |
| `public/img/` | Imagens enviadas pelo CMS (`fotos/<galeria>/`, `historias/`, `cidades/`, `familia/` vieram do site antigo) | Mídia |
| `public/docs/` | Documentos em PDF (lista de passageiros do Hohenzollern) | — |

Os campos de cada coleção estão em `src/content.config.ts` e espelhados em `.pages.yml`. Ao mudar um, mude o outro.

O conteúdo inicial foi gerado a partir da extração do site antigo (pasta do projeto no Dropbox, `conteudo-extraido/`).

Histórias e cidades aceitam uma lista opcional `fotos` (imagem, legenda e descrição), mostrada abaixo do texto com ampliação ao clicar.

## Imagens

As imagens do site antigo foram otimizadas por `scripts/otimizar-imagens.mjs`: lado maior de até 1600 px (sem ampliar as menores), rotação corrigida, sem metadados, em JPEG (mozjpeg, qualidade 80). Os GIFs de mapas e gravuras viraram PNG. A lista de origem → destino está em `scripts/migracao-acervo.json`.

**Imagens enviadas pelo CMS são otimizadas sozinhas.** A cada push que muda `public/img`, o workflow `.github/workflows/otimizar-imagens.yml` otimiza só as imagens novas ou alteradas:
- mantém nome e formato (JPEG, PNG ou WebP), então nenhum link quebra;
- reduz para no máximo 1600 px, corrige a rotação e tira os metadados;
- grava o resultado como "conteúdo: otimiza imagens enviadas" e atualiza a prévia ou o site.

O "Publicar site" repete a verificação antes de publicar.

```bash
# Refazer a migração a partir do espelho do site antigo
node scripts/otimizar-imagens.mjs --manifesto scripts/migracao-acervo.json --origem <pasta site-atual>
# O que a automação roda (mesmo nome e formato)
node scripts/otimizar-imagens.mjs --manter-formato public/img/arquivo.jpg
```

As páginas leem largura e altura de cada imagem no build (`src/utils/imagens.mjs`), para a página não "pular" enquanto as fotos carregam.

## Design

Linguagem visual da Versão A (Editorial): tokens em `src/styles/global.css` e fonte (Source Serif 4) em `src/layouts/Base.astro`.

## Publicação

Hospedagem na Cloudflare, num Worker só com arquivos estáticos (`wrangler.jsonc`), no plano gratuito: sem selo e sem limite de publicações que preocupe. Tudo passa pelo GitHub Actions (`.github/workflows/cloudflare.yml`), com o segredo `CLOUDFLARE_API_TOKEN` do repositório.

- **Branches:**
  - `conteudo` (padrão no GitHub): rascunhos. O Pages CMS grava aqui. Cada push atualiza a prévia em https://conteudo-familia-camozzato.infinitybuilder.workers.dev
  - `main`: site no ar, em https://familia-camozzato.infinitybuilder.workers.dev. O endereço final será familiacamozzato.com.br, configurado como domínio próprio do Worker.
- **Botão "Publicar site" (Pages CMS):** dispara `.github/workflows/publicar.yml`, que junta `conteudo` em `main`, confere se o site compila e envia para a Cloudflare.
- **Desenvolvimento:** trabalhe numa branch e abra PR **contra `main`** (`gh pr create --base main`). Ao mesclar, o site é enviado e `.github/workflows/sincronizar-conteudo.yml` leva a mudança também para `conteudo`.
- **Publicar à mão** (com `wrangler login` feito): `npm run build && npx wrangler deploy`
- **Redirecionamentos** dos endereços do site antigo: `public/_redirects`.
- **Node:** a versão vem do `.nvmrc`.

## Login no CMS (Pages CMS)

A edição é feita em https://app.pagescms.org, não no próprio site.

- **Administrador (GitHub):** entra com a conta GitHub que tem acesso a este repositório. O app do Pages CMS precisa estar instalado no repositório.
- **Família (sem GitHub):** é convidada por e-mail em *Settings › Collaborators* dentro do Pages CMS e entra por um link enviado ao e-mail. Colaboradores editam conteúdo e imagens, mas não a configuração.
