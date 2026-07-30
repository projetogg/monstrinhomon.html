# Reconciliação da Visão de Cartas, Deckbuilding e RPG Tático

**Status:** ACTIVE  
**Domain:** produto, combate tático e arquitetura futura de cartas  
**Authority:** GitHub — decisão humana registrada; runtime continua descritivo  
**VerifiedAgainst:** `b14dceb5438911ce93741fa4b722895ab9ffa8eb`, histórico do Projeto RPG, documentos de cartas e `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`  
**Supersedes:** interpretação que tratava o deckbuilding como experimento externo ao produto

## 1. Conclusão executiva

A visão híbrida está confirmada.

O objetivo de produto do Monstrinhomon não é limitar cartas a uma camada puramente visual para sempre. A intenção do autor é combinar:

- RPG tático simples;
- posicionamento em campo/tabuleiro;
- habilidades apresentadas e utilizadas como cartas;
- deckbuilding leve;
- gestão acessível de ENE;
- ações ou cartas sem custo de ENE para evitar turnos mortos e reduzir dependência de uma mão perfeita.

A Card Layer visual-only aprovada em maio de 2026 foi uma etapa técnica incremental e conservadora. Ela buscou estabilizar identidade de skills, schema, kit swap, fallback e apresentação sem introduzir simultaneamente deck, mão, compra, descarte e novas regras de combate.

Portanto:

```text
Fase 1 sem deck ≠ visão final sem deck.
```

Não foi encontrada decisão humana posterior que tenha cancelado a visão híbrida.

## 2. Onde ocorreu o desvio

A arquitetura `CARD_LAYER_ARCHITECTURE_v0.1.2.md` declara corretamente que a Fase 1 não implementa deck, mão, compra ou descarte. Esse limite era necessário para:

- impedir duplicação mecânica em `data/cards.json`;
- preservar `data/skills.json` como fonte de power, custo, alvo e efeito;
- validar identidade canônica de skills;
- manter feature flag e fallback;
- evitar expandir escopo antes de estabilizar o combate.

O desvio ocorreu posteriormente, quando documentos de governança e análises passaram a interpretar a ausência de deck na Fase 1 como se o deckbuilding fosse um experimento externo e não canônico.

Essa interpretação estava errada.

## 3. Linha do tempo reconciliada

### Março de 2026 — fundação tática

As conversas já tratavam o jogo como um RPG com:

- combate individual e em grupo;
- posicionamento;
- alcance por classe;
- ações mediadas;
- escolhas táticas acessíveis;
- uso de d20 físico sem tornar o dado absoluto.

### Desenvolvimento da proposta de cartas

Os documentos de cartas consolidaram a intenção de:

- trocar de Monstrinhomon para mudar o estilo do baralho;
- usar habilidades como cartas;
- manter ações básicas disponíveis;
- ter cartas e ações com custos diferentes de ENE;
- usar um campo tático pequeno;
- permitir movimento, proteção, armadilhas e manipulação de posição;
- começar por um protótipo reduzido antes de expandir classes e catálogo.

### Maio de 2026 — Card Layer Fase 1

Foi aprovada uma implementação visual-only para o piloto do Guerreiro.

Essa decisão dizia:

```text
não implementar deck nesta fase
```

Ela não dizia:

```text
não haverá deck no produto
```

A escolha foi tecnicamente adequada para resolver identidade, mapeamento, schema, kit swap, fallback e integração com a UI sem alterar combate.

### Junho de 2026 — intenção híbrida preservada

O projeto continuou abrangendo explicitamente:

- Card Layer;
- deckbuilding;
- RPG tático;
- tabuleiro e posicionamento;
- cartas como habilidades;
- habilidades sem custo de ENE;
- mão, compra e descarte como temas de design.

### Julho de 2026 — correção de governança

Durante a auditoria de higiene informacional, a IA classificou o sistema de deck como experimento separado e não canônico. O autor corrigiu essa interpretação e reafirmou a intenção de combinar as propostas.

