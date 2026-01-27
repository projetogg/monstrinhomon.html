# Data Directory

Este diretório contém os dados do jogo Monstrinhomon em formato CSV e/ou JSON.

## Estrutura

Os dados do jogo são organizados em arquivos que representam diferentes aspectos do jogo:

### Arquivos Esperados

- **monstrinhos.csv/json** - Catálogo de Monstrinhos disponíveis
- **classes.csv/json** - Definições das classes de jogadores
- **itens.csv/json** - Itens disponíveis no jogo
- **habilidades.csv/json** - Habilidades e poderes

## Formato de IDs

Todos os IDs devem seguir o padrão:

- Monstrinhos: `MON_001`, `MON_002`, etc. ou `m_luma`, `m_trok`, etc.
- Itens: `ITM_001`, `ITM_002`, etc. ou `ball_basic`, `potion`, etc.
- Habilidades: `SKL_001`, `SKL_002`, etc.
- Classes: `pc_mago`, `pc_guerreiro`, etc.

## Regras Importantes

1. **IDs são imutáveis** - Nunca renomear um ID existente
2. **IDs são únicos** - Cada entidade tem um ID único
3. **Compatibilidade** - Manter IDs antigos ao criar novos dados
4. **Formato consistente** - Usar o mesmo formato em todos os arquivos

## Campos Obrigatórios

### Monstrinhos
- `id`: string única
- `name`: nome do Monstrinho
- `class`: uma das 7 classes (Mago, Curandeiro, Guerreiro, Bárbaro, Ladino, Bardo, Caçador)
- `rarity`: raridade (Comum, Incomum, Raro, Místico, Lendário)
- `baseHp`: HP base no nível 1

### Classes de Jogador
- `id`: string única
- `name`: nome da classe
- `allowed`: array de classes que podem ser usadas em batalha

### Itens
- `id`: string única
- `name`: nome do item
- `type`: tipo (captura, cura, tatico)
- Campos adicionais dependem do tipo

## Validação

Antes de adicionar novos dados:

1. Verificar que todos os IDs são únicos
2. Verificar que todos os campos obrigatórios estão presentes
3. Validar valores das enumerações (classes, raridades, tipos)
4. Testar no jogo antes de commitar

## Atualização

Para adicionar novos dados:

1. Criar novo arquivo ou atualizar existente
2. Seguir o formato estabelecido
3. Não remover ou renomear dados existentes
4. Documentar mudanças no commit
5. Testar o fluxo completo do jogo

---

**Nota**: Este diretório está preparado para receber dados estruturados. Atualmente, os dados estão hardcoded no `index.html` para o MVP, mas devem ser migrados para este diretório em versões futuras.
