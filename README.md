# Sistema Fuzzy (Mamdani): tempo de irrigação de um jardim

Atividade Prática de Inteligência Artificial — UFPI, período 2026.2

**Aplicação:** https://enricotx.github.io/ia-ufpi-sistema-fuzzy/
**Código-fonte:** https://github.com/enricotx/ia-ufpi-sistema-fuzzy
**Testes no navegador:** https://enricotx.github.io/ia-ufpi-sistema-fuzzy/testes.html

## Autores

- Enrico da Rocha Santos Teixeira — 20239046134
- João Pedro de Sousa Moura — 20249022038

## Problema

Recomendar o tempo de irrigação z (0 a 30 min) de um jardim a partir da umidade do solo U (0% a
100%) e da temperatura T (10 °C a 40 °C), com um sistema fuzzy Mamdani. Não há simulação da água no
solo, sensores nem controle de equipamentos.

## Modelo Mamdani

O cálculo fica todo em `js/nucleo.js`, sem acesso à tela, com uma função para cada etapa.

**Funções de pertinência.** Cada conjunto é dado por quatro pontos (a, b, c, d), com a ≤ b ≤ c ≤ d:

- se b ≤ x ≤ c, μ(x) = 1 (avaliado **primeiro**);
- se x < a ou x > d, μ(x) = 0;
- subida, a ≤ x < b: μ(x) = (x − a)/(b − a);
- descida, c < x ≤ d: μ(x) = (d − x)/(d − c).

Como o topo é testado antes das rampas, quando a = b ou c = d a divisão correspondente nunca é
calculada. Por isso μseco(0) = 1, μúmido(100) = 1, μcurto(0) = 1 e μlongo(30) = 1, sem divisão por
zero.

**Etapas.**

1. **Fuzzificação (`fuzzificar`):** os três graus de U (seco, intermediário, úmido) e os três de T
   (baixa, média, alta).
2. **Avaliação das regras (`avaliarRegras`):** o E é o mínimo:
   h(r) = min(μumidade(U), μtemperatura(T)).
3. **Implicação (`implicar`):** cada regra com h > 0 recorta o seu consequente na altura h:
   μr(z) = min(h(r), μconsequente(z)). Regras com h = 0 não contribuem.
4. **Agregação (`agregar`):** em cada z, o **máximo** entre os recortes. Nunca somamos as áreas, e
   várias regras com o mesmo consequente não elevam a altura acima do maior h.
5. **Defuzzificação (`defuzzificar`):** centroide por pontos médios. Com N = 30/Δz e
   z(k) = (k + 0,5)·Δz, para k de 0 a N − 1:
   z\* = Σ z(k)·μagregada(z(k)) / Σ μagregada(z(k)).
   Se Σ μ = 0, o resultado é "sem saída agregada válida", e não zero.

N é calculado com `Math.round(30 / Δz)`, porque no computador 30 / 0,1 dá 299,999…. A precisão é
mantida em todo o cálculo; só a tela arredonda (2 casas no tempo).

Um grau de pertinência é a compatibilidade da entrada com um termo linguístico, não uma
probabilidade. Por isso os graus de uma variável não precisam somar 1.

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

| Regra | SE o solo é | E a temperatura é | ENTÃO o tempo é |
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

1. Abra a aplicação e clique em **Iniciar**.
2. Informe a **umidade** e a **temperatura**, pelo campo numérico ou pelo deslizante. Os campos
   aceitam vírgula decimal. Vazio, texto, valor infinito ou fora do intervalo bloqueiam o cálculo e
   mostram uma mensagem abaixo do campo. O valor nunca é corrigido em silêncio.
3. Se quiser, troque o **consequente** de cada regra (curto, médio ou longo) e o **passo Δz**.
4. Use os botões:
   - **Calcular:** executa as cinco etapas de uma vez.
   - **Avançar etapa:** executa uma etapa por clique, na ordem, para acompanhar o cálculo. O
     resultado final é o mesmo do Calcular.
   - **Restaurar padrão:** volta para U = 35%, T = 30 °C, a base padrão e Δz = 0,1, e limpa os
     resultados.
5. Acompanhe o resultado:
   - **Fuzzificação:** gráficos dos conjuntos de umidade e de temperatura, com a entrada marcada
     por uma linha vertical e todos os graus, inclusive os zeros.
   - **Regras:** a base completa, com os graus dos antecedentes, o mínimo e h(r). As regras
     ativadas ficam destacadas. Clicar numa regra mostra o consequente original (tracejado) e o
     recorte da implicação (preenchido).
   - **Agregação e defuzzificação:** curto, médio e longo, a região agregada preenchida (máximo dos
     recortes), a linha do centroide e o tempo em minutos, com a conta Σ z·μ / Σ μ.
   - **Log das etapas:** o que aconteceu em cada etapa, com os valores; o botão **Copiar log**
     copia o texto.