Essa reafirmação constitui decisão humana explícita sobre a direção do produto.

## 4. Quatro camadas que não podem ser misturadas

### 4.1 Visão de produto aprovada

O jogo deve evoluir para um RPG tático infantil/terapêutico com deckbuilding leve, no qual cartas representam e permitem executar habilidades.

O sistema deve permanecer simples o suficiente para uso mediado com crianças e grupos.

### 4.2 Princípios aprovados

- cartas e skills pertencem ao mesmo sistema, não a produtos separados;
- o jogador deve ter ações possíveis mesmo com ENE baixa ou mão desfavorável;
- algumas ações ou cartas podem ter custo zero de ENE;
- posicionamento deve criar decisões, sem transformar o jogo num wargame complexo;
- trocar de Monstrinhomon pode alterar o conjunto e o estilo das cartas disponíveis;
- a criança deve compreender rapidamente o que pode fazer;
- cartas fortes precisam de custo, condição, alcance, duração ou outra contrapartida;
- o sistema não pode depender de comprar a carta certa para permitir uma ação básica;
- a fonte mecânica deve continuar única.

### 4.3 Especificações ainda pendentes

Os itens abaixo permanecem como propostas e precisam de protótipo, playtest e decisão própria:

- deck de 12 cartas;
- mão inicial de 3 cartas;
- quantidade comprada por turno;
- limite de cópias;
- descarte e reciclagem do deck;
- ação `Passar/Preparar`;
- valor máximo e regeneração exata de ENE;
- se a ação básica fica fora do deck ou aparece como carta permanente;
- quantidade exata de cartas sem ENE;
- tamanho e formato da grade;
- movimento básico de uma casa;
- ocupação de casas;
- regras de empurrar, puxar, teleportar e armadilhas;
- composição do primeiro protótipo por classe;
- relação entre deck do jogador, deck do Monstrinhomon e skills desbloqueadas.

Esses detalhes não se tornam canônicos apenas porque aparecem num documento revisado.

### 4.4 Estado implementado

A `main` possui atualmente:

- skills runtime;
- identidade de skills preservada;
- kit swaps;
- Card Layer visual do piloto do Guerreiro;
- catálogo visual em `data/cards.json`;
- fallback para UI legada;
- combate sem deck, mão, compra ou descarte.

O runtime atual descreve a implementação presente. Ele não redefine sozinho a visão futura.

## 5. Interpretação correta da Card Layer v0.1.2

`docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` permanece válida e útil para a Fase 1.

Seu escopo deve ser interpretado como:

```text
fundação visual e de identidade para cartas de skill
```

Não como:

```text
arquitetura final de todo o sistema de cartas
```

A futura camada de deck/mão deve reutilizar essa fundação, sem destruir sua separação de responsabilidades.

## 6. Arquitetura futura recomendada

Quando o núcleo atual estiver validado e houver decisão de iniciar essa fase, a arquitetura deverá separar:

### Skill mecânica

Fonte única para:

- power;
- custo de ENE;
- alvo;
- alcance;
- acurácia;
- duração;
- efeito;
- restrições.

### Card visual

Responsável por:

- título infantil;
- ícone;
- arte;
- texto curto;
- categoria visual;
- feedback de disponibilidade.

### Deck e mão

Responsáveis por:

- quais referências de skill entram no baralho;
- compra e descarte;
- ordem e disponibilidade temporária;
- limites de cópia;
- regras de construção.

Deck e mão devem referenciar IDs de skills ou cards. Não devem copiar valores mecânicos.

### Ação de segurança

O sistema deve garantir ao menos uma ação legal quando:

- a mão não ajuda;
- a ENE acabou;
- nenhuma carta especial pode ser usada;
- a criança ainda está aprendendo.

A implementação exata permanece pendente. As opções incluem:

