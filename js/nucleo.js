// js/nucleo.js — sistema fuzzy Mamdani (funções puras, sem DOM)
// Uma função por etapa: fuzzificação, avaliação das regras, implicação, agregação, defuzzificação.

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

// Enunciado 2.2: base de regras padrão (antecedentes fixos; consequente editável)
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

/** Enunciado 2.1: pertinência trapezoidal. Avalia o trecho de pertinência 1 antes das rampas. */
export function pertinencia(x, [a, b, c, d]) {
  // TODO
}

/** Etapa 1: graus de U e de T em cada conjunto. → { umidade: {...}, temperatura: {...} } */
export function fuzzificar(U, T) {
  // TODO
}

/** Etapa 2: h(r) = min(μumidade, μtemperatura) para cada regra. */
export function avaliarRegras(graus, regras) {
  // TODO
}

/** Etapa 3: recorte de cada consequente na altura h(r): μr(z) = min(h(r), μconsequente(z)). */
export function implicar(ativacoes, regras) {
  // TODO
}

/** Etapa 4: μagregada(z) = máximo entre os recortes (nunca soma). */
export function agregar(recortes, z) {
  // TODO
}

/** Etapa 5: centroide por pontos médios, z(k) = (k + 0,5)·Δz. Denominador zero → sem saída válida. */
export function defuzzificar(funcaoAgregada, dz) {
  // TODO
}
