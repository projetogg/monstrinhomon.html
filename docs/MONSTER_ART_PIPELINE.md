# Pipeline de Arte — Monstrinhos

## Fonte Canônica de Metadata

O arquivo `data/monsters.json` é a **fonte única e canônica** de metadata dos monstrinhos.
Nenhuma outra fonte substitui ou sobrescreve os dados definidos nele.

---

## Campo `image` (opcional)

O schema do catálogo agora aceita um campo opcional `image`:

```json
{
  "id": "MON_001",
  "name": "Ferrozimon",
  "class": "Guerreiro",
  "rarity": "Comum",
  "emoji": "⚔️",
  "image": "assets/monsters/MON_001.png"
}
```

- O campo é **opcional**: monstrinhos sem `image` continuam funcionando normalmente via fallback de emoji.
- O campo `emoji` **nunca deve ser removido**: é o fallback garantido enquanto os assets de imagem não existirem.

---

## Convenção de Paths de Assets

Todos os assets de imagem de monstrinhos devem seguir o padrão:

```
assets/monsters/MON_XXX.png
```

Exemplos:
- `assets/monsters/MON_001.png`
- `assets/monsters/MON_005.png`
- `assets/monsters/MON_028.png`

Regras:
- Formato obrigatório: **PNG**
- Nome do arquivo: `{ID_DO_MONSTRO}.png` (ex: `MON_001.png`)
- Pasta raiz: `assets/monsters/`
- IDs devem ser exatamente os IDs canônicos de `monsters.json`

---

## Regra de Fallback Visual

O helper canônico `js/ui/monsterVisual.js` implementa a seguinte lógica:

1. Se `monster.image` existir → renderizar `<img src="..." alt="...">`
2. Caso contrário → renderizar fallback `<span>` com emoji

**Nenhuma UI deve implementar essa lógica diretamente.** Todo render visual de monstrinho deve passar pelo helper `monsterVisual.js`.

---

## Primeira Leva de Arte (futura)

A primeira leva de imagens cobrirá os **8 starters base**, um por classe:

| ID       | Nome        | Classe      |
|----------|-------------|-------------|
| MON_001  | Ferrozimon  | Guerreiro   |
| MON_005  | Dinomon     | Bardo       |
| MON_009  | Miaumon     | Caçador     |
| MON_013  | Lagartomon  | Mago        |
| MON_017  | Luvursomon  | Animalista  |
| MON_028  | Nutrilo     | Curandeiro  |
| MON_029  | Tigrumo     | Bárbaro     |
| MON_030  | Furtilhon   | Ladino      |

Os campos `image` já estão declarados no catálogo com os paths previstos.
Os PNGs **ainda não existem** — serão entregues em uma PR posterior de assets.

---

## Escopo desta PR (PR1 — Infraestrutura)

Esta PR entregou **apenas infraestrutura**. A integração nas UIs de runtime foi realizada na **PR2**.

## Integração nas UIs (PR2 — Integração)

As seguintes UIs foram integradas com `monsterVisual.js` na PR2:

- **`partyDexUI.js`** — estados `seen` (silhueta) e `captured` (imagem ou emoji) usam o helper canônico
- **`eggHatchModal.js`** — resultado do nascimento usa o helper canônico
- **`js/combat/groupUI.js`** — cards de combate (jogador, inimigo, swap) usam o helper canônico

O jogo funciona com emojis como fallback enquanto os PNGs não existem.
Quando os PNGs forem entregues, as UIs exibirão as imagens automaticamente, sem nenhuma mudança adicional.

---

## Validação Automática

O script `scripts/validate-monster-assets.mjs` verifica:

1. Todos os campos `image` declarados no catálogo têm arquivo físico correspondente
2. Não há dois monstrinhos apontando para o mesmo asset (colisão de paths)
3. Cada asset em `assets/monsters/` segue a convenção `MON_XXX.png`
4. Assets presentes no diretório sem entrada no catálogo são reportados como órfãos

**Comportamento durante a transição** (antes dos PNGs existirem):
O script reporta campos `image` declarados sem arquivo físico como **avisos** (`⚠️`), não erros fatais.
O script falha com erro (exit code 1) apenas se encontrar colisões de path ou paths mal formatados.

Executar via:
```bash
npm run validate:monster-assets
```

---

## Estilos CSS

As classes de estilo da camada visual estão em `css/main.css`:

- `.monster-visual` — base de todo visual de monstrinho
- `.monster-visual--sm` — tamanho pequeno (32×32px)
- `.monster-visual--md` — tamanho médio (64×64px, padrão)
- `.monster-visual--lg` — tamanho grande (96×96px)
- `.monster-emoji` — estilo específico para fallback de emoji
- `.monster-silhouette` — aplica efeito de silhueta (funciona em `<img>` e emoji)

---

_Última atualização: PR1 — Infraestrutura Visual_