- ação básica fora do deck;
- carta básica permanente;
- cartas de custo zero;
- ação `Preparar` que reorganiza mão e recupera recurso.

## 7. Contrapontos e riscos

A premissa híbrida é coerente, mas aumenta o risco de complexidade.

### Riscos reais

- turno longo em grupos;
- excesso de escolhas para crianças pequenas;
- mão ruim gerar frustração;
- deckbuilding competir com captura e evolução;
- ENE e mão criarem duas restrições redundantes;
- tabuleiro, alcance e cartas aumentarem carga cognitiva ao mesmo tempo;
- manutenção de duas fontes mecânicas se cards copiarem valores;
- balanceamento difícil entre ação básica, skill gratuita e skill paga;
- troca de Monstrinhomon exigir reconstrução complexa de deck durante a sessão.

### Resposta recomendada

Esses riscos justificam implementação em fases e protótipo mínimo. Eles não justificam apagar a visão híbrida.

## 8. Classificação dos documentos

| Documento | Classificação | Tratamento |
|---|---|---|
| `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` | `KEEP_ACTIVE` | manter como arquitetura da Fase 1 visual |
| `CARD LAYER ARCHITECTURE v0_1_1.pdf` | `ARCHIVE` | remover do contexto ativo; v0.1.2 substitui |
| `Sistema_de_Cartas_Monstrinhomon.docx` | `ARCHIVE` | preservar apenas se contiver conteúdo ausente na versão revisada; caso contrário, arquivar |
| `Sistema_de_Cartas_Monstrinhomon_REVISADO.docx` | `KEEP_ACTIVE` | não apagar; migrar para Drive/GitHub com marcação de proposta e itens aprovados separados |
| documentos duplicados `v1` | `DELETE_ACTIVE_COPY` | remover após confirmar que a versão revisada está preservada |

A versão revisada não possui autoridade sobre runtime e números. Ela possui valor como fonte de produto e histórico de decisões.

## 9. Decisões registradas

### Aprovado

- direção híbrida do produto;
- cartas como forma de usar habilidades;
- deckbuilding leve;
- componente tático de posicionamento;
- necessidade de ação disponível sem depender de ENE ou mão perfeita;
- implementação gradual;
- preservação de fonte mecânica única.

### Implementado parcialmente

- apresentação visual das skills como cartas;
- identidade das skills;
- catálogo visual;
- fallback e integração piloto.

### Pendente

- regras exatas do deck, mão, compra e descarte;
- economia de ENE da fase híbrida;
- ação básica e cartas gratuitas;
- tabuleiro mínimo;
- primeiro conjunto jogável;
- critérios de expansão por classe;
- integração com combate em grupo.

## 10. Sequência futura recomendada

A fase atual continua sendo o playtest mediado das passivas de espécie.

A visão híbrida deve permanecer registrada, mas não deve interromper o portão atual.

Depois da validação do núcleo:

1. transformar o documento revisado em especificação de produto classificada;
2. definir o MVP híbrido mais simples possível;
3. decidir a garantia contra turno morto;
4. decidir se a ação básica fica fora do deck ou é carta permanente;
5. testar deck/mão sem tabuleiro completo;
6. testar posicionamento mínimo sem ampliar catálogo;
7. integrar as duas camadas somente após cada uma funcionar isoladamente;
8. expandir para outras classes após playtest.

## 11. Correção da orientação de limpeza

Não remover `Sistema_de_Cartas_Monstrinhomon_REVISADO.docx` por ser “não canônico”.

A ação correta é:

1. manter a versão revisada;
2. marcá-la como proposta de produto com princípios parcialmente aprovados;
3. remover ou arquivar duplicatas e versões substituídas;
4. migrar as decisões aprovadas para este documento e para o `DECISION_LOG.md`;
5. impedir que números ainda pendentes sejam tratados como runtime.

## 12. Classificação final

**A. A visão híbrida é confirmada; Card Layer visual-only é uma etapa incremental.**
