// js/ui.js — tela do simulador: campos, botões, etapas, gráficos e log.
// Não faz conta fuzzy: chama as funções de js/nucleo.js e só mostra o resultado.
import * as nucleo from './nucleo.js';
import { lerNumero } from './validacao.js';
import { desenharGrafico } from './graficos.js';
import { formatarDecimal } from './formato.js';

const $ = (id) => document.getElementById(id);

// Nomes para a tela
const ROTULOS = {
  seco: 'seco', intermediario: 'intermediário', umido: 'úmido',
  baixa: 'baixa', media: 'média', alta: 'alta',
  curto: 'curto', medio: 'médio', longo: 'longo',
};
const CORES = ['#3d7ea6', '#b07a2a', '#7a4fa0'];
const COR_DESTAQUE = '#d9480f';
const NOMES_ETAPAS = ['', 'Fuzzificação', 'Avaliação das regras', 'Implicação', 'Agregação', 'Defuzzificação'];
const PADRAO = { umidade: '35', temperatura: '30', dz: '0.1' };

// Estado único da tela
const app = {
  etapa: 0,            // 0 = nada calculado; 1..5 = última etapa concluída
  params: null,        // configuração usada no cálculo mostrado { U, T, regras, dz }
  r: {},               // resultados das etapas { graus, ativacoes, recortes, saida }
  log: [],             // linhas do log { etapa, texto }
  desatualizado: false,
  invalido: false,
  regraSelecionada: 'R2',
};

// ---------- formatação ----------

function grau(x) {
  return x.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
}
function minutos(x, casas) {
  return formatarDecimal(x, casas);
}

// ---------- leitura dos campos ----------

function regrasDaTela() {
  const regras = [];
  for (const r of nucleo.REGRAS_PADRAO) {
    regras.push({ id: r.id, umidade: r.umidade, temperatura: r.temperatura, tempo: $('cons-' + r.id).value });
  }
  return regras;
}

function lerTela() {
  const u = lerNumero($('c-umidade').value, { nome: 'Umidade do solo', min: 0, max: 100 });
  const t = lerNumero($('c-temperatura').value, { nome: 'Temperatura', min: 10, max: 40 });
  const erros = { umidade: u.erro || '', temperatura: t.erro || '' };
  if (u.erro || t.erro) return { params: null, erros };
  return { params: { U: u.valor, T: t.valor, regras: regrasDaTela(), dz: Number($('c-dz').value) }, erros };
}

function pintarErros(erros) {
  let qtd = 0;
  for (const campo of ['umidade', 'temperatura']) {
    $('erro-' + campo).textContent = erros[campo];
    $('campo-' + campo).classList.toggle('invalido', erros[campo] !== '');
    $('c-' + campo).setAttribute('aria-invalid', erros[campo] !== '' ? 'true' : 'false');
    if (erros[campo]) qtd++;
  }
  $('resumo-erros').textContent = qtd === 0 ? '' : (qtd === 1 ? '1 campo inválido: o cálculo está bloqueado.' : `${qtd} campos inválidos: o cálculo está bloqueado.`);
}

// ---------- montagem inicial ----------

function montarRegrasConfig() {
  let h = '';
  for (const r of nucleo.REGRAS_PADRAO) {
    h += `<tr><td>${r.id}</td><td>${ROTULOS[r.umidade]}</td><td>${ROTULOS[r.temperatura]}</td><td>`
      + `<select id="cons-${r.id}" aria-label="Consequente da regra ${r.id}">`
      + ['curto', 'medio', 'longo'].map((t) => `<option value="${t}">${ROTULOS[t]}</option>`).join('')
      + '</select></td></tr>';
  }
  $('regras-config').innerHTML = h;
}

function restaurarCampos() {
  $('c-umidade').value = PADRAO.umidade;
  $('c-temperatura').value = PADRAO.temperatura;
  $('r-umidade').value = PADRAO.umidade;
  $('r-temperatura').value = PADRAO.temperatura;
  $('c-dz').value = PADRAO.dz;
  for (const r of nucleo.REGRAS_PADRAO) $('cons-' + r.id).value = r.tempo;
  marcarRegrasAlteradas();
}

