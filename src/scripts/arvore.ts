// Árvore genealógica no navegador: duas vistas sobre os mesmos dados.
// - "Explorar" (family-chart): a pessoa escolhida no centro, com avós, pais, cônjuges e filhos.
// - "Ramo inteiro" (d3, desenho próprio): todos os descendentes de uma pessoa, uma coluna por geração.
import * as f3 from 'family-chart';
import 'family-chart/styles/family-chart.css';
import { select, hierarchy, tree, zoom, zoomIdentity } from 'd3';

type P = { id: string; n: string; s: 'M' | 'F'; d: string; p: string[]; c: string[]; f: string[] };

const dados: P[] = JSON.parse(document.getElementById('dados-arvore')!.textContent!);
const porId = new Map(dados.map((p) => [p.id, p]));
const raiz = document.querySelector<HTMLElement>('[data-arvore]')!;
const inicial = raiz.dataset.inicial!;
const reduzMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

// ---------- estado e painel da pessoa em foco ----------
const params = new URLSearchParams(location.search);
let atual = porId.has(params.get('p') ?? '') ? params.get('p')! : inicial;
let vista: 'explorar' | 'ramo' = params.get('vista') === 'ramo' ? 'ramo' : 'explorar';

const painel = raiz.querySelector<HTMLElement>('[data-painel]')!;
const busca = raiz.querySelector<HTMLInputElement>('[data-busca]')!;

function mostrarPainel(id: string) {
  const p = porId.get(id)!;
  painel.innerHTML = `<span class="foco-nome">${esc(p.n)}</span>${p.d ? `<span class="foco-datas">${esc(p.d)}</span>` : ''}<a class="link" href="/pessoas/${id}/">Ver página</a>`;
}

/**
 * Muda a pessoa em foco. Só redesenha a vista visível; a outra é atualizada quando for aberta.
 * `jaDesenhado`: a vista que originou o clique já se reposicionou sozinha.
 */
function focar(id: string, jaDesenhado = false) {
  if (!porId.has(id)) return;
  atual = id;
  mostrarPainel(id);
  const url = new URL(location.href);
  url.searchParams.set('p', id);
  url.searchParams.set('vista', vista);
  history.replaceState(null, '', url);
  if (jaDesenhado) return;
  if (vista === 'explorar') explorar?.ir(id);
  else ramo?.desenhar(id);
}

// ---------- A: Explorar (family-chart) ----------
let explorar: { ir(id: string, animar?: boolean): void } | undefined;
function iniciarExplorar() {
  const data = dados.map((p) => ({ id: p.id, data: { gender: p.s, nome: p.n, datas: p.d }, rels: { parents: p.p, spouses: p.c, children: p.f } }));
  const chart = f3
    .createChart('#arvore-explorar', data)
    .setTransitionTime(reduzMovimento ? 0 : 600)
    .setCardXSpacing(215)
    .setCardYSpacing(105)
    .setAncestryDepth(2)
    .setProgenyDepth(1)
    .setSingleParentEmptyCard(false);
  const card = chart
    .setCardHtml()
    .setCardDim({ w: 190, h: 60 })
    .setMiniTree(false)
    .setCardInnerHtmlCreator((d: any) =>
      !d.data.data.nome
        ? ''
        : `<div class="pcard ${d.data.data.gender}"><div class="n">${esc(d.data.data.nome)}</div><div class="d">${esc(d.data.data.datas || '')}&nbsp;</div></div>`,
    );
  card.setOnCardClick((e: MouseEvent, d: any) => {
    card.onCardClickDefault(e, d);
    focar(d.data.id, true);
  });
  const escala = () => (window.innerWidth < 600 ? 0.62 : 0.85);
  chart.updateMainId(atual);
  chart.updateTree({ initial: true });
  chart.updateTree({ tree_position: 'main_to_middle', scale: escala(), transition_time: 0 } as any);
  explorar = {
    ir(id, animar = true) {
      chart.updateMainId(id);
      chart.updateTree({ tree_position: 'main_to_middle', scale: escala(), ...(animar ? {} : { transition_time: 0 }) } as any);
    },
  };
}

