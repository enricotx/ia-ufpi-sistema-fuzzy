// js/testes.js — padrão do grupo: um caso por item da seção 6 do enunciado
import * as nucleo from './nucleo.js';

const resultados = [];

export function caso(nome, fn) {
  try { fn(); resultados.push({ nome, ok: true }); }
  catch (e) { resultados.push({ nome, ok: false, msg: e.message }); }
}
export function igual(obtido, esperado, rotulo = '') {
  const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${rotulo} esperado ${b}, obtido ${a}`);
}
export function perto(obtido, esperado, tol = 1e-6, rotulo = '') {
  if (!(Math.abs(obtido - esperado) <= tol)) throw new Error(`${rotulo} esperado ${esperado} ± ${tol}, obtido ${obtido}`);
}
function mostrar(corpo) {
  corpo.innerHTML = resultados.map(r =>
    `<tr class="${r.ok ? 'ok' : 'falha'}"><td>${r.nome}</td><td>${r.ok ? 'PASSOU' : 'FALHOU'}</td><td>${r.msg ?? ''}</td></tr>`).join('');
  const ok = resultados.filter(r => r.ok).length;
  document.getElementById('resumo').textContent = `${ok} de ${resultados.length} testes passaram.`;
}

caso('6.1 — Pertinências de U = 35%', () => {
  const g = nucleo.fuzzificar(35, 30).umidade;
  perto(g.seco, 0.5, 1e-6, 'seco'); perto(g.intermediario, 0.5, 1e-6, 'intermediário'); perto(g.umido, 0, 1e-6, 'úmido');
});

// TODO: demais casos da seção 6 (extremos, regra única, inferência completa 16,785683,
// simetria, alteração de regras, passos 0,1/0,05/0,01, validação da interface)

mostrar(document.getElementById('resultados'));
