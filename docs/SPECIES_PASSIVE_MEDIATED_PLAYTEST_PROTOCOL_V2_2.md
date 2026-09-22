# Protocolo operacional — playtest mediado das passivas de espécie v2.2

**Status:** ACTIVE — suplemento operacional de coleta; não cria regras do jogo.

**Domain:** playtest

**Authority:** GitHub para configuração técnica e método de coleta; resultados e decisões continuam separados.

**VerifiedAgainst:** `f8468e36cc90f03613eb2bcd1ab32f80130014d9`

**Supersedes:** nenhum

**Modelo completo:** [`PLAYTEST_TEMPLATE_V2_2.md`](PLAYTEST_TEMPLATE_V2_2.md)

**Ficha rápida:** [`SPECIES_PASSIVE_SESSION_RECORD_V2_2.md`](SPECIES_PASSIVE_SESSION_RECORD_V2_2.md)

## 1. Finalidade e limites

Este protocolo transforma o modelo completo de playtest em um fluxo que o mediador consegue usar durante uma sessão. A ficha rápida captura o mínimo ao vivo; depois da sessão, o mediador consolida o registro no `PLAYTEST_TEMPLATE_V2_2.md`, usando o log do jogo para completar métricas que não precisam ser copiadas durante o combate.

O objetivo é coletar evidência humana sobre:

- funcionamento e possíveis bugs;
- paridade e possíveis drifts;
- compreensão, percepção e feedback de interface;
- sinais de impacto excessivo ou insuficiente;
- lacunas que exigem nova coleta;
- decisões de produto que dependem do autor.

Este protocolo não autoriza alteração de fórmula, valor, gatilho, catálogo, matchup ou balanceamento. Não registrar dados pessoais identificáveis.

## 2. Baseline congelada

| Campo | Baseline verificada |
|---|---|
| SHA da `main` | `f8468e36cc90f03613eb2bcd1ab32f80130014d9` |
| Versão do pacote | `1.0.0` |
| Publicação | GitHub Pages a partir de `main`: `https://projetogg.github.io/monstrinhomon.html/` |
| Runtime relevante | combate v2.2; resolver em `js/canon/speciesPassives.js`; skills em `data/skills.json`; monstros em `data/monsters.json` |
| CI da baseline | run `33087752300`, concluída com sucesso |
| Publicação da baseline | run `33087750326`, concluída com sucesso no mesmo SHA |
| PRs abertos no congelamento | nenhum |
| Build apta para playtest | **SIM** |

Se `main`, a versão publicada ou o estado de CI mudar, preencher uma nova baseline antes de coletar. Um PR aberto não substitui a baseline.

## 3. Catálogo observacional das oito passivas

| Passiva | Monstrinho runtime sugerido | Classe | Gatilho implementado | Hipótese observacional |
|---|---|---|---|---|
| `shieldhorn` — Escudo Territorial | Ferrozimon (`MON_001`) | Guerreiro | primeiro hit sofrido no turno reduz 1 de dano | A mitigação é percebida e compreendida? O combate parece excessivamente longo ou injusto? O feedback explica a redução? |
| `emberfang` — Fúria Crescente | Tamborilhomon (`MON_021`) | Bárbaro | skill ofensiva com HP estritamente acima de 70% recebe +1 ATK antes da fórmula | A relação entre HP alto, escolha de skill e bônus é compreendida? O jogador prevê a janela ou o efeito passa despercebido? |
| `floracura` — Cura Eficiente | Nutrilo (`MON_028`) | Curandeiro | primeiro item de cura do combate recebe até +3 HP | O bônus é compreendido e muda a escolha de item? A cura prolonga o combate de forma positiva ou negativa? |
| `swiftclaw` — Primeiro Ataque | Miaumon (`MON_009`) | Caçador | primeira ação de ataque do combate recebe +1 ATK | A abertura é percebida, muda a primeira decisão e é funcionalmente relevante? |
| `moonquill` — Controle Arcano | Dracoflamemon (`MON_015`), evoluído da linha de Lagartomon | Mago | debuff bem-sucedido concede +1 SPD por 1 turno | A ligação entre debuff e velocidade posterior é previsível? O benefício e sua duração ficam visíveis? |
| `shadowsting` — Golpe Furtivo | Umbraquimonom (`MON_022C`), evoluído da linha de Corvimon | Ladino | debuff bem-sucedido carrega +1 ATK para o próximo ataque básico | A sequência debuff → ataque básico é compreendida? A carga é percebida e aproveitada? |
| `bellwave` — Cadência Rítmica | Rainhassommon (`MON_027C`), evoluído da linha de Zunzumon | Bardo | qualquer skill bem-sucedida carrega +1 ATK para o próximo ataque básico | A alternância skill → básico é descoberta e usada? O estado de ritmo permanece invisível? |
| `wildpace` — Instinto Selvagem | Cervimon (`MON_023`) | Animalista | qualquer ataque com HP estritamente abaixo de 40% recebe +1 ATK | Com que frequência o limiar ocorre naturalmente? Quando ocorre, é percebido a tempo e muda a decisão? |

