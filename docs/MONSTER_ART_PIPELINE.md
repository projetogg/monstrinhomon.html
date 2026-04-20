# MONSTER ART PIPELINE

Documento de referência para o pipeline de arte dos Monstrinhos em Monstrinhomon.

---

## Status da Primeira Leva (PR3)

Os 8 Starters Base foram materializados. Os seguintes assets PNG estão ativos no repositório:

| ID       | Nome        | Classe     | Arquivo                         |
|----------|-------------|------------|---------------------------------|
| MON_001  | Ferrozimon  | Guerreiro  | `assets/monsters/MON_001.png`   |
| MON_005  | Dinomon     | Bardo      | `assets/monsters/MON_005.png`   |
| MON_009  | Miaumon     | Caçador    | `assets/monsters/MON_009.png`   |
| MON_013  | Lagartomon  | Mago       | `assets/monsters/MON_013.png`   |
| MON_017  | Luvursomon  | Animalista | `assets/monsters/MON_017.png`   |
| MON_028  | Nutrilo     | Curandeiro | `assets/monsters/MON_028.png`   |
| MON_029  | Tigrumo     | Bárbaro    | `assets/monsters/MON_029.png`   |
| MON_030  | Furtilhon   | Ladino     | `assets/monsters/MON_030.png`   |

---

## Estrutura de Paths

```
assets/
  monsters/
    MON_001.png
    MON_005.png
    MON_009.png
    MON_013.png
    MON_017.png
    MON_028.png
    MON_029.png
    MON_030.png
```

**Regra de nomenclatura:** nome do arquivo deve ser exatamente `<ID>.png` (sem espaços, sem aliases).

---

## Campo `image` no Catálogo

Os 8 starters têm o campo `image` declarado em `data/monsters.json`:

```json
{
  "id": "MON_001",
  "name": "Ferrozimon",
  "class": "Guerreiro",
  "emoji": "⚔️",
  "image": "assets/monsters/MON_001.png",
  ...
}
```

O restante do catálogo **não tem** o campo `image` — isso é intencional. O fallback por emoji
continua funcionando para todos os monstrinhos sem imagem declarada.

---

## Regras de Validação (PR3+)

A partir da PR3, a presença do campo `image` em `data/monsters.json` implica **obrigatoriedade** do arquivo:

| Situação                            | Resultado      |
|-------------------------------------|----------------|
| `image` declarado + arquivo existe  | ✅ OK           |
| `image` declarado + arquivo ausente | ❌ ERRO (exit 1)|
| `image` ausente (fallback emoji)    | ✅ Permitido    |
| Path com espaço                     | ❌ ERRO         |
| Nome != `<ID>.png`                  | ❌ ERRO         |
| Colisão de path entre monstros      | ❌ ERRO         |

Para rodar a validação:

```bash
npm run validate:monster-assets
```

---

## Integração com as UIs

O helper `js/ui/monsterVisual.js` centraliza a lógica de renderização:

- **`monsterArtHTML(template, opts)`**: retorna `<img>` se `template.image` existir, senão `<span>` com emoji.
- **`hasImage(template)`**: boolean — `true` se o template tem image declarado.

### PartyDex (`js/ui/partyDexUI.js`)
- Estado **captured**: usa `<img class="dex-monster-img">` se image presente, emoji senão.
- Estado **seen**: usa `<img class="dex-monster-img dex-silhouette-img">` — a silhueta é aplicada pelo CSS pai `.dex-seen .dex-art { filter: brightness(0) ... }`.
- Estado **unknown**: ❓ (sem mudança).

### Egg Hatch (`js/ui/eggHatchModal.js`)
- Modal de nascimento usa `<img class="egg-hatch-monster-img">` para os 8 starters.
- Fallback para emoji nos demais.

### Group Combat (`js/combat/groupUI.js`)
- Cards de unidade usam `<img class="group-unit-img">` (thumbnail 28×28) quando `mon.image` presente.
- Fallback para emoji nos demais.

---

## Fallback por Emoji

O restante do catálogo (todos os monstrinhos sem `image`) continua exibindo o emoji correspondente.
Isso é o comportamento padrão até próximas levas de arte.

---

## Próximas Levas

Esta foi a **primeira leva**: os 8 starters base (1 por classe).

Levas futuras devem seguir o mesmo processo:
1. Adicionar PNGs em `assets/monsters/<ID>.png`
2. Adicionar campo `image` no monster correspondente em `data/monsters.json`
3. Rodar `npm run validate:monster-assets` — deve passar
4. Rodar `npm test` — nenhum teste deve quebrar

---

## Histórico

| Versão | Descrição                                                   |
|--------|-------------------------------------------------------------|
| PR1    | Pipeline de arte preparado; helper monsterVisual pendente   |
| PR2    | Validador criado em modo permissivo (warning-only)          |
| PR3    | 8 starters materializados; validador endurecido (erro real) |
