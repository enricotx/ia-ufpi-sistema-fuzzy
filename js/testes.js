// js/testes.js — testes da seção 6 do enunciado (um caso por item).
// Abra testes.html no navegador para ver a tabela PASSOU/FALHOU.
// Também roda no terminal com: node js/testes.js
import * as nucleo from './nucleo.js';
import { lerNumero } from './validacao.js';

// ---------- Funções de apoio dos testes (padrão do grupo) ----------

const resultados = [];

export function caso(nome, fn) {
  try {
    fn();
    resultados.push({ nome: nome, ok: true, msg: '' });
  } catch (e) {
    resultados.push({ nome: nome, ok: false, msg: e.message });
  }
}

export function igual(obtido, esperado, rotulo = '') {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${rotulo} esperado ${b}, obtido ${a}`);
}

export function perto(obtido, esperado, tol = 1e-6, rotulo = '') {
  if (!(Math.abs(obtido - esperado) <= tol)) throw new Error(`${rotulo} esperado ${esperado} ± ${tol}, obtido ${obtido}`);
}

function verdadeiro(condicao, rotulo) {
  if (!condicao) throw new Error(rotulo);
}

// Tolerâncias do enunciado (seção 6)
const TOL_GRAU = 1e-6;   // pertinências e ativações
const TOL_TEMPO = 0.01;  // tempos de referência, em minutos

// Copia a base padrão trocando todos os consequentes (teste 6.4)
function regrasTodasCom(tempo) {
  const regras = [];
  for (let k = 0; k < nucleo.REGRAS_PADRAO.length; k++) {
    const r = nucleo.REGRAS_PADRAO[k];
    regras.push({ id: r.id, umidade: r.umidade, temperatura: r.temperatura, tempo: tempo });
  }
  return regras;
}

// ---------- 6.1 Pertinências e extremos ----------

caso('6.1 — U = 35%: seco 0,5; intermediário 0,5; úmido 0', () => {
  const g = nucleo.fuzzificar(35, 30).umidade;
  perto(g.seco, 0.5, TOL_GRAU, 'seco');
  perto(g.intermediario, 0.5, TOL_GRAU, 'intermediário');
  perto(g.umido, 0, TOL_GRAU, 'úmido');
});

caso('6.1 — T = 30 °C: baixa 0; média 0,5; alta 0,5', () => {
  const g = nucleo.fuzzificar(35, 30).temperatura;
  perto(g.baixa, 0, TOL_GRAU, 'baixa');
  perto(g.media, 0.5, TOL_GRAU, 'média');
  perto(g.alta, 0.5, TOL_GRAU, 'alta');
});

caso('6.1 — Extremos: U 0% (1,0,0); U 100% (0,0,1); T 10 °C (1,0,0); T 40 °C (0,0,1)', () => {
  const a = nucleo.fuzzificar(0, 10);
  const b = nucleo.fuzzificar(100, 40);
  igual([a.umidade.seco, a.umidade.intermediario, a.umidade.umido], [1, 0, 0], 'U = 0');
  igual([b.umidade.seco, b.umidade.intermediario, b.umidade.umido], [0, 0, 1], 'U = 100');
  igual([a.temperatura.baixa, a.temperatura.media, a.temperatura.alta], [1, 0, 0], 'T = 10');
  igual([b.temperatura.baixa, b.temperatura.media, b.temperatura.alta], [0, 0, 1], 'T = 40');
});

caso('6.1 — Extremos da saída: μcurto(0) = 1 e μlongo(30) = 1, sem divisão por zero', () => {
  igual(nucleo.pertinencia(0, nucleo.CONJUNTOS.tempo.curto), 1, 'curto(0)');
  igual(nucleo.pertinencia(30, nucleo.CONJUNTOS.tempo.longo), 1, 'longo(30)');
  // Percorre todos os conjuntos em vários pontos: nenhum valor pode ser NaN ou Infinity
  for (const variavel in nucleo.CONJUNTOS) {
    for (const nome in nucleo.CONJUNTOS[variavel]) {
      for (let x = -5; x <= 105; x += 0.5) {
        const mu = nucleo.pertinencia(x, nucleo.CONJUNTOS[variavel][nome]);
        verdadeiro(Number.isFinite(mu) && mu >= 0 && mu <= 1, `${nome}(${x}) = ${mu}`);
      }
    }
  }
});

// ---------- 6.2 Ativação de uma única regra ----------

caso('6.2 — U 20%, T 35 °C: só R3 com h = 1; saída ≈ 25,00 min', () => {
  const r = nucleo.calcular(20, 35, nucleo.REGRAS_PADRAO, 0.1);
  for (let k = 0; k < r.ativacoes.length; k++) {
    perto(r.ativacoes[k].h, r.ativacoes[k].id === 'R3' ? 1 : 0, TOL_GRAU, r.ativacoes[k].id);
  }
  perto(r.saida.z, 25, TOL_TEMPO, 'tempo');
});

caso('6.2 — U 50%, T 25 °C: só R5 com h = 1; saída 15,00 min', () => {
  const r = nucleo.calcular(50, 25, nucleo.REGRAS_PADRAO, 0.1);
  for (let k = 0; k < r.ativacoes.length; k++) {
    perto(r.ativacoes[k].h, r.ativacoes[k].id === 'R5' ? 1 : 0, TOL_GRAU, r.ativacoes[k].id);
  }
  perto(r.saida.z, 15, TOL_TEMPO, 'tempo');
});

caso('6.2 — U 80%, T 25 °C: só R8 com h = 1; saída ≈ 5,00 min', () => {
  const r = nucleo.calcular(80, 25, nucleo.REGRAS_PADRAO, 0.1);
  for (let k = 0; k < r.ativacoes.length; k++) {
    perto(r.ativacoes[k].h, r.ativacoes[k].id === 'R8' ? 1 : 0, TOL_GRAU, r.ativacoes[k].id);
  }
  perto(r.saida.z, 5, TOL_TEMPO, 'tempo');
});

// ---------- 6.3 Inferência completa com sobreposição ----------

caso('6.3 — U 35%, T 30 °C: R2, R3, R5 e R6 com h = 0,5; as demais 0', () => {
  const r = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  const ativas = ['R2', 'R3', 'R5', 'R6'];
  for (let k = 0; k < r.ativacoes.length; k++) {
    const id = r.ativacoes[k].id;
    perto(r.ativacoes[k].h, ativas.includes(id) ? 0.5 : 0, TOL_GRAU, id);
  }
  igual(r.recortes.length, 4, 'quantidade de recortes');
});

caso('6.3 — Agregação: μ(0) = 0; μ(3) = 0,2; μ(7,5) = 0,5; μ(15) = 0,5; μ(30) = 0,5', () => {
  const r = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  perto(nucleo.agregar(r.recortes, 0), 0, TOL_GRAU, 'μ(0)');
  perto(nucleo.agregar(r.recortes, 3), 0.2, TOL_GRAU, 'μ(3)');
  perto(nucleo.agregar(r.recortes, 7.5), 0.5, TOL_GRAU, 'μ(7,5)');
  perto(nucleo.agregar(r.recortes, 15), 0.5, TOL_GRAU, 'μ(15)');
  perto(nucleo.agregar(r.recortes, 30), 0.5, TOL_GRAU, 'μ(30)');
});

caso('6.3 — Três regras com "longo" não elevam a altura acima de 0,5 (máximo, não soma)', () => {
  const r = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  for (let z = 0; z <= 30; z += 0.25) {
    verdadeiro(nucleo.agregar(r.recortes, z) <= 0.5 + TOL_GRAU, `μ(${z}) passou de 0,5`);
  }
});

caso('6.3 — Centroide com Δz = 0,1: 16,785683 min (tela: 16,79)', () => {
  const r = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  verdadeiro(r.saida.valido, 'saída inválida');
  perto(r.saida.z, 16.785683, TOL_GRAU, 'z*');
  igual(r.saida.N, 300, 'N');
});

// ---------- 6.4 Simetria, alteração de regras e precisão ----------

caso('6.4 — U 35%, T 20 °C: R1, R2, R4, R5 com h = 0,5; agregação constante 0,5; saída 15,00', () => {
  const r = nucleo.calcular(35, 20, nucleo.REGRAS_PADRAO, 0.1);
  const ativas = ['R1', 'R2', 'R4', 'R5'];
  for (let k = 0; k < r.ativacoes.length; k++) {
    const id = r.ativacoes[k].id;
    perto(r.ativacoes[k].h, ativas.includes(id) ? 0.5 : 0, TOL_GRAU, id);
  }
  for (let z = 0; z <= 30; z += 0.5) perto(nucleo.agregar(r.recortes, z), 0.5, TOL_GRAU, `μ(${z})`);
  perto(r.saida.z, 15, TOL_TEMPO, 'tempo');
});

caso('6.4 — Todas as regras com "curto", U 50%, T 25 °C: ≈ 5,00 min', () => {
  const r = nucleo.calcular(50, 25, regrasTodasCom('curto'), 0.1);
  perto(r.saida.z, 5, TOL_TEMPO, 'tempo');
});

caso('6.4 — Base padrão de novo (Restaurar padrão), U 35%, T 30 °C: 16,79 min', () => {
  nucleo.calcular(50, 25, regrasTodasCom('curto'), 0.1); // a base alterada não mexe na padrão
  igual(nucleo.REGRAS_PADRAO[0].tempo, 'medio', 'R1 continua médio');
  const r = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  perto(r.saida.z, 16.79, TOL_TEMPO, 'tempo');
});

caso('6.4 — Passos: Δz 0,1 → 16,785683; 0,05 → 16,785706; 0,01 → 16,785714', () => {
  perto(nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1).saida.z, 16.785683, TOL_GRAU, 'Δz = 0,1');
  perto(nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.05).saida.z, 16.785706, TOL_GRAU, 'Δz = 0,05');
  perto(nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.01).saida.z, 16.785714, TOL_GRAU, 'Δz = 0,01');
});

// ---------- 6.5 Validação da interface e determinismo ----------

caso('6.5 — U −1%, U 101%, T 9 °C, T 41 °C, vazio e texto são recusados', () => {
  const U = { nome: 'Umidade', min: 0, max: 100 };
  const T = { nome: 'Temperatura', min: 10, max: 40 };
  verdadeiro(lerNumero('-1', U).erro, 'U = -1');
  verdadeiro(lerNumero('101', U).erro, 'U = 101');
  verdadeiro(lerNumero('9', T).erro, 'T = 9');
  verdadeiro(lerNumero('41', T).erro, 'T = 41');
  verdadeiro(lerNumero('', U).erro, 'vazio');
  verdadeiro(lerNumero('abc', T).erro, 'texto');
  verdadeiro(lerNumero('Infinity', T).erro, 'infinito');
  igual(lerNumero('35', U).valor, 35, 'U = 35 válido');
  igual(lerNumero('30,5', T).valor, 30.5, 'T = 30,5 válido');
});

caso('6.5 — Repetir a mesma configuração dá o mesmo resultado; etapa por etapa = Calcular', () => {
  const a = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  const b = nucleo.calcular(35, 30, nucleo.REGRAS_PADRAO, 0.1);
  igual(JSON.stringify(a) === JSON.stringify(b), true, 'repetição');

  // Etapa por etapa, como no botão "Avançar etapa"
  const graus = nucleo.fuzzificar(35, 30);
  const ativacoes = nucleo.avaliarRegras(graus, nucleo.REGRAS_PADRAO);
  const recortes = nucleo.implicar(ativacoes, nucleo.REGRAS_PADRAO);
  const saida = nucleo.defuzzificar(recortes, 0.1);
  igual(saida.z, a.saida.z, 'etapas × Calcular');
});

caso('2.3 — Sem regra ativada não há saída válida (não devolve 0)', () => {
  const saida = nucleo.defuzzificar([], 0.1);
  igual(saida.valido, false, 'válido');
  igual(saida.z, null, 'z');
});

// ---------- Mostrar os resultados ----------

let quantosPassaram = 0;
for (let k = 0; k < resultados.length; k++) {
  if (resultados[k].ok) quantosPassaram = quantosPassaram + 1;
}
const resumo = `${quantosPassaram} de ${resultados.length} testes passaram.`;

if (typeof document !== 'undefined') {
  let linhas = '';
  for (let k = 0; k < resultados.length; k++) {
    const r = resultados[k];
    linhas = linhas + `<tr class="${r.ok ? 'ok' : 'falha'}"><td>${r.nome}</td><td>${r.ok ? 'PASSOU' : 'FALHOU'}</td><td>${r.msg}</td></tr>`;
  }
  document.getElementById('resultados').innerHTML = linhas;
  document.getElementById('resumo').textContent = resumo;
} else {
  for (let k = 0; k < resultados.length; k++) {
    const r = resultados[k];
    console.log((r.ok ? 'PASSOU  ' : 'FALHOU  ') + r.nome + (r.msg ? '  → ' + r.msg : ''));
  }
  console.log(resumo);
}
