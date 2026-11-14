// js/prng.js — padrão do grupo (Mulberry32). Não use Math.random no projeto.
export function criarRng(semente) {
  let s = semente >>> 0;
  return function rng() {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function inteiroEntre(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
export function sortearDistintos(rng, n, k) {
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = inteiroEntre(rng, i, n - 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, k);
}
export function roleta(rng, pesos) {
  const total = pesos.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < pesos.length; i++) {
    r -= pesos[i];
    if (r < 0) return i;
  }
  for (let i = pesos.length - 1; i >= 0; i--) if (pesos[i] > 0) return i;
}