function marcarRegrasAlteradas() {
  for (const r of nucleo.REGRAS_PADRAO) {
    $('cons-' + r.id).classList.toggle('alterado', $('cons-' + r.id).value !== r.tempo);
  }
}

// ---------- etapas ----------

// Começa uma sequência nova com a configuração atual (se for válida).
function comecarDoZero() {
  const lido = lerTela();
  pintarErros(lido.erros);
  if (!lido.params) { app.invalido = true; return false; }
  app.params = lido.params;
  app.r = {};
  app.log = [];
  app.etapa = 0;
  app.desatualizado = false;
  app.invalido = false;
  return true;
}

// Executa a próxima etapa, chamando a função correspondente do núcleo.
function executarEtapa() {
  const p = app.params;
  const proxima = app.etapa + 1;

  if (proxima === 1) {
    app.r.graus = nucleo.fuzzificar(p.U, p.T);
    const gu = app.r.graus.umidade, gt = app.r.graus.temperatura;
    app.log.push({ etapa: 1, texto: `Fuzzificação: U = ${grau(p.U)}% → seco ${grau(gu.seco)}; intermediário ${grau(gu.intermediario)}; úmido ${grau(gu.umido)}.` });
    app.log.push({ etapa: 1, texto: `Fuzzificação: T = ${grau(p.T)} °C → baixa ${grau(gt.baixa)}; média ${grau(gt.media)}; alta ${grau(gt.alta)}.` });
  }

  if (proxima === 2) {
    app.r.ativacoes = nucleo.avaliarRegras(app.r.graus, p.regras);
    for (let k = 0; k < p.regras.length; k++) {
      const a = app.r.ativacoes[k], r = p.regras[k];
      app.log.push({ etapa: 2, texto: `${r.id} (${ROTULOS[r.umidade]} E ${ROTULOS[r.temperatura]}): min(${grau(a.grauUmidade)}; ${grau(a.grauTemperatura)}) = ${grau(a.h)}` });
    }
  }

  if (proxima === 3) {
    app.r.recortes = nucleo.implicar(app.r.ativacoes, p.regras);
    if (app.r.recortes.length === 0) app.log.push({ etapa: 3, texto: 'Implicação: nenhuma regra foi ativada.' });
    for (const rc of app.r.recortes) {
      app.log.push({ etapa: 3, texto: `Implicação ${rc.id}: consequente ${ROTULOS[rc.consequente]} recortado em ${grau(rc.altura)}.` });
    }
  }

  if (proxima === 4) {
    const nomes = [];
    for (const rc of app.r.recortes) if (!nomes.includes(ROTULOS[rc.consequente])) nomes.push(ROTULOS[rc.consequente]);
    const pontos = [0, 7.5, 15, 22.5, 30].map((z) => `μ(${grau(z)}) = ${grau(nucleo.agregar(app.r.recortes, z))}`).join('; ');
    app.log.push({ etapa: 4, texto: nomes.length === 0
      ? 'Agregação: não há recortes para agregar.'
      : `Agregação: máximo, ponto a ponto, entre ${nomes.join(' e ')} recortados (sem somar). ${pontos}.` });
  }

  if (proxima === 5) {
    app.r.saida = nucleo.defuzzificar(app.r.recortes, p.dz);
    const s = app.r.saida;
    app.log.push({ etapa: 5, texto: s.valido
      ? `Centroide: Σ z·μ = ${grau(s.numerador)}; Σ μ = ${grau(s.denominador)}; N = ${s.N} pontos com Δz = ${grau(p.dz)} → z* = ${minutos(s.z, 6)} min (${minutos(s.z, 2)} min).`
      : 'Centroide: o denominador é zero, então não há saída agregada válida.' });
  }

  app.etapa = proxima;
}

// ---------- botões ----------

function calcular() {
  if (!comecarDoZero()) { renderizar(); return; }
  while (app.etapa < 5) executarEtapa(); // as mesmas funções do "Avançar etapa", em sequência
  renderizar();
}

function avancar() {
  if (app.etapa === 0 || app.etapa === 5 || app.desatualizado) {
    if (!comecarDoZero()) { renderizar(); return; }
  }
  executarEtapa();
  renderizar();
}

