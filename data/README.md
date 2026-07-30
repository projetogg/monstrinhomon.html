# Diretório `data/`

**Status:** ACTIVE  
**Domain:** dados runtime  
**Authority:** GitHub  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** descrição antiga que tratava dados estruturados como migração futura

Este diretório reúne dados estruturados usados pelo jogo e artefatos auxiliares. A presença de um arquivo aqui não define, isoladamente, sua autoridade: sempre confirme loader, fallback, normalização, testes e decisões do domínio.

## Fontes runtime verificadas

| Domínio | Fonte principal | Observação |
|---|---|---|
| Monstrinhos | `monsters.json` | catálogo runtime; loaders atuais definem a forma consumida |
| Fallback de monstrinhos | `monsters.bootstrap.json` | usado somente quando o caminho principal falha, conforme runtime e testes |
| Skills | `skills.json` | fonte mecânica atual via `js/data/skillsLoader.js` |
| Cards visuais | `cards.json` | metadados visuais; não duplica mecânica das skills |
| Itens | `items.json` | confirmar loader e contratos antes de editar |
| Locais | `locations.json` | usado pelo fluxo de exploração e testes de integridade |
| Mapa | `worldMap.json` | estrutura de navegação e encontros especiais |

A lista acima é operacional, não um schema duplicado. Leia os próprios arquivos, loaders e testes do commit atual.

## Autoridade e classificação

Antes de editar qualquer arquivo:

1. consulte `docs/AUTHORITY_MAP.md`;
2. localize o loader real;
3. identifique fallback e normalização;
4. localize testes e validadores;
5. verifique referências cruzadas;
6. avalie compatibilidade com saves;
7. separe manutenção, migração editorial e balanceamento.

Dados em `design/canon/`, planilhas do Drive, artefatos de migração e CSVs históricos não vencem automaticamente os dados carregados pelo runtime.

## IDs e saves

- IDs existentes são estáveis.
- Não renomeie, recicle ou remapeie IDs sem migração explícita.
- Mudanças que afetem saves devem declarar compatibilidade e rollback.
- Não derive padrões de ID de exemplos antigos ou documentos substituídos.
- Nomes editoriais aprovados não autorizam mudança automática de ID ou runtime.

## Skills e Card Layer

- `skills.json` permanece a fonte mecânica das skills.
- `cards.json` descreve apresentação visual.
- Cards não devem copiar `power`, custo, acurácia, alvo, duração ou efeito.
- A Card Layer visual atual não implementa deck, mão, compra ou descarte.
- A visão híbrida futura está registrada separadamente em `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

## CSVs da raiz

Os CSVs localizados na raiz do repositório não fazem parte deste diretório e não devem ser tratados como um único bloco.

Alguns são consumidos por testes ou funcionam como contratos paralelos; outros são históricos ou legados. Antes de mover ou remover um CSV, audite individualmente runtime, testes, scripts, comentários e referências.

Pendência registrada: `PT-003` em `docs/PENDENCIAS_TECNICAS.md`.

## Balanceamento

Alterações em atributos, custos, chances, thresholds, recompensas, evolução, raridade ou progressão não são simples correções documentais.

Elas exigem escopo próprio, evidência, validação antes/depois e decisão humana quando aplicável.

## Validação

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando o ambiente permitir:

```bash
npm run test:wild-loop
```

Use também os comandos específicos do domínio listados em `docs/PROJECT_STATUS.md`.

## Mudanças estruturais

Quando loader, fallback, schema efetivo ou autoridade mudar:

- atualize este arquivo;
- atualize `docs/AUTHORITY_MAP.md`;
- atualize `docs/PROJECT_STATUS.md` quando o estado material mudar;
- preserve compatibilidade e rollback;
- não mantenha uma cópia independente de valores ou fórmulas neste README.