Os nomes de passiva acima são rótulos de interface; o contrato técnico continua nos arquivos canônicos. O monstrinho sugerido é uma instância runtime mapeada para a espécie, não um novo nome canônico.

## 4. Organização da coleta

Não executar os oito casos em sequência com a mesma criança apenas para completar cobertura. Uma sessão deve conter poucos combates compatíveis com atenção, tolerância e objetivo clínico. A cobertura do portão é acumulada entre sessões.

Recomendação operacional:

- bloco principal: 1 a 3 combates, conforme o andamento real;
- uma passiva prioritária por sessão e, no máximo, uma complementar;
- pausa ou encerramento quando houver queda relevante de engajamento;
- consolidação pelo mediador após a participação, sem exigir que a criança espere.

### A. Antes do combate

Registrar somente:

1. código anônimo da sessão;
2. SHA e URL publicados;
3. cenário e modo (`Wild` ou `Group`);
4. monstrinho, template ID, classe, nível e HP inicial;
5. skills e item relevantes ao gatilho;
6. adversário e nível;
7. se existe vantagem ou desvantagem de classe;
8. qualquer desvio da configuração planejada.

Confirmar visualmente que a espécie/passiva esperada aparece na instância. Não continuar como se o cenário estivesse correto quando `canonSpeciesId`, skill, item ou nível não puder ser confirmado.

### B. Durante o combate

Anotar apenas eventos essenciais na ficha rápida:

- ação escolhida: básico, skill ou item;
- faixa de HP antes da ação: `>70%`, `40–70%` ou `<40%`;
- gatilho esperado: ocorreu, não ocorreu ou não foi possível confirmar;
- reação observável: percebeu, perguntou, comentou, mudou decisão ou não reagiu;
- ajuda: nenhuma, pergunta neutra, pista ou instrução;
- evento excepcional: erro, recarga, estado confuso, interrupção ou possível bug.

Dado, RC, dano, ENE, HP e log por turno permanecem disponíveis no jogo e devem ser transcritos depois. Só copiar ao vivo quando o log não preservar a informação.

### C. Após o combate

Registrar imediatamente:

1. resultado, turnos e duração;
2. escolha mais significativa;
3. compreensão da passiva em linguagem da criança, sem ensinar a resposta antes;
4. clareza do feedback visual e textual;
5. ritmo, frustração, engajamento e necessidade de ajuda;
6. achados provisórios e evidência observável;
7. classificação da sessão: `VALIDA`, `VALIDA_COM_RESSALVAS` ou `INVALIDA`;
8. dados que ainda precisam ser extraídos do log.

Depois da sessão, completar o `PLAYTEST_TEMPLATE_V2_2.md`. A ficha rápida não substitui as métricas quantitativas, a escala 0–4, a separação clínica nem a síntese exigidas pelo modelo completo.

## 5. Matriz mínima de cenários

Os oponentes sugeridos `MON_030*`, `MON_031*` e `MON_032*` não possuem mapeamento de espécie no bridge verificado, reduzindo interferência de outra passiva. A ausência de matchup direto deve ser confirmada no pré-playtest; se a configuração publicada não permitir selecionar o encontro, registrar o adversário real e a diferença, sem editar save ou HP durante a coleta natural.

