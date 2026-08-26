# Decisão — descontinuação de `MON_100`

**Status:** IMPLEMENTED

**Domain:** técnica

**Authority:** GitHub

**VerifiedAgainst:** `6d59d876b1459b4ebd54d4838b1fffdfd83ad7cc`

**Supersedes:** nenhum

## Contexto

`MON_100` (`Rato-de-Lama`) permanece no catálogo runtime, em pools de áreas,
templates de encontro e listagens do cliente. A Dex editorial atual não inclui
essa espécie, mas essa divergência editorial, sozinha, não autorizava uma
alteração de runtime.

Em 2026-08-25, o autor aprovou explicitamente a descontinuação compatível:
impedir novas aparições e preservar saves e referências existentes.

## Decisão aprovada

1. Manter o registro `MON_100` em `data/monsters.json` para resolução de IDs
   existentes.
2. Marcar o template como descontinuado.
3. Excluir templates descontinuados de novos encontros, ovos, catálogos e
   seletores de concessão.
4. Remover `MON_100` dos pools de localização, dos templates de encontro e do
   contrato paralelo `ENCOUNTERS.csv`.
5. Permitir que instâncias já presentes em saves continuem carregando e
   aparecendo em time, caixa e encontros já salvos.
6. Preservar entradas antigas na Monstrodex/PartyDex, sem contá-las nos totais,
   progressos ou novos marcos do catálogo ativo.
7. Fazer a implementação em PR pequeno, isolado, testado e reversível.

## Compatibilidade

- O ID `MON_100` não é removido nem renomeado.
- O loader continua incluindo o template no mapa usado para lookup.
- Saves existentes continuam resolvendo nome, classe e atributos do registro.
- A descontinuação afeta apenas ofertas e gerações novas.

## Fora do escopo

- migração ou exclusão de saves;
- alteração de atributos, classe, raridade ou fórmula;
- substituição por uma espécie editorial nova;
- migração ampla de nomes ou IDs da Dex;
- mudança no portão atual do playtest das passivas de espécie.

## Validação exigida

- `MON_100` continua encontrável por ID;
- `MON_100` não aparece em pools de localização, templates ou contratos de encontro;
- ovos, Monstrodex e seletores não oferecem templates descontinuados;
- contadores e marcos ignoram entradas descontinuadas sem apagar o save;
- testes gerais, validadores de dados/assets e smoke Vitest permanecem verdes.

## Rollback

Reverter o PR isolado restaura o comportamento anterior. Como o registro não é
apagado e não há migração de save, o rollback não exige transformação de dados.

## Implementação confirmada

A decisão foi implementada pelo PR #283 e integrada à `main` no commit
`6d59d876b1459b4ebd54d4838b1fffdfd83ad7cc`. Os testes, validadores, smoke
Vitest, Playwright e a publicação do GitHub Pages permaneceram verdes após o
merge.
