# DEC-SP04-OPENING-01

**Status:** ACTIVE
**Domain:** produto / técnica
**Authority:** GitHub
**VerifiedAgainst:** decisão explícita do autor em 2026-10-08; baseline `490d69c885863ca0d271438f8b9efd757147f652`
**Supersedes:** decisão pendente

O autor aprovou a opção B para `swiftclaw`: o primeiro ataque básico ou habilidade de dano que acertar um inimigo recebe +1 ATK, uma única vez por combate. Erros e habilidades de controle, incluindo Armadilha I, não consomem o benefício.

**Implementação:** IMPLEMENTED no PR #317 (DEC-SP04-OPENING-01), depois do PR #316 que corrigiu separadamente o bug Group #309. Wild, Group e harness usam abertura por primeiro acerto de básico ou skill DAMAGE, com consumo único e regressões. **Caveat:** o adapter atual de skill Wild não possui rolagem de precisão explícita; a confirmação de que a skill de dano atingiu o alvo é feita por redução de HP após execução bem-sucedida. Não se criou uma nova regra de acurácia nem se alterou +1 ATK, PWR ou ENE. Isso não libera automaticamente playtest humano.
