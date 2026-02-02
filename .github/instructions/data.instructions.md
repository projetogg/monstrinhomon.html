---
description: "Instruções para manipulação de dados do jogo (JSON/CSV)"
applyTo: "data/**/*"
---

# Instruções de Dados - Monstrinhomon

## Localização e Formato
- Todos os dados do jogo ficam em `/data`
- Formatos suportados: JSON e CSV
- JSON é preferido para novos dados (melhor tipagem e flexibilidade)

## Arquivos de Dados Principais

### monsters.json
Catálogo de Monstrinhos do jogo
- `id`: identificador único (ex: `m_luma`, `m_trok`) - **IMUTÁVEL**
- `name`: nome do Monstrinho
- `class`: classe (Guerreiro, Mago, Curandeiro, Bárbaro, Ladino, Bardo, Caçador, Animalista)
- `rarity`: raridade (Comum, Incomum, Raro, Místico, Lendário)
- `baseHp`: HP base no nível 1
- `growthClass`: template de crescimento de stats

### items.json
Itens do jogo (captura, cura, tático)
- `id`: identificador único (ex: `item_pokeball`) - **IMUTÁVEL**
- `name`: nome do item
- `type`: tipo (`captura`, `cura`, `tatico`)
- `bonus`: bônus numérico (captura, cura, etc)
- `description`: descrição do item

### skills.json
Habilidades dos Monstrinhos
- `id`: identificador único (ex: `skill_tackle`) - **IMUTÁVEL**
- `name`: nome da habilidade
- `type`: tipo da habilidade
- `power`: poder base
- `energyCost`: custo de energia
- `description`: descrição da habilidade

### CSV Files (Legacy)
Arquivos CSV legados ainda em uso:
- `CLASSES.csv` - definição de classes
- `MONSTROS.csv` - dados de monstros (formato antigo)
- `QUESTS.csv` - quests do jogo
- `ENCOUNTERS.csv` - encontros
- `EVOLUCOES.csv` - evoluções

## Regras CRÍTICAS

### IDs São Imutáveis
⚠️ **NUNCA renomear IDs existentes**
- IDs são referenciados em save files de jogadores
- Mudar um ID quebra saves existentes
- Se precisa mudar algo:
  1. Criar novo ID
  2. Manter o antigo para compatibilidade
  3. Adicionar campo `deprecated: true` ao antigo

### Validação de Dados
Ao adicionar ou modificar dados, sempre validar:
1. **IDs únicos** - nenhum ID duplicado no mesmo arquivo
2. **Campos obrigatórios** - todos os campos necessários presentes
3. **Tipos corretos** - números são números, strings são strings
4. **Valores válidos** - raridades, classes, tipos devem estar na lista permitida
5. **Referências válidas** - IDs referenciados existem

### Classes Válidas
```javascript
const VALID_CLASSES = [
  'Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 
  'Ladino', 'Bardo', 'Caçador', 'Animalista'
];
```

### Raridades Válidas
```javascript
const VALID_RARITIES = [
  'Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'
];
```

## Padrões de Nomenclatura

### IDs
- Monsters: `m_[nome]` (ex: `m_luma`, `m_trok`)
- Items: `item_[nome]` (ex: `item_pokeball`, `item_potion`)
- Skills: `skill_[nome]` (ex: `skill_tackle`, `skill_fireball`)
- Quests: `quest_[numero]` (ex: `quest_01`, `quest_02`)
- Classes: `CLS_[abrev]` (ex: `CLS_WAR`, `CLS_MAG`)

### Nomes
- Usar capitalização apropriada
- Sem caracteres especiais problemáticos
- Acentos são permitidos (português)

## Estrutura JSON Recomendada

### Exemplo de Monster
```json
{
  "id": "m_luma",
  "name": "Luma",
  "class": "Mago",
  "rarity": "Comum",
  "baseHp": 26,
  "growthClass": "Mago",
  "stage": "S1",
  "isStarter": true,
  "description": "Um pequeno monstro de luz mágica"
}
```

### Exemplo de Item
```json
{
  "id": "item_pokeball",
  "name": "Pokebola",
  "type": "captura",
  "bonus": 0.15,
  "cost": 10,
  "description": "Bola básica de captura"
}
```

## Adicionando Novos Dados

### Checklist
1. [ ] Escolher ID único e seguir padrão de nomenclatura
2. [ ] Preencher todos os campos obrigatórios
3. [ ] Validar tipos de dados
4. [ ] Verificar valores válidos (classes, raridades, etc)
5. [ ] Testar carregamento do arquivo
6. [ ] Verificar se não quebrou saves existentes
7. [ ] Documentar mudanças (se significativas)

### Processo
1. Editar arquivo JSON/CSV apropriado
2. Executar validação (se existir script de validação)
3. Testar no jogo (carregar e verificar)
4. Commitar com mensagem descritiva

## Modificando Dados Existentes

### O Que Pode Ser Modificado
✅ Valores numéricos (HP, poder, bônus)
✅ Descrições e textos
✅ Adicionar novos campos (com valores default)

### O Que NÃO Pode Ser Modificado
❌ IDs existentes
❌ Remover campos que podem estar em saves
❌ Mudar tipo de campo (string → number, etc)

### Processo Seguro
1. Fazer backup do arquivo
2. Fazer mudança mínima necessária
3. Testar com save file existente
4. Verificar compatibilidade
5. Commitar com explicação detalhada

## Integração com Código

### Carregamento de Dados
Os dados são carregados pelo `dataLoader.js`:
```javascript
import { loadGameData } from './js/data/dataLoader.js';

const gameData = await loadGameData();
// gameData.monsters - array de monstros
// gameData.items - array de itens
// gameData.skills - array de habilidades
```

### Acesso aos Dados
```javascript
// Buscar por ID
const monster = gameData.monsters.find(m => m.id === 'm_luma');

// Filtrar por classe
const warriors = gameData.monsters.filter(m => m.class === 'Guerreiro');

// Filtrar por raridade
const rares = gameData.monsters.filter(m => m.rarity === 'Raro');
```

## Validação e Testes

### Executar Validação
```bash
# Se existir script de validação
npm run validate-data
```

### Testes Relacionados
- `tests/dataLoader.test.js` - testes de carregamento
- `tests/templateIntegration.test.js` - testes de integridade

## CSV para JSON (Migração)

Se precisar converter CSV legado para JSON:
1. Manter CSV original como backup
2. Criar arquivo JSON equivalente
3. Atualizar código para usar JSON
4. Testar extensivamente
5. Marcar CSV como deprecated

## Regras de Balanceamento

### HP Base
- Comum: 20-35
- Incomum: 30-45
- Raro: 40-60
- Místico: 55-75
- Lendário: 70-100

### Raridade e Poder
```javascript
RARITY_PWR = {
  Comum: 1.00,
  Incomum: 1.08,
  Raro: 1.18,
  Místico: 1.32,
  Lendário: 1.50
}
```

### Captura Base (%)
```javascript
CAPTURE_BASE = {
  Comum: 60,
  Incomum: 45,
  Raro: 30,
  Místico: 18,
  Lendário: 10
}
```

## Documentação

### Após Mudanças Significativas
Atualizar documentação relevante:
- `GAME_RULES.md` - se regras mudaram
- `.github/copilot-instructions.md` - se estrutura mudou
- `data/README.md` - se novos arquivos/formatos

---

**Última atualização**: 2026-02-02
