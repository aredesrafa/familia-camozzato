#!/usr/bin/env node
// Otimiza imagens para o site: lado maior de até 1600 px (nunca amplia), rotação pela
// orientação EXIF, sem metadados, convertidas para JPEG (mozjpeg, qualidade 80) em sRGB.
// Se o JPEG original já é pequeno e a recompressão sairia maior, usa o jpegtran (quando
// instalado) para só limpar os metadados, sem perda nenhuma.
//
// Por que JPEG e não WebP: as fotos são baixadas e compartilhadas pela família (WhatsApp,
// impressão, visualizadores antigos) e o JPEG abre em qualquer lugar; as imagens já existentes
// e as enviadas pelo Pages CMS também são JPEG. Com o mozjpeg, a diferença de tamanho para o
// WebP é pequena nessas fotos, que ficam bem abaixo de 300 KB.
//
// Uso:
//   1) Migração a partir de uma lista (origem → destino):
//      node scripts/otimizar-imagens.mjs --manifesto scripts/migracao-acervo.json --origem <pasta do site antigo>
//   2) Otimizar no lugar imagens já no repositório (por exemplo, fotos grandes enviadas pelo CMS):
//      node scripts/otimizar-imagens.mjs public/img/fotos
//      Só regrava o arquivo se ele passar de 1600 px ou se a nova versão ficar menor.
//   3) Automático (GitHub Actions, imagens enviadas pelo Pages CMS):
//      node scripts/otimizar-imagens.mjs --manter-formato <arquivos>...
//      Mantém nome e formato de cada arquivo (JPEG, PNG ou WebP), para não quebrar nenhum link.
//      GIFs são deixados como estão (podem ser animados).
//
// Opções: --lado 1600  --qualidade 80  --forcar (no modo 1, refaz arquivos que já existem)
//
// Exceção: GIFs (mapas e gravuras de traço) viram PNG com paleta. Em JPEG, linhas e letras
// finas borram e o arquivo fica até 9 vezes maior; no manifesto, marcados com "grafico".

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return false;
  args.splice(i, 1);
  return true;
};

const LADO = Number(opt('lado', 1600));
const QUALIDADE = Number(opt('qualidade', 80));
const manifesto = opt('manifesto');
const origem = opt('origem');
const forcar = flag('forcar');
const manterFormato = flag('manter-formato');
const EXTENSOES = /\.(jpe?g|png|gif|tiff?|webp|bmp)$/i;

sharp.cache(false);