Ao mudar qualquer campo depois de calcular, os resultados ficam apagados e marcados como
desatualizados, e a sequência de etapas recomeça.

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
| `index.html` | tela inicial e simulador |
| `testes.html` | executa os testes da seção 6 do enunciado |
| `css/estilo.css` | estilos |
| `js/nucleo.js` | inferência Mamdani: funções puras, sem DOM |
| `js/validacao.js` | leitura e validação dos campos |
| `js/formato.js` | formatação pt-BR |
| `js/graficos.js` | gráficos de pertinência em SVG |
| `js/ui.js` | campos, botões, sequência de etapas, gráficos e log |
| `js/abertura.js` | tela inicial animada |
| `js/prng.js` | gerador com semente, usado só na animação da tela inicial |
| `js/testes.js` | casos de teste da seção 6 |

| Função do núcleo | Etapa |
| --- | --- |
| `pertinencia(x, [a, b, c, d])` | grau de pertinência |
| `fuzzificar(U, T)` | 1. fuzzificação |
| `avaliarRegras(graus, regras)` | 2. avaliação das regras (mínimo) |
| `implicar(ativacoes, regras)` / `valorRecorte(recorte, z)` | 3. implicação (recorte) |
| `agregar(recortes, z)` | 4. agregação (máximo) |
| `defuzzificar(recortes, Δz)` | 5. centroide por pontos médios |
| `calcular(U, T, regras, Δz)` | as cinco etapas em sequência |

## Bibliotecas auxiliares

Nenhuma. Os gráficos são SVG desenhados à mão (`js/graficos.js`) e a animação da tela inicial usa
canvas. Nenhuma biblioteca de IA ou lógica fuzzy foi usada.

## Testes de validação

