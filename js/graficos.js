// js/graficos.js — gráficos de pertinência em SVG, desenhados à mão.
// Não calcula nada da inferência: recebe pontos e funções prontas do núcleo.

const LARG = 520, ALT = 230;
const ESQ = 50, DIR = 16, TOPO = 26, BASE = 44;
const PW = LARG - ESQ - DIR;   // largura da área do gráfico
const PH = ALT - TOPO - BASE;   // altura da área do gráfico

function numeroPt(x) {
  return x.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

/**
 * Desenha um gráfico de pertinência no <svg>.
 * opcoes = {
 *   min, max, rotuloX, ticksX: [..],
 *   conjuntos: [{ rotulo, pontos: [a,b,c,d], cor, tracejado?, fraco? }],
 *   areas: [{ funcao: (x) => μ, cor, alfa }],   // regiões preenchidas
 *   linhas: [{ x, cor, rotulo }],               // linhas verticais
 * }
 */
export function desenharGrafico(svg, opcoes) {
  const { min, max } = opcoes;
  const sx = (x) => ESQ + ((x - min) / (max - min)) * PW;
  const sy = (mu) => TOPO + (1 - mu) * PH;
  let h = '';

  // grade e eixo vertical (grau de pertinência 0 a 1)
  for (const mu of [0, 0.5, 1]) {
    h += `<line x1="${ESQ}" y1="${sy(mu)}" x2="${ESQ + PW}" y2="${sy(mu)}" stroke="#e0d5c2" stroke-width="1"/>`;
    h += `<text x="${ESQ - 8}" y="${sy(mu) + 4}" font-size="11" text-anchor="end" fill="#6e5f4c">${numeroPt(mu)}</text>`;
  }
  h += `<text x="14" y="${TOPO + PH / 2}" font-size="11" fill="#6e5f4c" text-anchor="middle" transform="rotate(-90 14 ${TOPO + PH / 2})">grau de pertinência</text>`;

  // eixo horizontal
  h += `<line x1="${ESQ}" y1="${sy(0)}" x2="${ESQ + PW}" y2="${sy(0)}" stroke="#6e5f4c" stroke-width="1.2"/>`;
  for (const t of opcoes.ticksX) {
    h += `<line x1="${sx(t)}" y1="${sy(0)}" x2="${sx(t)}" y2="${sy(0) + 4}" stroke="#6e5f4c"/>`;
    h += `<text x="${sx(t)}" y="${sy(0) + 17}" font-size="11" text-anchor="middle" fill="#6e5f4c">${numeroPt(t)}</text>`;
  }
  h += `<text x="${ESQ + PW / 2}" y="${ALT - 8}" font-size="12" text-anchor="middle" fill="#2a1d10">${opcoes.rotuloX}</text>`;

  // áreas preenchidas (amostradas em 300 pontos)
  for (const area of opcoes.areas || []) {
    const pts = [`${sx(min)},${sy(0)}`];
    const N = 300;
    for (let k = 0; k <= N; k++) {
      const x = min + (k / N) * (max - min);
      pts.push(`${sx(x).toFixed(2)},${sy(area.funcao(x)).toFixed(2)}`);
    }
    pts.push(`${sx(max)},${sy(0)}`);
    h += `<polygon points="${pts.join(' ')}" fill="${area.cor}" fill-opacity="${area.alfa}" stroke="${area.cor}" stroke-width="1.5"/>`;
  }

  // conjuntos: trapézio/triângulo pelos quatro pontos
  for (const c of opcoes.conjuntos) {
    const [a, b, cc, d] = c.pontos;
    const pts = [[a, 0], [b, 1], [cc, 1], [d, 0]].map(([x, mu]) => `${sx(x)},${sy(mu)}`).join(' ');
    h += `<polyline points="${pts}" fill="none" stroke="${c.cor}" stroke-width="${c.fraco ? 1.5 : 2.5}"`
      + `${c.tracejado ? ' stroke-dasharray="6 4"' : ''} stroke-opacity="${c.fraco ? 0.55 : 1}" stroke-linejoin="round"/>`;
    const meio = Math.min(Math.max((b + cc) / 2, min + (max - min) * 0.06), max - (max - min) * 0.06);
    h += `<text x="${sx(meio)}" y="${TOPO - 8}" font-size="12" font-weight="700" text-anchor="middle" fill="${c.cor}">${c.rotulo}</text>`;
  }

  // linhas verticais (entrada informada ou centroide)
  for (const l of opcoes.linhas || []) {
    h += `<line x1="${sx(l.x)}" y1="${TOPO - 2}" x2="${sx(l.x)}" y2="${sy(0)}" stroke="${l.cor}" stroke-width="2" stroke-dasharray="4 3"/>`;
    const ancora = l.x > min + (max - min) * 0.8 ? 'end' : 'start';
    h += `<text x="${sx(l.x) + (ancora === 'start' ? 5 : -5)}" y="${TOPO + 12}" font-size="12" font-weight="700" text-anchor="${ancora}" fill="${l.cor}">${l.rotulo}</text>`;
  }

  svg.innerHTML = h;
}
