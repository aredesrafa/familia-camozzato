# Família Camozzato — site

Novo site de [familiacamozzato.com.br](https://familiacamozzato.com.br), em [Astro](https://astro.build), publicado no Netlify (time *Familia Camozzato*, plano Free) e com gestão de conteúdo pelo [Sveltia CMS](https://github.com/sveltia/sveltia-cms) em `/admin`.

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

Os campos de cada coleção estão em `src/content.config.ts` e espelhados em `public/admin/config.yml`. Ao mudar um, mude o outro.

O conteúdo inicial foi gerado a partir da extração do site antigo (pasta do projeto no Dropbox, `conteudo-extraido/`).

## Design

Linguagem visual da Versão A (Editorial): tokens em `src/styles/global.css` e fonte (Source Serif 4) em `src/layouts/Base.astro`.

## Publicação e limite do plano Free

- Cada push em `main` gera uma publicação de produção no Netlify. O plano Free dá 300 créditos por mês e **cada publicação consome 15 (≈ 20 publicações/mês)**. Ao esgotar, o site fica pausado até o mês seguinte.
- **Desenvolvimento:** trabalhe numa branch e abra PR. Deploy previews e branch deploys não consomem créditos. Junte as mudanças antes de mesclar em `main`.
- **CMS:** cada gravação no `/admin` é um commit em `main`, ou seja, uma publicação. Antes de abrir o CMS para a família, definir como agrupar as publicações.

## Login no CMS

O backend é GitHub. Cada editor precisa de uma conta GitHub com acesso de escrita a este repositório.

- **Agora:** em `/admin`, entrar com um *personal access token* do GitHub (opção "Sign In with Token").
- **Para a família:** criar um GitHub OAuth App (callback `https://api.netlify.com/auth/done`) e cadastrar o Client ID e o Secret no Netlify, em *Project configuration › Access & security › OAuth*. Aí o botão "Sign In with GitHub" passa a funcionar.
