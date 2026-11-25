import type { CollectionEntry } from 'astro:content';

/** Ordena marcos por ano e, no mesmo ano, por mês. */
export const porData = (a: CollectionEntry<'marcos'>, b: CollectionEntry<'marcos'>) =>
  a.data.ano - b.data.ano || (a.data.mes ?? 0) - (b.data.mes ?? 0);
