import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Cada coleção corresponde a uma pasta em src/content e a uma coleção no CMS (public/admin/config.yml).

const historias = defineCollection({
  loader: glob({ base: './src/content/historias', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string(),
    pessoa: z.string().optional(),
    periodo: z.string().optional(),
    resumo: z.string(),
    imagem: z.string().optional(),
    imagem_alt: z.string().optional(),
    ordem: z.number().default(99),
    destaque: z.boolean().default(false),
  }),
});

const cidades = defineCollection({
  loader: glob({ base: './src/content/cidades', pattern: '**/*.md' }),
  schema: z.object({
    nome: z.string(),
    regiao: z.string(),
    ordem: z.number().default(99),
    resumo: z.string(),
    imagem: z.string().optional(),
    imagem_alt: z.string().optional(),
  }),
});

const nucleos = defineCollection({
  loader: glob({ base: './src/content/nucleos', pattern: '**/*.md' }),
  schema: z.object({
    titulo: z.string(),
    lugares: z.string(),
    grafia: z.string().optional(),
    ordem: z.number().default(99),
    raiz: z.string(),
  }),
});

const marcos = defineCollection({
  loader: glob({ base: './src/content/marcos', pattern: '**/*.{yml,yaml}' }),
  schema: z.object({
    ano: z.number(),
    mes: z.number().min(1).max(12).optional(),
    data: z.string(),
    titulo: z.string(),
    descricao: z.string(),
    home: z.boolean().default(false),
  }),
});

export const collections = { historias, cidades, nucleos, marcos };