| ID | Foco | Jogador | Nível | Skills/item relevantes | Adversário sugerido | Condição inicial | Evento natural esperado | Não forçar | Métricas centrais | Sessão válida quando |
|---|---|---|---:|---|---|---|---|---|---|---|
| `SP-01` | `shieldhorn` | Ferrozimon `MON_001`, Guerreiro | 10 | Golpe Pesado I; Escudo I | Vitalex `MON_031`, Curandeiro, mesmo nível | HP cheio; sem vantagem direta | receber hits ao longo do combate e mitigar o primeiro de cada turno | não prolongar o combate nem ordenar defesa repetida | hits recebidos, reduções, turnos, duração, percepção, justiça | configuração confirmada, combate concluído e ao menos um hit recebido |
| `SP-02` | `wildpace` | Cervimon `MON_023`, Animalista | 10 | Investida Bestial I; Instinto Selvagem I | Vitalex `MON_031`, Curandeiro, mesmo nível | HP cheio | HP pode cruzar naturalmente abaixo de 40%; ataque posterior pode ativar | não iniciar com HP baixo, não pedir para sofrer dano, não impedir cura por instrução | combates iniciados, cruzamentos do limiar, ativações, turno do limiar, decisão posterior | combate começa com HP cheio e termina sem edição manual; ausência do gatilho é dado válido de frequência |
| `SP-03` | `floracura` | Nutrilo `MON_028`, Curandeiro | 10 | Petisco de Cura `IT_HEAL_01`; Cura I | Furtilhon `MON_030`, Ladino, mesmo nível | HP cheio; ao menos um item disponível | dano cria oportunidade real de cura; jogador pode escolher item | não sugerir o item nem confundir cura por skill com o gatilho do item | oportunidade de cura, item escolhido, primeira cura, HP recuperado, duração, percepção | houve escolha real diante de oportunidade de cura; sem uso de item, classificar o efeito como `EVIDENCE_GAP` |
| `SP-04` | `swiftclaw` | Miaumon `MON_009`, Caçador | 10 | Flecha Certeira I; Armadilha I | Aquasol `MON_032`, Curandeiro, mesmo nível | HP cheio | primeira ação ofensiva ocorre livremente | não dizer que o primeiro ataque tem bônus nem escolher básico/skill pela criança | tipo da primeira ação, percepção do bônus, dano, mudança de estratégia | primeira ação ofensiva ocorreu sem indução e foi registrada |
| `SP-05` | `emberfang` | Tamborilhomon `MON_021`, Bárbaro | 10 | Golpe Brutal I; Fúria I | Furtilhon `MON_030`, Ladino, mesmo nível | HP cheio e acima de 70% | skill ofensiva pode ser escolhida enquanto HP está alto | não pedir Golpe Brutal apenas para ativar; não restaurar HP para reabrir janela | oportunidades com HP >70%, skills ofensivas escolhidas, ativações, percepção | ao menos uma escolha entre básico e skill foi registrada; sem skill na janela, `EVIDENCE_GAP` para o efeito |
| `SP-06A` | `moonquill` | Dracoflamemon `MON_015`, Mago, evoluído de Lagartomon | 30 | Véu Arcano I; ataque básico | Vitalion `MON_031B`, Curandeiro, mesmo nível | estágio evolutivo, kit swap e quatro slots confirmados | debuff pode gerar +1 SPD por 1 turno | não ordenar Véu Arcano; não explicar o ganho de SPD antes | escolha do debuff, ordem dos turnos, feedback, previsão e uso do benefício | skill de debuff estava disponível e houve escolha real; se não usada, `EVIDENCE_GAP` |
| `SP-06B` | `shadowsting` | Umbraquimonom `MON_022C`, Ladino, evoluído de Corvimon | 30 | Enfraquecer II; ataque básico; Golpe Furtivo I | Vitalion `MON_031B`, Curandeiro, mesmo nível | estágio evolutivo, kit swap e debuff confirmados | debuff pode carregar o próximo básico | não pedir a sequência nem tratar Golpe Furtivo I como substituto do básico canônico | carga criada, ação seguinte, carga consumida, feedback, compreensão | houve oportunidade real de debuff e ação seguinte registrada |
| `SP-06C` | `bellwave` | Rainhassommon `MON_027C`, Bardo, evoluído de Zunzumon | 30 | qualquer skill; ataque básico; Nota Discordante I | Sombrifur `MON_030C`, Ladino, mesmo nível | estágio evolutivo, kit swap e quatro slots confirmados | qualquer skill pode carregar o próximo básico | não instruir alternância skill/básico | carga criada, ação seguinte, consumo, repetição espontânea, feedback | houve uso livre de skill e a ação ofensiva seguinte foi registrada |

### Escolha dos níveis

- nível 10 mantém os cenários simples e já oferece escolha entre as duas primeiras famílias de skills;
- nível 30 padroniza os cenários de setup avançado e garante o slot 4/kit swap; a instância deve ter evoluído normalmente para preservar estágio, identidade e conjunto de skills;
- se o save disponível tiver outro nível, registrar a diferença. Não ajustar o nível durante a sessão apenas para obter o resultado esperado.

### Etapa controlada opcional

Somente depois do combate natural e sem substituir seus dados, o mediador pode executar uma confirmação controlada para reproduzir um possível bug ou tornar um gatilho raro observável. Marcar claramente `CONTROLADO` e registrar toda instrução dada. Dados controlados servem para funcionamento/UX; não contam como frequência natural, escolha espontânea ou evidência de balanceamento.

