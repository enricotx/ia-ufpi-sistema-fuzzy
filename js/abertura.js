// js/abertura.js — tela inicial: gotas d'água caindo na areia (tema irrigação).
// Usa um gerador próprio com semente (prng.js); o cálculo fuzzy não tem sorteios.
import { criarRng } from './prng.js';

const rng = criarRng(2026);
const COR = '61, 126, 166'; // azul da água (rgb)
const abertura = document.getElementById('abertura');
const canvas = document.getElementById('abertura-canvas');
const ctx = canvas.getContext('2d');
const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let W = 0, H = 0;
let idQuadro = 0;
let gotas = [];
let ondas = [];

function ajustar() {
  const r = canvas.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  W = r.width; H = r.height;
}

// Uma gota nasce acima da tela e cai até um "chão" sorteado.
function novaGota(acimaDaTela) {
  return {
    x: rng() * W,
    y: acimaDaTela ? -20 - rng() * H : rng() * H * 0.8,
    chao: H * (0.35 + rng() * 0.62),
    vel: 70 + rng() * 90,
    tam: 2.2 + rng() * 2.4,
  };
}

function criarGotas() {
  const qtd = Math.min(70, Math.max(25, Math.round((W * H) / 22000)));
  gotas = [];
  ondas = [];
  for (let k = 0; k < qtd; k++) gotas.push(novaGota(false));
}

// Desenha uma gota: corpo redondo embaixo e ponta em cima.
function gota(x, y, s) {
  ctx.fillStyle = `rgba(${COR}, 0.75)`;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 2.6);
  ctx.bezierCurveTo(x + s * 0.9, y - s * 1.2, x + s, y - s * 0.2, x, y + s * 0.9);
  ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.9, y - s * 1.2, x, y - s * 2.6);
  ctx.fill();
}

function desenhar() {
  ctx.clearRect(0, 0, W, H);
  for (const o of ondas) {
    const alfa = Math.max(0, 0.5 * (1 - o.idade / o.vida));
    ctx.strokeStyle = `rgba(${COR}, ${alfa})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, o.raio, o.raio * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const g of gotas) gota(g.x, g.y, g.tam);
}

function mover(dt) {
  for (let k = 0; k < gotas.length; k++) {
    const g = gotas[k];
    g.y += g.vel * dt;
    if (g.y >= g.chao) {
      // tocou o chão: vira uma onda que se espalha e some
      ondas.push({ x: g.x, y: g.chao, raio: 2, idade: 0, vida: 1.1 + rng() * 0.6, cresce: 18 + rng() * 14 });
      gotas[k] = novaGota(true);
    }
  }
  for (const o of ondas) { o.idade += dt; o.raio += o.cresce * dt; }
  ondas = ondas.filter((o) => o.idade < o.vida);
}

let ultimo = 0;
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
  mover(dt);
  desenhar();
  idQuadro = requestAnimationFrame(quadro);
}

function parar() {
  cancelAnimationFrame(idQuadro);
  idQuadro = 0;
}

ajustar();
criarGotas();
desenhar();
window.addEventListener('resize', () => {
  if (abertura.hidden) return;
  ajustar();
  criarGotas();
  desenhar();
});
if (!reduzir) {
  ultimo = performance.now();
  idQuadro = requestAnimationFrame(quadro);
}

// Iniciar: some com fade, esconde a abertura, para a animação e abre o simulador.
const btnIniciar = document.getElementById('btn-iniciar');
let aberto = false; // a abertura só se fecha uma vez
function concluir() {
  if (aberto) return;
  aberto = true;
  abertura.hidden = true;
  parar();
  document.getElementById('simulador').hidden = false;
  document.dispatchEvent(new CustomEvent('simulador:aberto'));
}
btnIniciar.addEventListener('click', () => {
  if (btnIniciar.disabled) return;
  btnIniciar.disabled = true;
  abertura.classList.add('some');
  abertura.addEventListener('transitionend', (e) => {
    if (e.target === abertura && e.propertyName === 'opacity') concluir();
  });
  setTimeout(concluir, 500); // reserva caso a transição não dispare
});
