# Roteiro de Auditoria Prática — MVP 0.3

## Finalidade

Este roteiro serve para testar o jogo real, não apenas a ideia do jogo.

Pergunta central:

```text
O Monstrinhomon funciona quando alguém tenta jogar agora?
```

## Antes de começar

Registrar:

```text
Data:
Branch:
Commit:
Navegador:
Dispositivo:
Modo:
Testador:
```

## Preparação técnica

Executar:

```bash
npm test
npm run validate-data
npm run validate:monster-assets
```

Registrar:

```text
npm test: passou / falhou
validate-data: passou / falhou
validate:monster-assets: passou / falhou / avisos
```

## 1. Abertura

```text
[ ] página carrega
[ ] sem tela branca
[ ] sem erro crítico no console
[ ] botões principais aparecem
[ ] layout aceitável no dispositivo
```

## 2. Novo jogo

Passos:

```text
1. Criar novo jogador
2. Escolher nome
3. Escolher classe
4. Confirmar starter
```

Registrar:

```text
Classe escolhida:
Starter recebido:
Starter esperado:
Correto? sim/não
Erro no console:
```

Critérios:

```text
[ ] nome salva
[ ] classe salva
[ ] starter correto
[ ] monstro aparece no time
[ ] HP/atributos válidos
```

## 3. Dados do starter

Verificar:

```text
[ ] ID existe em monsters.json
[ ] classe correta
[ ] raridade válida
[ ] baseHp > 0
[ ] baseAtk válido
[ ] baseDef válido
[ ] baseSpd/baseAgi válido
[ ] baseEne válido
[ ] emoji existe
[ ] image ou fallback funciona
```

## 4. Wild battle

Passos:

```text
1. Iniciar encontro wild
2. Ver inimigo
3. Ver HP do jogador
4. Ver HP do inimigo
5. Ver ações disponíveis
```

Critérios:

```text
[ ] encontro inicia
[ ] inimigo válido
[ ] player ativo válido
[ ] HP visível
[ ] ações aparecem
[ ] não trava
```

## 5. Ataque básico

### Modo automático

```text
[ ] rola dado
[ ] calcula acerto/dano
[ ] HP do inimigo muda
[ ] inimigo responde
[ ] HP do jogador muda se atingido
[ ] log compreensível
```

### Modo manual

```text
[ ] aceita 1–20
[ ] rejeita inválidos
[ ] não quebra com campo vazio
[ ] resultado aparece
```

## 6. Captura

Passos:

```text
1. Reduzir HP do inimigo
2. Tentar capturar
3. Observar consumo de orb
4. Ver resultado
```

Critérios de sucesso:

```text
[ ] orb consumida
[ ] captura bem-sucedida adiciona ao team
[ ] se team cheio, adiciona ao box
[ ] encontro termina
[ ] save preserva captura
```

Critérios de falha:

```text
[ ] orb consumida
[ ] inimigo não é adicionado
[ ] combate continua
[ ] feedback explica falha
```

## 7. Vitória

```text
[ ] encontro termina
[ ] XP aplica
[ ] level up se aplicável
[ ] estado salva
[ ] não duplica recompensa
```

## 8. KO/derrota

Passos:

```text
1. Permitir que o monstro ativo chegue a 0 HP
2. Observar comportamento do jogo
```

Critérios:

```text
[ ] abre troca se houver substituto
[ ] encerra se não houver substituto
[ ] não permite ação inválida
[ ] não fica preso
[ ] UI explica
```

Se falhar, classificar como:

```text
P0 — bloqueador crítico
```

## 9. Save/continue

Passos:

```text
1. Fazer progresso: captura ou XP
2. Salvar
3. Recarregar página
4. Clicar continuar
5. Ver estado
```

Critérios:

```text
[ ] jogador permanece
[ ] classe permanece
[ ] starter permanece
[ ] captura permanece
[ ] XP permanece
[ ] inventário permanece
[ ] quest/progresso permanece, se aplicável
```

## 10. UI infantil

Observar:

```text
[ ] criança saberia de quem é a vez?
[ ] HP está claro?
[ ] ação principal está clara?
[ ] captura está clara?
[ ] erro tem mensagem compreensível?
[ ] botões são grandes?
[ ] funciona no toque?
```

## Registro de bug

Modelo:

```text
ID:
Título:
Data:
Branch/commit:
Passos para reproduzir:
Resultado esperado:
Resultado real:
Console/log:
Severidade:
Arquivo provável:
Bloqueia MVP? sim/não
Próxima ação:
```

## Classificação de severidade

| Severidade | Definição |
|---|---|
| P0 | impede jogar ou corrompe save |
| P1 | quebra fluxo importante |
| P2 | confunde, mas contornável |
| P3 | polimento |
| P4 | melhoria futura |

## Conclusão

Responder:

```text
O Wild Loop está jogável? sim/não/parcial
O save está confiável? sim/não/parcial
A captura está confiável? sim/não/parcial
Há soft-lock? sim/não
Pode avançar para cartas simples? sim/não
```

## Regra final

```text
Não avançar para sistema novo se houver P0 aberto.
```