// ---------- C: Ramo inteiro (desenho próprio) ----------
let ramo: { desenhar(id: string): void } | undefined;
function iniciarRamo() {
  const svg = select<SVGSVGElement, unknown>('#arvore-ramo svg');
  const g = svg.append('g');
  const z = zoom<SVGSVGElement, unknown>().scaleExtent([0.25, 2]).on('zoom', (e) => g.attr('transform', e.transform));
  svg.call(z);
  const W = 196, H = 58;
  const nomesConj = (id: string) => porId.get(id)!.c.map((c) => porId.get(c)!.n);

  ramo = {
    desenhar(id) {
      g.selectAll('*').remove();
      const montar = (pid: string): any => ({ id: pid, children: porId.get(pid)!.f.map(montar) });
      const raizH = hierarchy(montar(id));
      tree<any>().nodeSize([H + 16, W + 70])(raizH);
      raizH.each((d: any) => { const t = d.x; d.x = d.y; d.y = t; });

      g.selectAll('path.link').data(raizH.links()).join('path').attr('class', 'link')
        .attr('d', (l: any) => `M${l.source.x + W / 2},${l.source.y}H${(l.source.x + l.target.x) / 2}V${l.target.y}H${l.target.x - W / 2}`);

      const n = g.selectAll('g.no').data(raizH.descendants()).join('g')
        .attr('class', (d: any) => 'no' + (d.depth === 0 ? ' raiz' : ''))
        .attr('transform', (d: any) => `translate(${d.x - W / 2},${d.y - H / 2})`)
        .attr('tabindex', 0)
        .attr('role', 'button')
        .attr('aria-label', (d: any) => `${porId.get(d.data.id)!.n}. Ver descendentes`)
        .on('click', (_e: Event, d: any) => focar(d.data.id))
        .on('keydown', (e: KeyboardEvent, d: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focar(d.data.id); } });
      n.append('rect').attr('width', W).attr('height', H).attr('rx', 5);
      n.append('text').attr('class', 'n').attr('x', 10).attr('y', 20).text((d: any) => porId.get(d.data.id)!.n);
      n.append('text').attr('class', 'd').attr('x', 10).attr('y', 35).text((d: any) => porId.get(d.data.id)!.d);
      n.append('text').attr('class', 's').attr('x', 10).attr('y', 50)
        .text((d: any) => { const c = nomesConj(d.data.id); return c.length ? '∞ ' + c.join(', ') : ''; });
      n.filter((d: any) => !!d.children && porId.get(d.data.id)!.c.length > 0)
        .append('circle').attr('class', 'no-casamento').attr('cx', W).attr('cy', H / 2).attr('r', 3.5);

      const xs = raizH.descendants().map((d: any) => d.x);
      const largura = Math.max(...xs) - Math.min(...xs) + W;
      const caixa = svg.node()!.getBoundingClientRect();
      const k = Math.max(0.5, Math.min(1, (caixa.width - 32) / largura));
      const alvo = zoomIdentity.translate(16 + (W / 2) * k, caixa.height / 2).scale(k);
      (reduzMovimento ? svg : svg.transition().duration(450)).call(z.transform as any, alvo);
    },
  };
}

// ---------- abas e busca ----------
const abas = raiz.querySelectorAll<HTMLButtonElement>('[data-vista]');
function mudarVista(v: 'explorar' | 'ramo') {
  vista = v;
  abas.forEach((b) => b.setAttribute('aria-selected', String(b.dataset.vista === v)));
  raiz.querySelectorAll<HTMLElement>('[data-painel-vista]').forEach((el) => (el.hidden = el.dataset.painelVista !== v));
  if (v === 'explorar') { if (!explorar) iniciarExplorar(); else explorar.ir(atual, false); }
  else { if (!ramo) iniciarRamo(); ramo!.desenhar(atual); }
  focar(atual, true);
}
abas.forEach((b) => b.addEventListener('click', () => mudarVista(b.dataset.vista as any)));

busca.addEventListener('change', () => {
  const alvo = dados.find((p) => `${p.n}${p.d ? ` (${p.d})` : ''}` === busca.value);
  if (alvo) { focar(alvo.id); busca.value = ''; busca.blur(); }
});
raiz.querySelectorAll<HTMLButtonElement>('[data-ir]').forEach((b) => b.addEventListener('click', () => focar(b.dataset.ir!)));

// Ao girar o celular ou redimensionar a janela, recentraliza na pessoa em foco.
let espera: number | undefined;
let larguraAnterior = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth === larguraAnterior) return; // ignora a barra do navegador do celular aparecendo/sumindo
  larguraAnterior = window.innerWidth;
  clearTimeout(espera);
  espera = window.setTimeout(() => (vista === 'explorar' ? explorar?.ir(atual, false) : ramo?.desenhar(atual)), 200);
});

raiz.classList.add('pronta');
mudarVista(vista);
