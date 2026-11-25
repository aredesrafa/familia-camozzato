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
| `src/content/nucleos/` | Os quatro núcleos imigrantes | Núcleos imigrantes |
| `src/content/marcos/` | Marcos da linha do tempo | Linha do tempo |
| `src/content/pessoas/` | Pessoas da árvore genealógica (pai, mãe e cônjuges apontam para o arquivo da outra pessoa). Relações montadas em `src/arvore.ts`; páginas `/arvore/` e `/pessoas/[id]/` | Árvore — pessoas |
| `public/img/` | Imagens enviadas pelo CMS | Mídia |

Os campos de cada coleção estão em `src/content.config.ts` e espelhados em `.pages.yml`. Ao mudar um, mude o outro.

O conteúdo inicial foi gerado a partir da extração do site antigo (pasta do projeto no Dropbox, `conteudo-extraido/`).

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
