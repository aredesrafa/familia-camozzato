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

// Pessoas da árvore genealógica. Pai, mãe e cônjuges guardam o caminho do arquivo da outra pessoa
// (formato do campo de referência do Pages CMS, ex.: "src/content/pessoas/giuseppe-camozzato-1839.yml").
// As relações (filhos, cônjuges dos dois lados) são montadas em src/lib/arvore.ts.
const opcional = z.string().nullish().transform((v) => v?.trim() || undefined);
const pessoas = defineCollection({
  loader: glob({
    base: './src/content/pessoas',
    pattern: '**/*.{yml,yaml}',
    // O id é exatamente o nome do arquivo, para bater com as referências gravadas pelo CMS.
    generateId: ({ entry }) => entry.replace(/\.ya?ml$/, ''),
  }),
  schema: z.object({
    nome: z.string(),
    sobrenome: opcional,
    sexo: z.enum(['M', 'F']),
    nascimento: opcional,
    nascimento_local: opcional,
    falecimento: opcional,
    falecimento_local: opcional,
    pai: opcional,
    mae: opcional,
    conjuges: z
      .array(z.object({ pessoa: opcional, casamento: opcional }))
      .nullish()
      .transform((v) => v ?? []),
    foto: opcional,
    foto_alt: opcional,
    vivo: z.boolean().nullish().transform((v) => v ?? false),
    notas: opcional,
    fontes: z
      .array(z.string().nullish())
      .nullish()
      .transform((v) => (v ?? []).filter((x): x is string => !!x?.trim())),
  }),
});

export const collections = { historias, cidades, nucleos, marcos, pessoas };