## 6. Conduta do mediador

### Fazer

- usar perguntas neutras, como “O que você acha que aconteceu?” ou “O que você quer fazer agora?”;
- permitir escolha real quando houver mais de uma ação legal;
- registrar toda ajuda fornecida;
- diferenciar pergunta espontânea, pista, explicação necessária e instrução direta;
- deixar o fluxo continuar e completar detalhes a partir do log depois;
- registrar comportamento inesperado antes de interpretá-lo;
- interromper quando houver sofrimento, sobrecarga, perda sustentada de engajamento ou risco de exposição de dado pessoal.

### Não fazer

- explicar antecipadamente a passiva cuja compreensão está sendo testada;
- induzir uma skill para “fazer a passiva aparecer” no bloco natural;
- editar HP, ENE, rolagem ou adversário durante o combate natural;
- elogiar uma escolha específica de modo que direcione as próximas;
- classificar dificuldade, derrota, frustração ou confusão isolada como balanceamento;
- transformar observação isolada em diagnóstico, função ou causalidade;
- alterar valores durante ou entre sessões do mesmo ciclo de coleta.

### Intervir quando necessário

Intervenção é permitida para:

- segurança física ou emocional;
- proteção de dados e privacidade;
- destravar soft-lock, falha de interface ou impossibilidade de prosseguir;
- explicar uma regra básica que não é a hipótese testada, após registrar a necessidade;
- encerrar um combate que perdeu validade ou deixou de ser apropriado.

Se a intervenção puder afetar a hipótese, marcar a sessão como `VALIDA_COM_RESSALVAS` ou `INVALIDA` e justificar.

## 7. Guia de classificação dos achados

Classificar a evidência, não a impressão inicial.

| Categoria | Usar quando | Evidência mínima | Não usar quando |
|---|---|---|---|
| `BUG` | o runtime falha ou se comporta de modo incompatível com o contrato implementado | passos, configuração, resultado esperado, resultado observado e reprodução ou evidência determinística | a regra funciona, mas não foi entendida |
| `DRIFT` | caminhos equivalentes divergem: Wild × Group, runtime × regra canônica ou duas rotas comparáveis | mesma condição comparável, resultados dos dois caminhos e fonte canônica | modos têm diferença documentada ou a comparação não é equivalente |
| `UX` | a mecânica funciona, mas feedback, linguagem, timing ou visibilidade impedem percepção/compreensão | comportamento observável, ajuda necessária e elemento de interface relacionado | existe falha funcional confirmada |
| `BALANCE` | a mecânica funciona como especificada, mas há sinal consistente de impacto excessivo/insuficiente em resultado, ritmo ou decisão | observação humana repetida + métricas da sessão + confronto com matriz automatizada | uma derrota, um combate longo ou uma confusão isolada |
| `EVIDENCE_GAP` | o gatilho não ocorreu, a configuração variou, a sessão foi interrompida ou os dados não permitem concluir | descrição objetiva do que faltou e próxima coleta específica | já existe evidência suficiente para uma categoria mais precisa |
| `DECISION` | duas ou mais alternativas legítimas dependem de intenção de design/produto | alternativas, consequências e evidência disponível, sem escolher pelo autor | falta apenas reproduzir uma falha técnica |

Regras de precedência:

1. confirmar funcionamento antes de discutir balanceamento;
2. comparar com o contrato canônico antes de chamar divergência de bug;
3. usar `EVIDENCE_GAP` quando o gatilho não apareceu naturalmente;
4. registrar categorias separadas quando o mesmo evento revelar, por exemplo, um `BUG` e um problema de `UX`;
5. manter `BALANCE` como sinal até existir decisão humana.

## 8. Fluxo pós-playtest

```text
PLAYTEST
├─ BUG confirmado
│  └─ reproduzir → abrir issue/PR isolado → retestar o mesmo cenário
├─ DRIFT confirmado
│  └─ caracterizar os dois caminhos → identificar regra canônica → PR próprio
├─ UX
│  └─ propor intervenção mínima → revisar com autor → novo teste comparável
├─ BALANCE
│  └─ confrontar observação humana + matriz automatizada
│     └─ decidir se falta coleta → decisão humana → eventual PR de uma passiva
├─ EVIDENCE_GAP
│  └─ definir exatamente cenário, dado e gatilho ausentes → nova coleta específica
├─ DECISION
│  └─ apresentar alternativas e impactos ao autor → registrar decisão antes de implementar
└─ nenhum problema material
   └─ registrar conclusão da cobertura → avaliar critérios de saída do portão
```