function restaurar() {
  restaurarCampos();
  pintarErros({ umidade: '', temperatura: '' });
  app.etapa = 0; app.params = null; app.r = {}; app.log = [];
  app.desatualizado = false; app.invalido = false;
  $('aviso-log').textContent = '';
  renderizar();
}

function aoEditar(ev) {
  // deslizante → campo de texto e campo de texto → deslizante
  if (ev && ev.target.id === 'r-umidade') $('c-umidade').value = ev.target.value;
  if (ev && ev.target.id === 'r-temperatura') $('c-temperatura').value = ev.target.value;
  const lido = lerTela();
  pintarErros(lido.erros);
  if (lido.params) {
    if (ev && ev.target.id === 'c-umidade') $('r-umidade').value = lido.params.U;
    if (ev && ev.target.id === 'c-temperatura') $('r-temperatura').value = lido.params.T;
  }
  marcarRegrasAlteradas();
  app.invalido = !lido.params;
  if (app.etapa > 0) app.desatualizado = true; // resultados antigos ficam marcados e a sequência recomeça
  renderizar();
}

async function copiarLog() {
  if (app.log.length === 0) { $('aviso-log').textContent = 'Ainda não há log.'; return; }
  const p = app.params;
  const cab = `Sistema Fuzzy Mamdani — U = ${grau(p.U)}%, T = ${grau(p.T)} °C, Δz = ${grau(p.dz)}; regras: `
    + p.regras.map((r) => `${r.id}→${ROTULOS[r.tempo]}`).join(', ');
  const texto = [cab, ...app.log.map((l) => `[${l.etapa}. ${NOMES_ETAPAS[l.etapa]}] ${l.texto}`)].join('\n');
  try {
    await navigator.clipboard.writeText(texto);
    $('aviso-log').textContent = 'Log copiado.';
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = texto; document.body.append(ta); ta.select();
    document.execCommand('copy'); ta.remove();
    $('aviso-log').textContent = 'Log copiado.';
  }
}

// ---------- desenho da tela ----------

function textoStatus() {
  if (app.invalido) return ['invalido', 'Corrija os campos destacados'];
  if (app.desatualizado) return ['desatualizado', 'Configuração alterada — clique em Calcular ou Avançar etapa'];
  if (app.etapa === 0) return ['', 'Pronto para calcular'];
  if (app.etapa === 5) return ['calculado', 'Cálculo concluído'];
  return ['etapa', `Etapa ${app.etapa} de 5: ${NOMES_ETAPAS[app.etapa]}`];
}

let modoAnunciado = '';
function renderizarStatus() {
  const [classe, texto] = textoStatus();
  $('status').className = 'status ' + classe;
  $('status').textContent = texto;
  if (texto !== modoAnunciado) { $('anuncio').textContent = texto; modoAnunciado = texto; }

  $('btn-calcular').disabled = app.invalido;
  $('btn-avancar').disabled = app.invalido || (app.etapa === 5 && !app.desatualizado);
  $('resultados').classList.toggle('desatualizado', app.desatualizado);

  for (const li of document.querySelectorAll('#etapas li')) {
    const n = Number(li.dataset.etapa);
    li.classList.toggle('feita', n <= app.etapa && !(n === app.etapa && app.etapa < 5));
    li.classList.toggle('atual', n === app.etapa && app.etapa < 5);
  }
  $('m-etapa').innerHTML = `${app.etapa} <small>de 5</small>`;
}

function renderizarMetricas() {
  if (app.etapa >= 2) {
    let ativas = 0;
    for (const a of app.r.ativacoes) if (a.h > 0) ativas++;
    $('m-regras').innerHTML = `${ativas} <small>de 9</small>`;
  } else {
    $('m-regras').textContent = '—';
  }
  let tempo = 'ainda não calculado';
  if (app.etapa === 5) tempo = app.r.saida.valido ? `${minutos(app.r.saida.z, 2)} min` : 'sem saída válida';
  $('m-tempo').textContent = tempo;
  $('tempo-final').textContent = app.etapa === 5 ? tempo : '—';
}