async function otimizar(entrada, { grafico = false } = {}) {
  const img = sharp(entrada, { pages: 1, failOn: 'none', limitInputPixels: false }).rotate();
  const meta = await img.metadata();
  let pipeline = img.resize({ width: LADO, height: LADO, fit: 'inside', withoutEnlargement: true });
  if (grafico) {
    pipeline = pipeline.toColorspace('srgb').png({ palette: true, colors: 256, effort: 10, compressionLevel: 9 });
  } else {
    pipeline = pipeline
      .flatten({ background: '#ffffff' })
      .toColorspace('srgb')
      .jpeg({ quality: QUALIDADE, mozjpeg: true });
  }
  let { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  // JPEG já leve, sem redimensionar nem girar: tenta só limpar os metadados, sem perda.
  const original = (await stat(entrada)).size;
  const semMudanca = meta.format === 'jpeg' && info.width === meta.width && info.height === meta.height
    && (meta.orientation ?? 1) === 1 && meta.space === 'srgb';
  if (!grafico && semMudanca && data.length > original * 0.95) {
    const r = spawnSync('jpegtran', ['-copy', 'none', '-optimize', '-progressive', entrada], { maxBuffer: 1 << 28 });
    if (r.status === 0 && r.stdout.length && r.stdout.length < data.length) data = r.stdout;
  }
  return { data, info, meta };
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function modoManifesto() {
  if (!origem) throw new Error('Informe --origem com a pasta do site antigo.');
  const lista = JSON.parse(await readFile(manifesto, 'utf8'));
  const destinos = new Map();
  for (const item of lista) {
    const d = item.destino.toLowerCase();
    if (destinos.has(d)) throw new Error(`Destino repetido: ${item.destino} (${destinos.get(d)} e ${item.origem})`);
    if (!/^public\/img\/[a-z0-9/-]+\.(jpg|png)$/.test(item.destino)) throw new Error(`Nome fora do padrão: ${item.destino}`);
    destinos.set(d, item.origem);
  }
  let antes = 0, depois = 0, feitos = 0, pulados = 0, maior = { tamanho: 0 };
  for (const item of lista) {
    const de = path.join(origem, item.origem);
    const para = item.destino;
    const original = (await stat(de)).size;
    antes += original;
    if (existsSync(para) && !forcar) {
      depois += (await stat(para)).size;
      pulados++;
      continue;
    }
    const { data, info, meta } = await otimizar(de, { grafico: item.grafico });
    await mkdir(path.dirname(para), { recursive: true });
    await writeFile(para, data);
    depois += data.length;
    feitos++;
    if (data.length > maior.tamanho) maior = { tamanho: data.length, para };
    console.log(`${item.origem}  ${meta.width}×${meta.height} ${kb(original)}  →  ${para}  ${info.width}×${info.height} ${kb(data.length)}`);
  }
  console.log(`\n${lista.length} imagens (${feitos} geradas, ${pulados} já existiam).`);
  console.log(`Tamanho: ${mb(antes)} → ${mb(depois)} (${((1 - depois / antes) * 100).toFixed(0)}% menor).`);
  if (maior.para) console.log(`Maior arquivo gerado: ${maior.para} (${kb(maior.tamanho)}).`);
}

async function listar(alvo) {
  const s = await stat(alvo);
  if (s.isFile()) return EXTENSOES.test(alvo) ? [alvo] : [];
  const out = [];
  for (const nome of await readdir(alvo)) out.push(...(await listar(path.join(alvo, nome))));
  return out;
}

/** Mesmo formato e mesmo nome: reduz para LADO e recomprime. Retorna null se não valer a pena. */
async function otimizarMesmoFormato(arq) {
  const fmt = (await sharp(arq, { failOn: 'none' }).metadata()).format;
  const img = sharp(arq, { failOn: 'none', limitInputPixels: false }).rotate();
  const meta = await img.metadata();
  const grande = Math.max(meta.width ?? 0, meta.height ?? 0) > LADO;
  let pipeline = img.resize({ width: LADO, height: LADO, fit: 'inside', withoutEnlargement: true }).toColorspace('srgb');
  if (fmt === 'jpeg') pipeline = pipeline.jpeg({ quality: QUALIDADE, mozjpeg: true });
  // PNG sem paleta (no sharp, effort/colors ligam a paleta de 256 cores): continua sem perda, só reduzido.
  else if (fmt === 'png') pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
  else if (fmt === 'webp') pipeline = pipeline.webp({ quality: QUALIDADE, effort: 6 });
  else return null; // gif, svg e outros: deixa como está
  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
  const original = (await stat(arq)).size;
  if (!grande && data.length >= original * 0.9) return null;
  return { data, info, meta, original };
}

async function modoMesmoFormato(alvos) {
  let antes = 0, depois = 0, mudados = 0;
  const arquivos = (await Promise.all(alvos.filter(existsSync).map(listar))).flat();
  for (const arq of arquivos) {
    const original = (await stat(arq)).size;
    antes += original;
    const r = await otimizarMesmoFormato(arq);
    if (!r) { depois += original; console.log(`${arq}  ${kb(original)} (já está bom)`); continue; }
    const tmp = `${arq}.${createHash('md5').update(arq).digest('hex').slice(0, 6)}.tmp`;
    await writeFile(tmp, r.data);
    await rename(tmp, arq);
    depois += r.data.length; mudados++;
    console.log(`${arq}  ${r.meta.width}×${r.meta.height} ${kb(original)} → ${r.info.width}×${r.info.height} ${kb(r.data.length)}`);
  }
  console.log(`\n${arquivos.length} imagens verificadas, ${mudados} otimizadas. ${mb(antes)} → ${mb(depois)}.`);
}

async function modoNoLugar(alvos) {
  let antes = 0, depois = 0, mudados = 0;
  const arquivos = (await Promise.all(alvos.map(listar))).flat();
  for (const arq of arquivos) {
    const original = (await stat(arq)).size;
    antes += original;
    const { data, info, meta } = await otimizar(arq, { grafico: /\.gif$/i.test(arq) });
    const grande = Math.max(meta.width ?? 0, meta.height ?? 0) > LADO;
    const jpg = /\.jpe?g$/i.test(arq);
    if (/\.png$/i.test(arq) && !grande) { depois += original; continue; }
    if (!jpg) {
      // Outros formatos viram .jpg; quem referencia o arquivo precisa ser atualizado à mão.
      const novo = arq.replace(EXTENSOES, /\.gif$/i.test(arq) ? '.png' : '.jpg');
      if (existsSync(novo)) { console.warn(`Pulado (já existe ${novo}): ${arq}`); depois += original; continue; }
      await writeFile(novo, data);
      console.log(`${arq} → ${novo} ${kb(data.length)} (atualize as referências e apague o original)`);
      depois += data.length; mudados++;
      continue;
    }
    if (grande || data.length < original * 0.9) {
      const tmp = `${arq}.${createHash('md5').update(arq).digest('hex').slice(0, 6)}.tmp`;
      await writeFile(tmp, data);
      await rename(tmp, arq);
      console.log(`${arq}  ${meta.width}×${meta.height} ${kb(original)} → ${info.width}×${info.height} ${kb(data.length)}`);
      depois += data.length; mudados++;
    } else {
      depois += original;
    }
  }
  console.log(`\n${arquivos.length} imagens verificadas, ${mudados} regravadas. ${mb(antes)} → ${mb(depois)}.`);
}

if (manifesto) await modoManifesto();
else if (manterFormato) await modoMesmoFormato(args);
else if (args.length) await modoNoLugar(args);
else {
  console.log('Uso: node scripts/otimizar-imagens.mjs --manifesto <lista.json> --origem <pasta>');
  console.log('     node scripts/otimizar-imagens.mjs <arquivo-ou-pasta>...');
  process.exit(1);
}
