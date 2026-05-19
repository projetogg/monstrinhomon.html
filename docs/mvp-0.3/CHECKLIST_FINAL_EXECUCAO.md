# Checklist Final — MVP 0.3

Use este checklist antes de declarar o MVP 0.3 concluído.

## Identificação da versão

```text
Data:
Branch:
Commit:
Responsável:
Ambiente:
Navegador:
Dispositivo:
```

## Checklist técnico

```text
[ ] npm test passou
[ ] npm run validate-data passou
[ ] npm run validate:monster-assets passou ou gerou apenas avisos esperados
[ ] console sem erro crítico
[ ] jogo abre
[ ] novo jogo inicia
[ ] continue funciona
```

## Checklist de jogador/starter

```text
[ ] Guerreiro → Ferrozimon
[ ] Bardo → Dinomon
[ ] Caçador → Miaumon
[ ] Mago → Lagartomon
[ ] Animalista → Luvursomon
[ ] Curandeiro → Nutrilo
[ ] Bárbaro → Tigrumo
[ ] Ladino → Furtilhon
[ ] starter aparece no time
[ ] starter tem HP válido
[ ] starter tem fallback visual
```

## Checklist de wild battle

```text
[ ] encontro wild inicia
[ ] inimigo válido aparece
[ ] HP do jogador aparece
[ ] HP do inimigo aparece
[ ] ataque básico funciona
[ ] inimigo responde
[ ] HP atualiza
[ ] log é compreensível
[ ] batalha termina por vitória
[ ] batalha termina por captura
[ ] batalha termina por derrota/fuga quando aplicável
```

## Checklist de d20

```text
[ ] modo automático funciona
[ ] modo manual funciona
[ ] valores 1–20 são aceitos
[ ] valores inválidos são rejeitados
[ ] crítico não quebra
[ ] falha não quebra
[ ] defesa aparece no log ou visual
```

## Checklist de captura

```text
[ ] captura só disponível em wild
[ ] orb é consumida
[ ] sucesso adiciona ao team
[ ] team cheio manda para box
[ ] falha não adiciona monstro
[ ] falha continua combate
[ ] feedback de sucesso é claro
[ ] feedback de falha é claro
[ ] save preserva captura
```

## Checklist de KO/anti-soft-lock

```text
[ ] monstro ativo a 0 HP não pode agir
[ ] se houver substituto, jogo oferece troca
[ ] se não houver substituto, jogo encerra participação/derrota
[ ] não fica sem botões
[ ] não fica em tela travada
[ ] UI explica o que fazer
```

## Checklist de recompensa/progressão

```text
[ ] vitória concede XP
[ ] XP não duplica
[ ] level up funciona se aplicável
[ ] recompensa aparece
[ ] save preserva XP/recompensa
```

## Checklist de save/continue

```text
[ ] salvar após starter
[ ] salvar após wild
[ ] salvar após captura
[ ] salvar após XP
[ ] recarregar página
[ ] continuar
[ ] jogador permanece
[ ] classe permanece
[ ] time permanece
[ ] box permanece
[ ] inventário permanece
```

## Checklist de UX mínima

```text
[ ] é claro de quem é a vez
[ ] é claro quem é aliado/inimigo
[ ] HP é legível
[ ] ação principal é visível
[ ] captura é compreensível
[ ] mensagens de erro são humanas
[ ] botões funcionam no toque
[ ] não há tela poluída demais
```

## Checklist terapêutico mínimo

```text
[ ] jogo pode ser mediado por terapeuta
[ ] falha não vira punição
[ ] criança pode continuar após erro
[ ] não expõe dados sensíveis
[ ] modo terapeuta, se usado, não aparece por acidente
```

## Bloqueadores absolutos

Não declarar MVP concluído se houver:

```text
[ ] soft-lock
[ ] save corrompendo
[ ] starter errado
[ ] captura quebrada
[ ] wild battle quebrada
[ ] erro crítico no console
[ ] testes principais falhando
[ ] dado manual quebrando combate
```

## Resultado final

```text
MVP 0.3 aprovado? sim/não/parcial

Se parcial, quais bloqueadores restam?

1.
2.
3.
```

## Próxima fase após aprovação

```text
MVP 0.4 — Cartas Básicas e Interface de Decisão
```

Escopo provável:

- 1 carta básica por classe;
- mão de 3 cartas;
- custo de ENE;
- carta bloqueada com explicação;
- teste com criança/terapeuta;
- sem deckbuilding completo.

## Regra final

```text
Só avançar para MVP 0.4 quando o MVP 0.3 for repetível.
```