function conjuntosDe(variavel, fraco) {
  const lista = [];
  let i = 0;
  for (const nome in nucleo.CONJUNTOS[variavel]) {
    lista.push({ rotulo: ROTULOS[nome], pontos: nucleo.CONJUNTOS[variavel][nome], cor: CORES[i], fraco: fraco });
    i++;
  }
  return lista;
}

function renderizarEntradas() {
  const temGraus = app.etapa >= 1;
  desenharGrafico($('g-umidade'), {
    min: 0, max: 100, ticksX: [0, 20, 50, 80, 100], rotuloX: 'Umidade do solo U (%)',
    conjuntos: conjuntosDe('umidade'),
    linhas: temGraus ? [{ x: app.params.U, cor: COR_DESTAQUE, rotulo: `U = ${grau(app.params.U)}%` }] : [],
  });
  desenharGrafico($('g-temperatura'), {
    min: 10, max: 40, ticksX: [10, 15, 25, 35, 40], rotuloX: 'Temperatura T (°C)',
    conjuntos: conjuntosDe('temperatura'),
    linhas: temGraus ? [{ x: app.params.T, cor: COR_DESTAQUE, rotulo: `T = ${grau(app.params.T)} °C` }] : [],
  });
  for (const variavel of ['umidade', 'temperatura']) {
    let h = '', i = 0;
    for (const nome in nucleo.CONJUNTOS[variavel]) {
      const g = temGraus ? app.r.graus[variavel][nome] : null;
      h += `<span class="${g === 0 ? 'zero' : ''}" style="border-left-color:${CORES[i]}">μ${ROTULOS[nome]} = ${g === null ? '—' : grau(g)}</span>`;
      i++;
    }
    $('graus-' + variavel).innerHTML = h;
  }
}

function renderizarRegras() {
  const regras = app.params ? app.params.regras : regrasDaTela();
  let h = '';
  for (let k = 0; k < regras.length; k++) {
    const r = regras[k];
    const a = app.etapa >= 2 ? app.r.ativacoes[k] : null;
    const classes = ['regra'];
    if (a && a.h > 0) classes.push('ativa');
    if (r.id === app.regraSelecionada) classes.push('selecionada');
    h += `<tr class="${classes.join(' ')}" data-id="${r.id}" tabindex="0">`
      + `<td><b class="mono">${r.id}</b> ${ROTULOS[r.umidade]} E ${ROTULOS[r.temperatura]}</td>`
      + `<td class="mono">${a ? grau(a.grauUmidade) : '—'}</td>`
      + `<td class="mono">${a ? grau(a.grauTemperatura) : '—'}</td>`
      + `<td class="mono h">${a ? grau(a.h) : '—'}</td>`
      + `<td><div class="barra"><i style="width:${a ? a.h * 100 : 0}%"></i></div></td>`
      + `<td>${ROTULOS[r.tempo]}</td></tr>`;
  }
  $('tabela-regras').innerHTML = h;

  // regra selecionada: consequente original (tracejado) e recorte (preenchido)
  let k = 0;
  while (k < regras.length - 1 && regras[k].id !== app.regraSelecionada) k++;
  const r = regras[k];
  const a = app.etapa >= 2 ? app.r.ativacoes[k] : null;
  const cons = nucleo.CONJUNTOS.tempo[r.tempo];
  const recortar = app.etapa >= 3 && a && a.h > 0;
  $('titulo-regra').textContent = `${r.id}: SE solo ${ROTULOS[r.umidade]} E temperatura ${ROTULOS[r.temperatura]} ENTÃO tempo ${ROTULOS[r.tempo]}`;
  desenharGrafico($('g-regra'), {
    min: 0, max: 30, ticksX: [0, 15, 30], rotuloX: 'Tempo de irrigação z (min)',
    conjuntos: [{ rotulo: ROTULOS[r.tempo] + ' (original)', pontos: cons, cor: '#6e5f4c', tracejado: true }],
    areas: recortar ? [{ funcao: (z) => Math.min(a.h, nucleo.pertinencia(z, cons)), cor: COR_DESTAQUE, alfa: 0.3 }] : [],
  });
  let texto;
  if (!a) texto = 'A ativação aparece na etapa 2.';
  else if (a.h === 0) texto = `h = min(${grau(a.grauUmidade)}; ${grau(a.grauTemperatura)}) = 0: a regra não contribui para a saída.`;
  else if (app.etapa < 3) texto = `h = min(${grau(a.grauUmidade)}; ${grau(a.grauTemperatura)}) = ${grau(a.h)}. O recorte aparece na etapa 3.`;
  else texto = `h = min(${grau(a.grauUmidade)}; ${grau(a.grauTemperatura)}) = ${grau(a.h)}: μ(z) = min(${grau(a.h)}; μ${ROTULOS[r.tempo]}(z)).`;
  $('texto-regra').textContent = texto;
}

