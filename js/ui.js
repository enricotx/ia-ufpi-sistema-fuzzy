// js/ui.js — eventos, sequência de etapas e logs
// Único arquivo que acessa o DOM junto com graficos.js. Não faz cálculos da inferência.
import * as nucleo from './nucleo.js';
import { lerNumero } from './validacao.js';
import { formatarDecimal } from './formato.js';

// Valores iniciais (enunciado 3): U = 35%, T = 30 °C, Δz = 0,1, base de regras padrão
const PADRAO = { U: 35, T: 30, dz: 0.1, consequentes: nucleo.REGRAS_PADRAO.map(r => r.tempo) };

const app = {
  etapa: 0,          // 0 = nada calculado; 1..5 = última etapa concluída
  resultados: null,  // saídas de cada etapa
  desatualizado: false,
};

// TODO: campos de U e T (numérico + deslizante), 9 seletores de consequente, seletor de Δz
// TODO: Calcular (5 etapas), Avançar etapa (uma por clique), Restaurar padrão
// TODO: qualquer alteração → resultados marcados como desatualizados e sequência reiniciada
// TODO: gráficos de entrada, tabela de regras com h(r), recorte da regra selecionada,
//       saída agregada com centroide, logs por etapa