Todos os testes abaixo estão em `js/testes.js` e rodam em
[`testes.html`](https://enricotx.github.io/ia-ufpi-sistema-fuzzy/testes.html): **18 de 18
passaram**. Salvo indicação, base padrão e Δz = 0,1. Tolerâncias: 0,000001 para graus e ativações,
0,01 min para os tempos.

### 6.1 — Pertinências e extremos

| Entrada | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| U = 35% | seco 0,5; intermediário 0,5; úmido 0 | 0,5; 0,5; 0 | correto |
| T = 30 °C | baixa 0; média 0,5; alta 0,5 | 0; 0,5; 0,5 | correto |
| U = 0% / U = 100% | (1, 0, 0) / (0, 0, 1) | (1, 0, 0) / (0, 0, 1) | correto |
| T = 10 °C / T = 40 °C | (1, 0, 0) / (0, 0, 1) | (1, 0, 0) / (0, 0, 1) | correto |
| μcurto(0), μlongo(30); todos os conjuntos de −5 a 105 | 1 e 1; nenhum NaN ou infinito | 1 e 1; todos entre 0 e 1 | sem divisão por zero |

### 6.2 — Ativação de uma única regra

| Entrada | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| U = 20%, T = 35 °C | só R3 com h = 1; ≈ 25,00 min | só R3 = 1; 24,999889 min (25,00) | correto |
| U = 50%, T = 25 °C | só R5 com h = 1; 15,00 min | só R5 = 1; 15,000000 min | correto |
| U = 80%, T = 25 °C | só R8 com h = 1; ≈ 5,00 min | só R8 = 1; 5,000111 min (5,00) | correto |

Os valores 5 e 25 são os centroides dos triângulos curto e longo (um terço da base a partir do
ângulo reto), não os picos 0 e 30. Por isso solo úmido não significa tempo zero neste modelo.

### 6.3 — Inferência completa com sobreposição

Entrada: U = 35%, T = 30 °C, base padrão, Δz = 0,1.

| Etapa | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| Fuzzificação | seco 0,5; intermediário 0,5; úmido 0; baixa 0; média 0,5; alta 0,5 | iguais | correto |
| Regras | R2, R3, R5 e R6 com h = 0,5; as demais 0 | iguais (4 recortes) | correto |
| Agregação | μ(0) = 0; μ(3) = 0,2; μ(7,5) = 0,5; μ(15) = 0,5; μ(30) = 0,5 | iguais | correto |
| Máximo, não soma | três regras com "longo" não passam de 0,5 | μ ≤ 0,5 em todo z | correto |
| Centroide | 16,785683 min (tela 16,79) | Σ z·μ = 2.203,1208; Σ μ = 131,25; N = 300 → **16,785683** (tela 16,79) | correto |

Log da aplicação (trecho): "R2 (seco E média): min(0,5; 0,5) = 0,5" · "Implicação R2: consequente
longo recortado em 0,5." · "Agregação: máximo, ponto a ponto, entre longo e médio recortados (sem
somar)." · "Centroide: … → z\* = 16,785683 min (16,79 min)."

### 6.4 — Simetria, alteração de regras e precisão

| Entrada | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| U = 35%, T = 20 °C | R1, R2, R4, R5 com h = 0,5; agregação 0,5 constante; 15,00 min | iguais; 15,000000 min | correto |
| Todas as regras "curto", U = 50%, T = 25 °C | ≈ 5,00 min | 5,00 min | correto |
| Restaurar padrão e calcular U = 35%, T = 30 °C | regras e entradas iniciais; 16,79 min | R1 volta a médio; 16,79 min | correto |

**Efeito do passo Δz** (U = 35%, T = 30 °C):

| Δz | N | Esperado | Obtido | Diferença para o centroide contínuo (16,785714) |
| --- | --- | --- | --- | --- |
| 0,1 | 300 | 16,785683 | 16,785683 | −3,2 × 10⁻⁵ |
| 0,05 | 600 | 16,785706 | 16,785706 | −7,7 × 10⁻⁶ |
| 0,01 | 3.000 | 16,785714 | 16,785714 | −3,2 × 10⁻⁸ |

Quanto menor o passo, mais pontos entram na soma e mais perto o resultado fica do centroide
contínuo. O erro cai mais ou menos com o quadrado do passo: metade do Δz deixa o erro cerca de
quatro vezes menor. A diferença só aparece a partir da 5ª casa decimal, por isso a tela mostra
16,79 min nos três casos.

### 6.5 — Validação da interface e determinismo

| Entrada | Esperado | Obtido | Conclusão |
| --- | --- | --- | --- |
| U = −1%, U = 101%, T = 9 °C, T = 41 °C | cálculo bloqueado com mensagem | "Umidade do solo: o valor deve ser no máximo 100.", "Temperatura: o valor deve ser no mínimo 10." etc.; Calcular e Avançar desabilitados | correto |
| Campo vazio, "abc", "Infinity" | bloqueia | "…: preencha este campo." / "…: digite um número válido." | correto |
| Mesma configuração duas vezes | mesmos graus, ativações, área e tempo | resultados idênticos | determinístico |
| Calcular × Avançar etapa cinco vezes | mesma saída | mesma conta e mesmo tempo | correto |

**Testes manuais da interface** (no navegador):

- [x] Avançar etapa percorre Fuzzificação → Regras → Implicação → Agregação → Defuzzificação e
  depois fica desabilitado.
- [x] Mudar um campo depois de calcular marca os resultados como desatualizados.
- [x] Restaurar padrão volta os campos, as regras e o Δz e limpa os resultados.
- [x] Todas as regras em "curto" com U = 50%, T = 25 °C dá 5,00 min.
- [x] Sem rolagem horizontal em 1440 px e em 375 px; console sem erros.

## Análise dos resultados

- **Regra única (6.2):** quando só uma regra ativa com h = 1, a saída agregada é o conjunto inteiro,
  e o centroide do triângulo dá 5, 15 ou 25 minutos. Isso confere a defuzzificação isoladamente.
- **Sobreposição (6.3):** com U = 35% e T = 30 °C, quatro regras ativam com 0,5. Três delas concluem
  "longo", mas a agregação pelo máximo mantém a altura em 0,5: somar as áreas daria mais peso ao
  longo e um tempo maior. O resultado (16,79 min) fica um pouco acima do meio porque a área agregada
  é plana em 0,5 de 7,5 a 30 min e só sobe em rampa de 0 a 7,5.
- **Simetria (6.4):** com T = 20 °C, curto, médio e longo ficam recortados em 0,5, a área agregada é
  um retângulo de 0 a 30 e o centroide cai exatamente no meio, 15 min.
- **Alteração das regras (6.4):** trocando todos os consequentes para curto, a mesma entrada que
  dava 15 min passa a dar 5 min. A base de regras define o comportamento do sistema; os conjuntos
  de entrada só dizem quanto cada regra ativa.
- **Passo numérico (6.4):** o método de pontos médios converge rápido para o centroide contínuo;
  Δz = 0,1 já erra menos de 0,0001 min.

## Limitações

- Os conjuntos de pertinência são fixos (o enunciado não pede editor).
- Só o consequente das regras pode ser trocado; os antecedentes são fixos.
- O centroide é numérico (pontos médios); o valor contínuo exato só é aproximado.
- O modelo é didático: não simula a água no solo nem usa sensores.
