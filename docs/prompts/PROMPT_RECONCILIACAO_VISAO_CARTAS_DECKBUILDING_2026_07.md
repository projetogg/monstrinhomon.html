# PROMPT OPERACIONAL — RECONCILIAÇÃO DA VISÃO DE CARTAS, DECKBUILDING E RPG TÁTICO

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Reconstruir, a partir do histórico integral do projeto, qual era a intenção do autor para o sistema de cartas do Monstrinhomon e verificar se a arquitetura atual de Card Layer visual-only representa:

1. a visão final do produto;
2. apenas uma etapa técnica incremental;
3. uma mudança de direção aprovada;
4. ou um desvio documental que precisa ser corrigido.

A análise não deve presumir que o autor está correto nem defender automaticamente a implementação atual. Deve confrontar conversas, documentos de produto, decisões humanas, GitHub, runtime e testes.

## Pergunta central

O plano do Monstrinhomon é manter cartas somente como representação visual de skills, ou combinar:

- RPG tático simples;
- posicionamento/tabuleiro;
- habilidades apresentadas e utilizadas como cartas;
- deckbuilding leve;
- ações ou cartas sem custo de ENE para evitar turnos mortos?

## Fontes obrigatórias

### Governança e estado

1. `docs/AI_ENTRYPOINT.md`;
2. `docs/PROJECT_STATUS.md`;
3. `docs/AUTHORITY_MAP.md`;
4. `docs/DECISION_LOG.md`;
5. `docs/ROADMAP.md`;
6. PRs recentes e `main`.

### Card Layer atual

- `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`;
- `data/cards.json`;
- `data/skills.json`;
- `js/cards/*`;
- testes da Card Layer;
- PR #256 e discussões relacionadas.

### Produto e conversas

- todas as conversas do Projeto RPG que mencionem cartas, cards, mão, deck, compra, descarte, energia, habilidades gratuitas, ações básicas, tabuleiro, grade, movimento, alcance e posicionamento;
- `Sistema_de_Cartas_Monstrinhomon.docx`;
- `Sistema_de_Cartas_Monstrinhomon_REVISADO.docx`;
- versões anteriores da arquitetura de cartas, quando necessárias para reconstruir a evolução da decisão.

## Método

### 1. Linha do tempo

Produzir uma linha do tempo distinguindo:

- intenção inicial do autor;
- hipóteses de design;
- decisões humanas explícitas;
- simplificações temporárias;
- implementações realizadas;
- interpretações posteriores da IA;
- possíveis desvios.

### 2. Quatro camadas obrigatórias

Separar:

#### Visão de produto

O tipo de jogo que o autor quer construir no longo prazo.

#### Regra aprovada

Princípios já confirmados pelo autor, mesmo que ainda não implementados.

#### Especificação pendente

Números e fluxos ainda em discussão, como tamanho do deck, mão, compra, descarte, grade e economia exata de ENE.

#### Estado implementado

O que a `main` realmente executa hoje.

### 3. Teste da premissa do autor

Verificar honestamente:

- se existe evidência consistente de que as duas propostas deveriam ser combinadas;
- se houve alguma decisão posterior que cancelou essa direção;
- se a arquitetura visual-only dizia “nunca haverá deck” ou apenas “não implementar deck nesta fase”;
- se manter o modelo híbrido cria riscos técnicos ou cognitivos que exigem revisão da premissa.

Quando discordar, apresentar evidência concreta. Não transformar complexidade de implementação em prova de que a visão de produto está errada.

### 4. Segurança contra duplicação mecânica

Mesmo que o produto futuro tenha deck e mão, verificar como preservar:

- uma única fonte mecânica para power, custo, alvo, alcance, duração e efeito;
- cards referenciando skills em vez de copiar valores;
- compatibilidade com kit swap, evolução e slots;
- rollback para a UI atual;
- baixa carga cognitiva;
- ações disponíveis mesmo com ENE baixa ou mão desfavorável.

## Questões que exigem classificação

Classificar cada item como `APPROVED`, `PROPOSAL`, `IMPLEMENTED`, `SUPERSEDED` ou `PENDING`:

- RPG tático com posicionamento;
- cartas como habilidades executáveis;
- deckbuilding leve;
- existência de mão;
- compra e descarte;
- montagem de deck por monstrinho;
- ação básica fora do deck;
- cartas sem custo de ENE;
- recuperação de ENE por passar/preparar;
- tamanho do deck;
- tamanho da mão;
- quantidade de cartas compradas;
- tamanho da grade;
- movimento básico;
- armadilhas, empurrar, puxar e teleportar;
- troca de monstrinho alterando o estilo do deck.

Não aprovar automaticamente números presentes em documentos antigos.

## Entregas

1. conclusão sobre a premissa do autor;
2. linha do tempo da decisão;
3. visão de produto reconciliada;
4. estado atual do runtime;
5. princípios aprovados;
6. detalhes ainda pendentes;
7. riscos e contrapontos;
8. interpretação correta da Card Layer v0.1.2;
9. classificação dos documentos de cartas;
10. atualizações necessárias na governança;
11. sequência futura de design e implementação;
12. itens que não devem ser desenvolvidos agora.

## Limites

Não:

- alterar runtime;
- implementar deck, mão ou tabuleiro;
- decidir números sem autorização humana;
- apagar documentos de produto antes de extrair decisões únicas;
- tratar a implementação atual como visão final automaticamente;
- tratar todo conteúdo do documento revisado como aprovado;
- interromper o playtest atual das passivas de espécie.

## Atualizações documentais permitidas

Quando a evidência for suficiente:

- criar documento de reconciliação da visão;
- registrar decisão de produto no `DECISION_LOG.md`;
- esclarecer a diferença entre piloto visual e visão futura no `AUTHORITY_MAP.md`;
- corrigir a auditoria de higiene informacional;
- corrigir a política do Projeto ChatGPT;
- registrar a visão futura no `PROJECT_STATUS.md` sem descrevê-la como implementada.

## Classificação final

Finalizar com uma opção:

```text
A. A visão híbrida é confirmada; Card Layer visual-only é uma etapa incremental
B. A visão híbrida existiu, mas foi substituída por decisão humana posterior
C. A evidência é contraditória e exige nova decisão do autor
D. A visão híbrida é inviável nos termos atuais e precisa ser reformulada
```

Não fazer merge sem autorização humana explícita.
