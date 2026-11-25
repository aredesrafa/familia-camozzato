import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { imageMetadata } from 'astro/assets/utils';

const cache = new Map();

/**
 * Largura e altura de uma imagem de public/ (ex.: "/img/fotos/x.jpg"), lidas no build.
 * Servem para o navegador reservar o espaço da foto antes de ela carregar.
 * Imagens externas ou que não existem voltam sem medidas, sem quebrar a página.
 * @param {string | undefined} src
 * @returns {Promise<{ width?: number, height?: number }>}
 */
export function medidas(src) {
  if (!src || !src.startsWith('/')) return Promise.resolve({});
  if (!cache.has(src)) {
    cache.set(src, (async () => {
      try {
        const buf = await readFile(path.join(process.cwd(), 'public', decodeURI(src)));
        const { width, height } = await imageMetadata(buf, src);
        return { width, height };
      } catch {
        return {};
      }
    })());
  }
  return cache.get(src);
}
