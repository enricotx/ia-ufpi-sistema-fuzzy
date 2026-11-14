// js/validacao.js — padrão do grupo
// Lê o texto de um campo e devolve { valor } ou { erro }. Nunca corrige o valor em silêncio.
export function lerNumero(texto, { nome, min = -Infinity, max = Infinity,
                                   inteiro = false, casas = null, minExclusivo = false }) {
  const bruto = String(texto ?? '').trim().replace(',', '.');
  if (bruto === '') return { erro: `${nome}: preencha este campo.` };
  if (!/^[+-]?\d+(\.\d+)?$/.test(bruto)) return { erro: `${nome}: digite um número válido.` };
  const valor = Number(bruto);
  if (!Number.isFinite(valor)) return { erro: `${nome}: o valor precisa ser finito.` };
  if (inteiro && !Number.isInteger(valor)) return { erro: `${nome}: use um número inteiro.` };
  if (casas !== null && (bruto.split('.')[1] ?? '').length > casas)
    return { erro: `${nome}: use no máximo ${casas} casas decimais.` };
  if (minExclusivo ? valor <= min : valor < min)
    return { erro: `${nome}: o valor deve ser ${minExclusivo ? 'maior que' : 'no mínimo'} ${min}.` };
  if (valor > max) return { erro: `${nome}: o valor deve ser no máximo ${max}.` };
  return { valor };
}

export function lerTexto(texto, { nome }) {
  const valor = String(texto ?? '').trim();
  if (valor === '') return { erro: `${nome}: preencha este campo.` };
  return { valor };
}
