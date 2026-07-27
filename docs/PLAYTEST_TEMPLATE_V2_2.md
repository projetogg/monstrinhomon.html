# Modelo de Playtest - Nucleo Jogavel v2.2

**Uso:** registrar playtests do combate sem dados pessoais identificaveis.  
**Regra:** observacao clinica identificavel nao deve ser registrada neste repositorio publico.

## 1. Identificacao

- Codigo da sessao:
- Data:
- Responsavel:
- SHA da `main`:
- Versao publicada:
- Contexto: simulacao / playtest interno / sessao mediada
- Duracao:
- Dispositivo:
- Quantidade de participantes:
- Faixa etaria aproximada, quando pertinente e nao identificavel:

## 2. Configuracao

### Jogador

- Classe:
- Monstrinho:
- Template ID:
- Nivel:
- HP / HP max:
- ATK:
- DEF:
- SPD/AGI:
- ENE / ENE max:
- Habilidades disponiveis:
- Passiva de classe:
- Passiva de especie:
- Item equipado:

### Oponente

- Tipo: Wild / Trainer / Boss
- Monstrinho:
- Template ID:
- Nivel:
- HP / HP max:
- ATK:
- DEF:
- SPD/AGI:
- ENE / ENE max:
- Habilidades:
- Passivas:

### Condicoes

- Vantagem de classe:
- Desvantagem de classe:
- Seed ou sequencia de rolagens:
- Formula/versao:
- Feature flags:
- Observacoes de ambiente:

## 3. Registro quantitativo

| Metrica | Valor |
|---|---|
| Resultado | |
| Turnos totais | |
| TTK jogador -> inimigo | |
| TTK inimigo -> jogador | |
| Dano medio por acao | |
| Dano minimo | |
| Dano maximo | |
| Falhas totais | |
| Contatos neutralizados | |
| Acertos reduzidos | |
| Acertos normais | |
| Acertos fortes | |
| Criticos | |
| ENE inicial | |
| ENE gasto | |
| ENE regenerado | |
| Ataques basicos | |
| Skills ofensivas | |
| Skills de suporte/cura | |
| Itens usados | |
| Cura total | |
| HP final | |
| Intervencoes do mediador | |

## 4. Registro por turno

| Turno | Ator | Acao | d20 ATK | d20 DEF | RC/faixa | Dano/cura | ENE depois | HP dos alvos | Observacao |
|---:|---|---|---:|---:|---|---:|---:|---|---|
| 1 | | | | | | | | | |

## 5. Escala de observacao

Use:

- `0`: nao observado;
- `1`: realizado com ajuda intensa;
- `2`: realizado com ajuda moderada;
- `3`: realizado com pouca ajuda;
- `4`: realizado de forma independente.

| Indicador | 0-4 | Evidencia observavel |
|---|:---:|---|
| Identificou de quem era o turno | | |
| Compreendeu o resultado do dado | | |
| Compreendeu por que acertou ou errou | | |
| Compreendeu o dano causado | | |
| Escolheu entre ataque e habilidade | | |
| Entendeu o custo de ENE | | |
| Percebeu vantagem/desvantagem | | |
| Acompanhou HP e estado do combate | | |
| Aceitou resultado desfavoravel | | |
| Esperou sem perda relevante de engajamento | | |
| Retomou apos frustracao | | |
| Usou estrategia em vez de escolha aleatoria | | |

## 6. Clareza da interface

Responder com `sim`, `parcial` ou `nao` e registrar evidencias.

| Pergunta | Resultado | Evidencia |
|---|---|---|
| A interface deixou claro o que podia ser feito? | | |
| O feedback visual correspondeu ao resultado? | | |
| HP e ENE foram compreendidos? | | |
| A Card Layer representou a habilidade correta? | | |
| Houve fallback visual inesperado? | | |
| O mediador precisou explicar regra nao mostrada? | | |
| Houve soft-lock ou estado confuso? | | |
| Foi necessario recarregar? | | |

## 7. Experiencia percebida

- Ritmo: curto demais / adequado / longo demais
- Dificuldade: muito baixa / adequada / muito alta
- Carga cognitiva: baixa / adequada / excessiva
- Engajamento: diminuiu / oscilou / sustentou / aumentou
- Momento de maior interesse:
- Momento de maior confusao:
- Momento de maior frustracao:
- Escolha mais significativa:

## 8. Achados

| ID | Categoria | Evidencia | Impacto | Reproducao | Recomendacao inicial |
|---|---|---|---|---|---|
| | BUG / DRIFT / BALANCE / UX / EVIDENCE_GAP / DECISION | | | | |

## 9. Separacao clinica

Quando o uso ocorrer em contexto terapeutico, registrar apenas informacao anonima e funcional:

- objetivo geral trabalhado;
- comportamento observavel relacionado ao jogo;
- nivel de ajuda;
- efeito do recurso na participacao;
- limite ou risco identificado.

Nao registrar:

- nome da crianca;
- diagnostico associado a pessoa identificavel;
- dados familiares;
- informacoes de prontuario;
- relato sensivel que permita reidentificacao.

## 10. Sintese

- O que funcionou:
- O que nao funcionou:
- O que precisa ser repetido antes de decidir:
- Existe bug bloqueador? sim / nao
- Existe evidencia de desbalanceamento? sim / nao / inconclusivo
- Existe problema de UX? sim / nao / inconclusivo
- Recomendacao de proxima coleta:

## 11. Classificacao da sessao

Escolher uma:

- `VALIDA`: dados utilizaveis para analise;
- `VALIDA_COM_RESSALVAS`: dados utilizaveis com limitacoes descritas;
- `INVALIDA`: configuracao, bug ou interrupcao inviabilizou comparacao.