Não alterar valores durante a coleta. Bugs, drifts, UX e balanceamento devem seguir trilhas separadas quando exigirem implementação.

## 9. Critérios de saída do portão

### Mínimo obrigatório

- ao menos uma sessão padronizada classificada como `VALIDA` ou `VALIDA_COM_RESSALVAS`;
- baseline e configuração registradas;
- escolha entre ataque básico e skill registrada;
- clareza, frustração, ritmo e engajamento avaliados;
- achados separados por categoria;
- bugs bloqueadores e lacunas de nova coleta explicitados;
- nenhuma mudança de balanceamento feita durante a coleta.

### Cobertura necessária antes de recomendar encerramento

- `shieldhorn` observado em pelo menos dois combates válidos, por ser o maior sinal automatizado;
- `wildpace` acompanhado em pelo menos três combates naturais iniciados com HP cheio, registrando `combates`, `cruzamentos <40%` e `ataques após o limiar`; esse mínimo é operacional, não uma amostra estatística;
- `floracura` com ao menos uma oportunidade real de escolher item e uma ativação observada ou lacuna explícita;
- `swiftclaw` com a primeira ação ofensiva livre registrada;
- `emberfang`, `moonquill`, `shadowsting` e `bellwave` com ao menos uma oportunidade válida de setup cada;
- para `shadowsting` e `bellwave`, criação e consumo da carga observados ou classificados como `EVIDENCE_GAP`;
- os principais sinais humanos confrontados com a matriz quantitativa, sem converter correlação em causalidade;
- nenhuma pendência classificada como `BUG` bloqueador sem plano de reprodução/correção;
- toda dúvida restante nomeia a coleta adicional necessária;
- o autor decide explicitamente se a evidência é suficiente para encerrar o portão.

Uma sessão válida satisfaz o mínimo de início da coleta, não valida o núcleo inteiro. Os números de repetição acima são critérios operacionais conservadores; não afirmam significância estatística.

## 10. Checklists

### Pré-playtest

- [ ] SHA, URL publicada e CI correspondem à baseline aprovada
- [ ] nenhum PR aberto altera o domínio do cenário
- [ ] cenário e hipótese escolhidos
- [ ] monstrinho, `canonSpeciesId`, classe e nível confirmados
- [ ] skills/kit swap e item necessários disponíveis
- [ ] adversário e matchup registrados
- [ ] log do jogo acessível
- [ ] ficha rápida pronta e código anônimo definido
- [ ] nenhum dado pessoal será incluído no repositório
- [ ] mediador sabe o que não pode explicar antecipadamente
- [ ] critério de pausa/encerramento combinado

### Pós-playtest

- [ ] resultado, turnos, duração e escolhas registrados
- [ ] ativações e não ativações registradas
- [ ] toda ajuda/intervenção registrada
- [ ] compreensão, feedback, ritmo, frustração e engajamento avaliados
- [ ] sessão classificada como `VALIDA`, `VALIDA_COM_RESSALVAS` ou `INVALIDA`
- [ ] achados classificados sem presumir balanceamento
- [ ] métricas completadas no `PLAYTEST_TEMPLATE_V2_2.md`
- [ ] evidência sem dados identificáveis
- [ ] necessidade de reprodução ou nova coleta definida
- [ ] nenhuma alteração de valor/regra feita

## 11. Consolidação dos resultados

Para cada sessão:

1. duplicar o `PLAYTEST_TEMPLATE_V2_2.md` como registro datado, sem alterar o modelo;
2. transferir a identificação, configuração e observações da ficha rápida;
3. completar métricas e turnos a partir do log;
4. registrar desvios e intervenções;
5. classificar cada achado com ID estável, por exemplo `SP-2026-08-001`;
6. indicar cenário, passiva, modo, reprodução e evidência;
7. manter inferências e recomendações separadas dos fatos observados.

Ao consolidar várias sessões, usar uma linha por cenário executado:

| Sessão | Cenário | Passiva | Válida? | Gatilho/oportunidade | Percebida? | Ajuda | Ritmo | Achados | Próxima coleta |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

Para `wildpace`, acrescentar sempre os três contadores: número de combates iniciados com HP cheio, número de cruzamentos naturais abaixo de 40% e número de ataques executados depois do cruzamento. Para setup, separar “oportunidade disponível”, “skill escolhida”, “estado criado” e “benefício consumido”.

O repositório pode guardar registros anônimos e funcionais. Observação clínica identificável permanece fora do repositório público.
