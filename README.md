# Sistema Fuzzy (Mamdani): tempo de irrigação de um jardim

Atividade Prática de Inteligência Artificial — UFPI, período 2026.2

**Aplicação:** https://enricotx.github.io/ia-ufpi-sistema-fuzzy/
**Código-fonte:** https://github.com/enricotx/ia-ufpi-sistema-fuzzy
**Testes no navegador:** https://enricotx.github.io/ia-ufpi-sistema-fuzzy/testes.html

## Autores
- [Nome Completo] — [matrícula]
- [Nome Completo] — [matrícula]

## Problema
Recomendar o tempo de irrigação z (0 a 30 min) a partir da umidade do solo U (0 a 100 %) e da
temperatura T (10 a 40 °C), com inferência Mamdani: fuzzificação, avaliação das regras (mínimo),
implicação (recorte por mínimo), agregação (máximo) e defuzzificação (centroide numérico).

## Modelo Mamdani
_TODO: funções de pertinência (a, b, c, d), tratamento dos extremos, operadores e centroide por
pontos médios._

### Conjuntos
| Variável | Conjunto | (a, b, c, d) |
| --- | --- | --- |
| Umidade (%) | seco | (0, 0, 20, 50) |
| Umidade (%) | intermediário | (20, 50, 50, 80) |
| Umidade (%) | úmido | (50, 80, 100, 100) |
| Temperatura (°C) | baixa | (10, 10, 15, 25) |
| Temperatura (°C) | média | (15, 25, 25, 35) |
| Temperatura (°C) | alta | (25, 35, 40, 40) |
| Tempo (min) | curto | (0, 0, 0, 15) |
| Tempo (min) | médio | (0, 15, 15, 30) |
| Tempo (min) | longo | (15, 30, 30, 30) |

### Regras padrão
| Regra | Umidade | Temperatura | Tempo |
| --- | --- | --- | --- |
| R1 | seco | baixa | médio |
| R2 | seco | média | longo |
| R3 | seco | alta | longo |
| R4 | intermediário | baixa | curto |
| R5 | intermediário | média | médio |
| R6 | intermediário | alta | longo |
| R7 | úmido | baixa | curto |
| R8 | úmido | média | curto |
| R9 | úmido | alta | curto |

## Como usar
_TODO: campos, Calcular, Avançar etapa, Restaurar padrão._

Para rodar localmente, abra a pasta no VS Code e use a extensão Live Server, ou rode
`python -m http.server` e acesse `http://localhost:8000`. Abrir o `index.html` direto pelo
explorador de arquivos não funciona, porque o código usa módulos ES.

## Parâmetros
| Campo | Intervalo | Valor inicial |
| --- | --- | --- |
| Umidade do solo (%) | 0 a 100 | 35 |
| Temperatura (°C) | 10 a 40 | 30 |
| Consequente de cada regra | curto, médio ou longo | base padrão |
| Passo de defuzzificação Δz (min) | 0,1; 0,05 ou 0,01 | 0,1 |

## Estrutura do código
| Arquivo | Função |
| --- | --- |
| `index.html` | aplicação |
| `testes.html` | executa os testes da seção 6 do enunciado |
| `css/estilo.css` | estilos (padrão do grupo) |
| `js/nucleo.js` | inferência Mamdani: funções puras, sem DOM |
| `js/validacao.js` | leitura e validação dos campos |
| `js/formato.js` | formatação pt-BR |
| `js/graficos.js` | gráficos de pertinência |
| `js/ui.js` | eventos, sequência de etapas e logs |
| `js/testes.js` | casos de teste |

## Bibliotecas auxiliares
| Biblioteca | Versão | Finalidade |
| --- | --- | --- |
| Chart.js | 4.4.1 | gráficos dos conjuntos de entrada e saída |

Nenhuma biblioteca de IA ou de lógica fuzzy foi usada.

## Testes de validação
_TODO: para cada item da seção 6 do enunciado — Entradas e parâmetros · Esperado · Obtido · Conclusão._

### 6.1 — Pertinências e extremos
### 6.2 — Ativação de uma única regra
### 6.3 — Inferência completa com sobreposição
### 6.4 — Simetria, alteração de regras e precisão
### 6.5 — Validação da interface e determinismo

## Análise dos resultados
_TODO: efeito do passo Δz (0,1; 0,05; 0,01) em relação ao centroide contínuo 16,785714 min e
interpretação das alterações de regras._

## Limitações
_TODO_
