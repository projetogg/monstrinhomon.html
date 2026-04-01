# Monstrinhomon — Notas de Integração de Boot

## Objetivo
Preparar uma evolução do ponto de inicialização do jogo para que a camada canônica deixe de entrar apenas de forma tardia, sem exigir um refactor grande agora.

## Estado atual da Fase 1
Na Fase 1, a tabela de vantagens de classe pode ser carregada de forma assíncrona e substituir a configuração hardcoded depois do boot inicial.

Isso foi aceitável como etapa de transição, porque:
- reduz risco de regressão;
- evita travar o motor atual;
- permite validar a leitura do cânone com baixo impacto.

## Limitação conhecida
Esse modelo ainda deixa o sistema com uma verdade carregada tardiamente.

Em termos arquiteturais, isso significa que:
- o runtime pode iniciar com um fallback legado;
- e, depois, trocar para a verdade canônica.

Isso é aceitável na transição, mas não deve ser o estado durável da arquitetura.

## Meta da Fase 1.1
A próxima melhoria de baixo risco deve ser:
- preparar um ponto de boot mais consistente para leitura do cânone;
- idealmente antes do restante do jogo depender de `GameState.config.classAdvantages`.

## Direção recomendada
Sem fazer refactor grande agora, o caminho mais seguro é:
1. manter fallback legado;
2. centralizar o carregamento canônico em um ponto único;
3. reduzir o espalhamento de configuração hardcoded;
4. preparar uma futura inicialização controlada antes da lógica de batalha usar a configuração.

## O que ainda não fazer
- Não bloquear o boot completo do jogo agora.
- Não migrar toda a configuração global para modelo assíncrono de uma vez.
- Não refatorar todo o `index.html` apenas por causa desta etapa.

## Critério de sucesso futuro
A evolução desta etapa estará bem-feita quando:
- a leitura canônica acontecer cedo e de forma previsível;
- a tabela de vantagens não depender mais de troca tardia improvisada;
- e o runtime permanecer compatível com o legado enquanto a migração continua.
