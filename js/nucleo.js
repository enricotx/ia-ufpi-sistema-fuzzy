// js/nucleo.js — Sistema fuzzy Mamdani para o tempo de irrigação.
// Aqui fica só o cálculo: nada de tela (document). Uma função para cada etapa:
// fuzzificação → avaliação das regras → implicação → agregação → defuzzificação.
//
// Cada conjunto é descrito por quatro pontos [a, b, c, d] (enunciado 2.1).

// Enunciado 2.1: conjuntos fixos (a, b, c, d)
export const CONJUNTOS = {
  umidade: {
    seco: [0, 0, 20, 50],
    intermediario: [20, 50, 50, 80],
    umido: [50, 80, 100, 100],
  },
  temperatura: {
    baixa: [10, 10, 15, 25],
    media: [15, 25, 25, 35],
    alta: [25, 35, 40, 40],
  },
  tempo: {
    curto: [0, 0, 0, 15],
    medio: [0, 15, 15, 30],
    longo: [15, 30, 30, 30],
  },
};

// Enunciado 2.2: base de regras padrão (antecedentes fixos; o consequente pode ser trocado na tela)
export const REGRAS_PADRAO = [
  { id: 'R1', umidade: 'seco', temperatura: 'baixa', tempo: 'medio' },
  { id: 'R2', umidade: 'seco', temperatura: 'media', tempo: 'longo' },
  { id: 'R3', umidade: 'seco', temperatura: 'alta', tempo: 'longo' },
  { id: 'R4', umidade: 'intermediario', temperatura: 'baixa', tempo: 'curto' },
  { id: 'R5', umidade: 'intermediario', temperatura: 'media', tempo: 'medio' },
  { id: 'R6', umidade: 'intermediario', temperatura: 'alta', tempo: 'longo' },
  { id: 'R7', umidade: 'umido', temperatura: 'baixa', tempo: 'curto' },
  { id: 'R8', umidade: 'umido', temperatura: 'media', tempo: 'curto' },
  { id: 'R9', umidade: 'umido', temperatura: 'alta', tempo: 'curto' },
];

// Limites da saída (minutos)
export const TEMPO_MINIMO = 0;
export const TEMPO_MAXIMO = 30;

/** Enunciado 2.1: grau de pertinência de x no conjunto [a, b, c, d].
 *  Primeiro o trecho de pertinência 1 (b ≤ x ≤ c), depois as rampas.
 *  Assim, quando a = b ou c = d, a divisão por zero nunca acontece. */
export function pertinencia(x, conjunto) {
  const a = conjunto[0];
  const b = conjunto[1];
  const c = conjunto[2];
  const d = conjunto[3];

  if (x >= b && x <= c) return 1;          // topo
  if (x < a || x > d) return 0;            // fora do conjunto
  if (x < b) return (x - a) / (b - a);     // subida (aqui a < b, senão x < b < a já teria saído)
  return (d - x) / (d - c);                // descida (aqui c < x ≤ d, então c < d)
}

/** Etapa 1 — Fuzzificação: grau de U em cada conjunto de umidade
 *  e grau de T em cada conjunto de temperatura. */
export function fuzzificar(U, T) {
  const graus = { umidade: {}, temperatura: {} };
  for (const nome in CONJUNTOS.umidade) {
    graus.umidade[nome] = pertinencia(U, CONJUNTOS.umidade[nome]);
  }
  for (const nome in CONJUNTOS.temperatura) {
    graus.temperatura[nome] = pertinencia(T, CONJUNTOS.temperatura[nome]);
  }
  return graus;
}

/** Etapa 2 — Avaliação das regras: o "E" é o mínimo.
 *  h(r) = min(grau da umidade citada na regra, grau da temperatura citada na regra).
 *  Devolve uma lista com { id, grauUmidade, grauTemperatura, h } para cada regra. */
export function avaliarRegras(graus, regras) {
  const ativacoes = [];
  for (let k = 0; k < regras.length; k++) {
    const regra = regras[k];
    const grauUmidade = graus.umidade[regra.umidade];
    const grauTemperatura = graus.temperatura[regra.temperatura];
    ativacoes.push({
      id: regra.id,
      grauUmidade: grauUmidade,
      grauTemperatura: grauTemperatura,
      h: Math.min(grauUmidade, grauTemperatura),
    });
  }
  return ativacoes;
}

/** Etapa 3 — Implicação: cada regra recorta o seu conjunto de saída na altura h(r).
 *  Só entram as regras com h > 0 (regra com ativação zero não contribui).
 *  Devolve a lista de recortes { id, consequente, altura }. */
export function implicar(ativacoes, regras) {
  const recortes = [];
  for (let k = 0; k < regras.length; k++) {
    if (ativacoes[k].h > 0) {
      recortes.push({ id: regras[k].id, consequente: regras[k].tempo, altura: ativacoes[k].h });
    }
  }
  return recortes;
}

/** Valor de um recorte no ponto z: μr(z) = min(h(r), μconsequente(z)). */
export function valorRecorte(recorte, z) {
  return Math.min(recorte.altura, pertinencia(z, CONJUNTOS.tempo[recorte.consequente]));
}

/** Etapa 4 — Agregação: no ponto z, o MÁXIMO entre todos os recortes (nunca a soma). */
export function agregar(recortes, z) {
  let maior = 0;
  for (let k = 0; k < recortes.length; k++) {
    const v = valorRecorte(recortes[k], z);
    if (v > maior) maior = v;
  }
  return maior;
}

/** Etapa 5 — Defuzzificação pelo centroide, com pontos médios:
 *  N = 30 / Δz, z(k) = (k + 0,5)·Δz, z* = Σ z(k)·μ(z(k)) / Σ μ(z(k)).
 *  Se o denominador for zero, não existe saída válida (valido = false, z = null). */
export function defuzzificar(recortes, dz) {
  const N = Math.round((TEMPO_MAXIMO - TEMPO_MINIMO) / dz); // Math.round: 30 / 0,1 dá 299,999… no computador
  let numerador = 0;
  let denominador = 0;
  for (let k = 0; k < N; k++) {
    const z = TEMPO_MINIMO + (k + 0.5) * dz;
    const mu = agregar(recortes, z);
    numerador = numerador + z * mu;
    denominador = denominador + mu;
  }
  if (denominador === 0) {
    return { valido: false, z: null, numerador: numerador, denominador: denominador, N: N };
  }
  return { valido: true, z: numerador / denominador, numerador: numerador, denominador: denominador, N: N };
}

/** Executa as cinco etapas em sequência e devolve o resultado de cada uma.
 *  A tela usa isto no "Calcular"; o "Avançar etapa" chama as mesmas funções uma de cada vez. */
export function calcular(U, T, regras, dz) {
  const graus = fuzzificar(U, T);
  const ativacoes = avaliarRegras(graus, regras);
  const recortes = implicar(ativacoes, regras);
  const saida = defuzzificar(recortes, dz);
  return { graus: graus, ativacoes: ativacoes, recortes: recortes, saida: saida };
}