function renderizarSaida() {
  const linhas = [];
  const areas = [];
  const conjuntos = conjuntosDe('tempo', app.etapa >= 4);
  if (app.etapa === 3) {
    // cada recorte separado, ainda sem agregar
    for (const rc of app.r.recortes) {
      areas.push({ funcao: (z) => nucleo.valorRecorte(rc, z), cor: COR_DESTAQUE, alfa: 0.12 });
    }
  }
  if (app.etapa >= 4) {
    areas.push({ funcao: (z) => nucleo.agregar(app.r.recortes, z), cor: COR_DESTAQUE, alfa: 0.35 });
  }
  if (app.etapa === 5 && app.r.saida.valido) {
    linhas.push({ x: app.r.saida.z, cor: '#2a1d10', rotulo: `z* = ${minutos(app.r.saida.z, 2)} min` });
  }
  desenharGrafico($('g-saida'), {
    min: 0, max: 30, ticksX: [0, 5, 10, 15, 20, 25, 30], rotuloX: 'Tempo de irrigação z (min)',
    conjuntos, areas, linhas,
  });
  const s = app.r.saida;
  $('conta').textContent = app.etapa === 5
    ? (s.valido ? `z* = Σ z·μ / Σ μ = ${grau(s.numerador)} / ${grau(s.denominador)} = ${minutos(s.z, 6)} (N = ${s.N}, Δz = ${grau(app.params.dz)})`
      : 'Não há saída agregada válida (Σ μ = 0).')
    : (app.etapa === 4 ? 'Área agregada pronta; o centroide é a etapa 5.' : '');
}

function renderizarLog() {
  if (app.log.length === 0) {
    $('log').innerHTML = '<li class="vazio">Clique em Calcular ou Avançar etapa.</li>';
    return;
  }
  $('log').innerHTML = '';
  for (const l of app.log) {
    const li = document.createElement('li');
    li.textContent = l.texto;
    $('log').append(li);
  }
}

function renderizar() {
  renderizarStatus();
  renderizarMetricas();
  renderizarEntradas();
  renderizarRegras();
  renderizarSaida();
  renderizarLog();
}

// ---------- ligações ----------

montarRegrasConfig();
restaurarCampos();
for (const id of ['c-umidade', 'c-temperatura', 'r-umidade', 'r-temperatura', 'c-dz']) $(id).addEventListener('input', aoEditar);
$('regras-config').addEventListener('change', aoEditar);
$('btn-calcular').addEventListener('click', calcular);
$('btn-avancar').addEventListener('click', avancar);
$('btn-restaurar').addEventListener('click', restaurar);
$('btn-copiar-log').addEventListener('click', copiarLog);
$('tabela-regras').addEventListener('click', (ev) => {
  const tr = ev.target.closest('tr[data-id]');
  if (tr) { app.regraSelecionada = tr.dataset.id; renderizarRegras(); }
});
$('tabela-regras').addEventListener('keydown', (ev) => {
  const tr = ev.target.closest('tr[data-id]');
  if (tr && (ev.key === 'Enter' || ev.key === ' ')) {
    ev.preventDefault();
    app.regraSelecionada = tr.dataset.id;
    renderizarRegras();
    document.querySelector(`#tabela-regras tr[data-id="${tr.dataset.id}"]`).focus();
  }
});
document.addEventListener('simulador:aberto', renderizar);
renderizar();
