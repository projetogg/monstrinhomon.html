# Solução de Bloqueios — Catálogo v3

## Decisão arquitetural

A melhor solução para os bloqueios do catálogo v3 **não** é sobrescrever `data/monsters.json` imediatamente.

Isso destruiria a estabilidade do runtime atual, especialmente por causa das colisões em `MON_021–030` e da duplicidade semântica de `Arcanumon`.

A estratégia adotada neste repositório passa a ser:

1. **Catálogo canônico de design** continua usando os IDs oficiais do v3.
2. **Runtime vivo** preserva seus IDs atuais onde já existe conteúdo ativo.
3. **Famílias conflitantes** ganham IDs seguros de runtime em faixa reservada.
4. **Ativação** acontece por patch gerado, nunca por hard replace manual.

---

## Problema 1 — Colisão de namespace em `MON_021–030`

### Diagnóstico
Esses IDs já existem no runtime ativo, mas no catálogo v3 representam criaturas diferentes.

### Solução aplicada
Foi criada uma camada explícita de resolução em `js/data/catalogV3RuntimeResolution.js`:

- `MON_021–024` → `MON_121–124`
- `MON_025–028` → `MON_125–128`
- `MON_029–032` → `MON_129–132`

### Por que esta solução é melhor
- preserva o runtime atual;
- preserva os IDs canônicos do v3 em design/documentação;
- evita overwrite perigoso;
- mantém famílias contínuas no runtime seguro.

---

## Problema 2 — Duplicidade de nome em `Arcanumon`

### Diagnóstico
- `MON_024` v3 = `Arcanumon` (Curandeiro)
- `MON_102` runtime = `Arcanumon` (Mago Lendário)

### Solução aplicada
A resolução de runtime agora declara rename obrigatório:

- `MON_102` → `Arcanomagusmon`

### Por que esta solução é melhor
- remove ambiguidade sem mexer no canonId;
- mantém o lendário distinguível;
- libera `Arcanumon` para o uso canônico do v3.

---

## Problema 3 — `MONSTROS.csv` legado no caminho ativo

### Diagnóstico
O arquivo antigo continuava na raiz do projeto e competia semanticamente com `data/monsters.json` e com a base v3.

### Solução aplicada
- o arquivo foi arquivado em `docs/archive/MONSTROS.csv`;
- o arquivo da raiz foi removido.

### Por que esta solução é melhor
- reduz risco de leitura errada por humanos e IA;
- evita que ferramentas futuras tratem a planilha legada como fonte ativa;
- mantém histórico sem manter ambiguidade operacional.

---

## Problema 4 — Falta de ponte operacional entre CSV oficial e runtime

### Diagnóstico
O catálogo oficial em CSV estava consolidado, mas não havia uma ponte técnica segura para gerar artefatos de runtime.

### Solução aplicada
Foi criado `scripts/build-catalog-v3-runtime-patch.mjs`.

Esse script:
- lê `docs/catalog_v3/monstrinhomon_status_oficial.csv`;
- gera `docs/catalog_v3/monstrinhomon_status_oficial.json`;
- gera `docs/catalog_v3/monstrinhomon_status_runtime_patch.json`;
- traduz `agi -> baseSpd`;
- aplica `canonId -> runtimeId` com faixa reservada;
- marca monstros bloqueados com `runtimeEnabled=false` e `blockReason=no_art`;
- preserva metadados de confiança, origem e naming status.

### Por que esta solução é melhor
- transforma documentação em artefato técnico real;
- evita importação manual propensa a erro;
- prepara fase futura de ativação com rastreabilidade.

---

## Problema 5 — Família `MON_029–032` ainda bloqueada

### Diagnóstico
O catálogo já possui stats coerentes, mas a família ainda não deve ser ativada por falta de arte e por risco de outlier em combate.

### Solução aplicada
A família segue oficialmente no catálogo, mas o runtime patch passa a marcá-la como bloqueada:

```json
{
  "runtimeEnabled": false,
  "blockReason": "no_art"
}
```

### Por que esta solução é melhor
- mantém o design pronto sem ativar cedo demais;
- separa claramente “definido em catálogo” de “liberado no jogo”.

---

## Resultado prático

Com essa solução, o projeto passa a ter:

- uma fonte canônica de design;
- uma camada explícita de tradução para runtime;
- uma política clara para famílias bloqueadas;
- um gerador técnico de patch;
- menos ambiguidade documental.

## Próxima etapa recomendada

A próxima etapa técnica correta é:

1. executar o gerador de patch;
2. revisar o JSON de runtime gerado;
3. aplicar rename de `MON_102` no runtime vivo;
4. criar/importar somente o lote seguro;
5. deixar a família `MON_029–032` bloqueada até arte + playtest.
