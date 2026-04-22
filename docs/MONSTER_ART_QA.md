# MONSTER ART QA — PR3.1

Documento de referência para a política de `image` e QA visual do pipeline de arte.

---

## Política Oficial de `image` (a partir da PR3.1)

### Regra Central

> **`image` é dado do template, não da identidade da Monster Instance.**

- O campo `image` vive em `data/monsters.json`, dentro do template do Monstrinho.
- Monster Instances (saves, team, box, instâncias de encontro) **NÃO persistem `image`**.
- A UI resolve `image` a partir do `templateId` da instância → busca no catálogo → usa `template.image`.
- A camada canônica de render é `monsterVisual.js`.

### Motivação

Persistir `image` na instância cria *source of truth drift*: quando a arte muda no catálogo,
as instâncias salvas ficam apontando para paths antigos. Isso é indesejável.

### Derivação Canônica

```
Instance.templateId  →  catalog.get(templateId)  →  template.image  →  <img>
                                                  ↓ (sem image)
                                               template.emoji  →  <span>
```

### Compatibilidade com Saves Legados

Instâncias criadas antes da PR3.1 podem ter `image` persistido. A função `resolveArtFromInstance`
em `monsterVisual.js` possui fallback: se o template não for encontrado, usa `instance.image`
(se presente), depois `instance.emoji`. Isso garante que saves antigos continuam funcionando
sem migração forçada.

---

## Pontos de Criação de Instância Auditados

| Ponto                                  | Arquivo              | Status PR3.1    |
|----------------------------------------|----------------------|-----------------|
| Starter inicial                        | `index.html`         | ✅ sem `image`  |
| Hatch de ovo                           | `js/data/eggHatcher.js` | ✅ sem `image` |
| Captura em batalha                     | `index.html`         | ✅ não copiava  |
| Instância de inimigo (encontro)        | `index.html`         | ✅ sem `image`  |
| Rebuild pós-migração                   | `index.html`         | ✅ não copiava  |

---

## Camada de Render

### `monsterVisual.js` — funções exportadas

| Função                        | Entrada            | Uso                                    |
|-------------------------------|--------------------|----------------------------------------|
| `monsterArtHTML(template, opts)` | Template (catálogo) | Render primário: PartyDex, EggHatch   |
| `hasImage(template)`          | Template           | Verifica se asset foi declarado        |
| `resolveArtFromInstance(instance, catalog, opts)` | Instância + catálogo | Render via templateId (GroupUI, genérico) |

### Telas Integradas

| Tela                | Arquivo               | Estratégia de Render                         |
|---------------------|-----------------------|----------------------------------------------|
| PartyDex (captured) | `js/ui/partyDexUI.js` | `monsterArtHTML(template)` — template direto |
| PartyDex (seen)     | `js/ui/partyDexUI.js` | `monsterArtHTML(template, { imgClass: 'dex-silhouette-img' })` |
| Egg Hatch Modal     | `js/ui/eggHatchModal.js` | `monsterArtHTML(template)` via parâmetro `template` |
| Group Battle UI     | `js/combat/groupUI.js` | `resolveUnitArt(mon, monstersMap)` — lookup via templateId |

---

## QA Visual (PR3.1)

### Procedimento

QA visual foi realizado via inspeção de código e análise estrutural (ambiente Node sem DOM).
Validação em navegador real deve ser feita manualmente nas 4 telas abaixo.

### Checklist de Validação Manual

#### PartyDex

- [ ] Monstrinho capturado exibe `<img>` para os 8 starters
- [ ] Monstrinho `seen` exibe silhueta (filtro CSS `brightness(0)`)
- [ ] Monstrinho `unknown` exibe `❓ ???`
- [ ] Monstrinhos sem `image` exibem emoji correto
- [ ] Cards não apresentam distorção ou overflow

#### Egg Hatch Modal

- [ ] Modal exibe `<img>` para starters que nascem via ovo
- [ ] Modal exibe emoji para monstrinhos sem `image`
- [ ] Arte está centralizada e sem distorção
- [ ] Confirm button funciona normalmente

#### Group Battle UI

- [ ] Unidade do jogador exibe miniatura (28×28) quando starter
- [ ] Inimigo exibe miniatura quando template tem `image`
- [ ] Fallback para emoji funciona para monstrinhos sem `image`
- [ ] Cards não apresentam overflow horizontal

### Problemas Conhecidos / Pendências

- Os 8 PNGs são **placeholders gerados programaticamente** (blocos de cor 64×64).
  Arte real substituirá esses arquivos in-place quando disponível.
- QA visual com sprites orgânicos (diferentes proporções) está **BLOQUEADO** por ausência de arte real.
  A limpeza arquitetural desta PR garante que o pipeline está pronto para receber artes reais.

---

## Regras para Próximas Levas de Arte

1. Adicionar PNG em `assets/monsters/<ID>.png`
2. Declarar `"image": "assets/monsters/<ID>.png"` no template em `data/monsters.json`
3. Executar `npm run validate:monster-assets` — deve passar sem erros
4. **Não copiar `image` para instâncias** — a UI deriva automaticamente via `templateId`
5. Testar nas 3 telas (PartyDex, Egg Hatch, Group UI) com os novos assets

---

**Última atualização**: PR3.1
**Status**: Limpeza arquitetural concluída. Arte real bloqueada — sem sprites finais disponíveis.
