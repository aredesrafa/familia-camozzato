# Família Camozzato — site

Novo site de [familiacamozzato.com.br](https://familiacamozzato.com.br), em [Astro](https://astro.build), publicado no Netlify (time *Familia Camozzato*, plano Free) e com gestão de conteúdo pelo [Pages CMS](https://pagescms.org) (configuração em `.pages.yml`).

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
| `public/img/` | Imagens enviadas pelo CMS | Mídia |

Os campos de cada coleção estão em `src/content.config.ts` e espelhados em `.pages.yml`. Ao mudar um, mude o outro.

O conteúdo inicial foi gerado a partir da extração do site antigo (pasta do projeto no Dropbox, `conteudo-extraido/`).

## Design

Linguagem visual da Versão A (Editorial): tokens em `src/styles/global.css` e fonte (Source Serif 4) em `src/layouts/Base.astro`.

## Publicação e limite do plano Free

O plano Free do Netlify dá 300 créditos por mês, e **cada publicação de produção consome 15 (≈ 20 por mês)**. Ao esgotar, o site fica pausado até o mês seguinte. Por isso:

- **Branches:**
  - `conteudo` (padrão no GitHub): rascunhos. O Pages CMS grava aqui. Cada push gera só uma prévia gratuita em https://conteudo--familia-camozzato.netlify.app
  - `main`: site no ar. Cada push gera uma publicação.
- **Botão "Publicar site" (Pages CMS):** dispara `.github/workflows/publicar.yml`, que junta `conteudo` em `main`, confere se o site compila e envia. É a única forma de a família publicar.
- **Desenvolvimento:** trabalhe numa branch e abra PR **contra `main`** (`gh pr create --base main`). Ao mesclar, `.github/workflows/sincronizar-conteudo.yml` leva a mudança também para `conteudo`.
- **Commits que não mudam o site** (README, `.pages.yml`, workflows) não geram publicação: veja o `ignore` em `netlify.toml`.
- **Mudar a configuração do repositório no Netlify pela API dispara uma publicação sozinho.** Evite.

## Login no CMS (Pages CMS)

A edição é feita em https://app.pagescms.org, não no próprio site.

- **Administrador (GitHub):** entra com a conta GitHub que tem acesso a este repositório. O app do Pages CMS precisa estar instalado no repositório.
- **Família (sem GitHub):** é convidada por e-mail em *Settings › Collaborators* dentro do Pages CMS e entra por um link enviado ao e-mail. Colaboradores editam conteúdo e imagens, mas não a configuração.
