// js/formato.js — padrão do grupo: formatação pt-BR só na exibição
export function formatarDecimal(x, casas = 2) {
  return x.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
