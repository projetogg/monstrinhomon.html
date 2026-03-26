# Base refinada de monstrinhos para GitHub

Arquivos gerados:
- `data/monsters.json` → pronto para o loader atual do projeto
- `data/progression.config.json` → curva de progressão e configuração recomendada
- `data/monster_families.json` → índice por famílias
- `docs/monster-balance-study.md` → racional de balanceamento

## Compatibilidade
O arquivo `monsters.json` mantém os campos que o repositório atual já usa:
- `id`
- `name`
- `class`
- `rarity`
- `baseHp`
- `baseAtk`
- `baseDef`
- `baseSpd`
- `baseEne`
- `emoji`
- `evolvesTo`
- `evolvesAt`

## Totais
- Famílias: 15
- Monstrinhos: 50
- Linhas iniciais: 5
- Linhas secundárias: 10

## Uso no repositório
Coloque `monsters.json` em:
`data/monsters.json`

Opcionalmente, coloque os outros arquivos em:
- `data/progression.config.json`
- `data/monster_families.json`
- `docs/monster-balance-study.md`
