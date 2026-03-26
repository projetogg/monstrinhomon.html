# Bootstrap do catálogo de monstrinhos

Arquivo principal: `data/monsters.bootstrap.json`

## O que já vem nessa base
- 37 monstrinhos
- 5 linhas iniciais com 4 estágios
- 7 linhas secundárias com 3 estágios
- raridade, estágio, evolução, drops, encounter, capture, skills e stats

## Campos principais por monstrinho
- `id`
- `name`
- `family`
- `isStarterLine`
- `classes`
- `primaryClass`
- `rarity`
- `stage`
- `levelRange`
- `evolution`
- `stats`
- `roleTags`
- `capture`
- `encounter`
- `skills`
- `drops`
- `lore`
- `art`

## Observações importantes
1. Os números são uma base de prototipagem, não um balanceamento final.
2. A linha do seu catálogo foi preservada e expandida.
3. Alguns nomes foram inventados para preencher o bestiário inicial.
4. O arquivo pode ser renomeado depois para `data/monsters.json` quando você decidir torná-lo a fonte oficial.

## Sugestão de uso no código
```js
const data = await fetch('./data/monsters.bootstrap.json').then(r => r.json());
const monsters = data.monsters;

const starterPool = monsters.filter(m => m.isStarterLine && m.stage.code === 'B0');
const wildPool = monsters.filter(m => m.capture.baseRate >= 0.42);
```

## Próximo passo ideal
- ligar esse arquivo ao `DataLoader`
- criar placeholder de imagem para cada `art.assetKey`
- separar depois em arquivos por família ou por classe, se crescer muito
