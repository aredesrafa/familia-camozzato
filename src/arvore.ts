import { getCollection } from 'astro:content';

/**
 * Monta a árvore genealógica a partir da coleção `pessoas`.
 * - Filhos são derivados de pai/mãe; cônjuges valem nos dois sentidos (basta cadastrar em um lado).
 * - Referências a pessoas que não existem são ignoradas com um aviso no build (não quebram a publicação).
 * - Pessoas marcadas como vivas aparecem só com o nome (sem datas, locais, notas nem foto).
 */

export interface Pessoa {
  id: string;
  nome: string;
  sobrenome?: string;
  nomeCompleto: string;
  sexo: 'M' | 'F';
  nascimento?: string;
  nascimento_local?: string;
  falecimento?: string;
  falecimento_local?: string;
  foto?: string;
  foto_alt?: string;
  notas?: string;
  fontes: string[];
  vivo: boolean;
  pai?: string;
  mae?: string;
  conjuges: { id: string; casamento?: string }[];
  filhos: string[];
  /** Ex.: "1839 – 1903", "n. 1880", "c. 1880". Vazio para pessoas vivas. */
  datas: string;
  nucleo?: string;
  /** 1 = imigrante; 2 = filhos; 3 = netos… (só para quem descende de um núcleo) */
  geracao?: number;
}

/** Os quatro núcleos imigrantes, na ordem em que aparecem no site. */
export const NUCLEOS = [
  { id: 'giuseppe', raiz: 'giuseppe-camozzato-1839', titulo: 'Giuseppe e Marianna' },
  { id: 'giovanni', raiz: 'giovanni-camozzato-1835', titulo: 'Giovanni, Domenica e Luigia' },
  { id: 'antonio', raiz: 'antonio-camozzato-1845', titulo: 'Antonio e Vittoria' },
  { id: 'rosa', raiz: 'rosa-camozzato-1831', titulo: 'Rosa e Gaetano' },
];

/** "src/content/pessoas/x.yml" → "x" (também aceita o id puro). */
export const refParaId = (ref?: string) =>
  ref ? ref.split('/').pop()!.replace(/\.ya?ml$/, '') : undefined;

const ano = (s?: string) => s?.match(/\d{4}/)?.[0];

function formatarDatas(n?: string, f?: string) {
  const an = ano(n), af = ano(f);
  const circa = (s?: string) => (s && /^c\.?\s/i.test(s) ? 'c. ' : '');
  if (an && af) return `${circa(n)}${an} – ${circa(f)}${af}`;
  if (an) return `n. ${circa(n)}${an}`;
  if (af) return `† ${circa(f)}${af}`;
  return '';
}

let cache: ReturnType<typeof montar> | undefined;

export async function carregarArvore() {
  if (!cache) cache = montar(await getCollection('pessoas'));
  return cache;
}

function montar(entradas: Awaited<ReturnType<typeof getCollection<'pessoas'>>>) {
  const porId = new Map<string, Pessoa>();
  for (const e of entradas) {
    const d = e.data;
    porId.set(e.id, {
      id: e.id,
      nome: d.nome,
      sobrenome: d.sobrenome,
      nomeCompleto: [d.nome, d.sobrenome].filter(Boolean).join(' '),
      sexo: d.sexo,
      vivo: d.vivo,
      nascimento: d.vivo ? undefined : d.nascimento,
      nascimento_local: d.vivo ? undefined : d.nascimento_local,
      falecimento: d.vivo ? undefined : d.falecimento,
      falecimento_local: d.vivo ? undefined : d.falecimento_local,
      foto: d.vivo ? undefined : d.foto,
      foto_alt: d.foto_alt,
      notas: d.vivo ? undefined : d.notas,
      fontes: d.fontes,
      pai: refParaId(d.pai),
      mae: refParaId(d.mae),
      conjuges: [],
      filhos: [],
      datas: d.vivo ? '' : formatarDatas(d.nascimento, d.falecimento),
    });
  }

  const existe = (quem: string, campo: string, id?: string) => {
    if (!id) return undefined;
    if (porId.has(id)) return id;
    console.warn(`[árvore] ${quem}: "${campo}" aponta para "${id}", que não existe. Ignorado.`);
    return undefined;
  };

  // pais e filhos
  for (const p of porId.values()) {
    p.pai = existe(p.id, 'pai', p.pai);
    p.mae = existe(p.id, 'mae', p.mae);
    for (const genitor of [p.pai, p.mae]) if (genitor) porId.get(genitor)!.filhos.push(p.id);
  }

  // cônjuges nos dois sentidos
  for (const e of entradas) {
    for (const c of e.data.conjuges) {
      const outro = existe(e.id, 'conjuges', refParaId(c.pessoa));
      if (!outro || outro === e.id) continue;
      for (const [a, b] of [[e.id, outro], [outro, e.id]]) {
        const lista = porId.get(a)!.conjuges;
        const ja = lista.find((x) => x.id === b);
        if (ja) ja.casamento ??= c.casamento;
        else lista.push({ id: b, casamento: c.casamento });
      }
    }
  }

  // filhos em ordem de nascimento (sem data vão ao fim, por nome)
  const chave = (id: string) => {
    const p = porId.get(id)!;
    return [Number(ano(p.nascimento) ?? 9999), p.nomeCompleto] as const;
  };
  for (const p of porId.values()) {
    p.filhos = [...new Set(p.filhos)].sort((a, b) => {
      const [aa, an] = chave(a), [ba, bn] = chave(b);
      return aa - ba || an.localeCompare(bn, 'pt-BR');
    });
  }

  // núcleo e geração: descendentes de cada imigrante
  for (const n of NUCLEOS) {
    const raiz = porId.get(n.raiz);
    if (!raiz) { console.warn(`[árvore] núcleo "${n.id}": raiz "${n.raiz}" não existe.`); continue; }
    const fila: [string, number][] = [[raiz.id, 1]];
    while (fila.length) {
      const [id, ger] = fila.shift()!;
      const p = porId.get(id)!;
      if (p.nucleo) continue;
      p.nucleo = n.id;
      p.geracao = ger;
      p.filhos.forEach((f) => fila.push([f, ger + 1]));
    }
  }

  const pessoas = [...porId.values()].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'));
  return { pessoas, porId };
}

/** Dados enxutos para os gráficos no navegador. */
export function dadosParaGrafico(pessoas: Pessoa[]) {
  return pessoas.map((p) => ({
    id: p.id,
    n: p.nomeCompleto,
    s: p.sexo,
    d: p.datas,
    p: [p.pai, p.mae].filter(Boolean),
    c: p.conjuges.map((c) => c.id),
    f: p.filhos,
  }));
}
