# Estudo de progressão e evolução — Monstrinhomon

## Objetivo
Produzir uma base que fique o mais perto possível do ideal para protótipo jogável, sem exigir grande retrabalho imediato.

## Critérios usados
1. **Compatibilidade com o código atual**  
   O repositório já espera `id`, `name`, `class`, `rarity`, `baseHp`, além de `baseAtk/baseDef/baseSpd/baseEne`, `emoji`, `evolvesTo`, `evolvesAt`.

2. **Respeito ao cânone que já apareceu no projeto**  
   - 5 linhas iniciais com 4 estágios  
   - evolução de iniciais em `12 / 25 / 45`  
   - linhas secundárias com 3 estágios em `15 / 30`  
   - forma final híbrida nas linhas iniciais

3. **Curva de poder previsível**  
   Em vez de números arbitrários por monstrinho, a base nasce de:
   - perfil base da classe
   - multiplicador por estágio
   - ajuste moderado para híbridos

## Perfis base de classe
- **Guerreiro**: HP/DEF altos, SPD/ENE baixos
- **Mago**: ENE alto, HP baixo, ATK mágico consistente
- **Curandeiro**: ENE muito alto, ATK baixo, utilidade alta
- **Bárbaro**: HP/ATK altos, pouca técnica
- **Ladino**: SPD alto, HP baixo, pressão de alvo
- **Bardo**: SPD/ENE bons, pressão indireta e suporte
- **Caçador**: ATK/SPD altos, DEF baixa
- **Animalista**: meio-termo versátil

## Multiplicadores por estágio
- **B0** = 1.00
- **S1** = 1.28
- **S2** = 1.62
- **S3** = 2.02

Esses multiplicadores foram escolhidos para evitar dois problemas:
- crescimento pequeno demais, que faz evolução “não valer a pena”
- crescimento explosivo demais, que quebra o combate cedo

## Raridade por estágio
- **B0** → Comum
- **S1** → Incomum
- **S2** → Raro
- **S3** → Místico

Isso acompanha a lógica que já vinha sendo usada no projeto.  
`Lendário` foi preservado como raridade reservada, mas não foi usado nesta base inicial.

## Decisões de evolução
### Linhas iniciais
- Evoluem em `12`, `25`, `45`
- Têm 4 estágios
- A forma final recebe **segunda classe**

### Linhas secundárias
- Evoluem em `15`, `30`
- Têm 3 estágios
- Algumas linhas fecham com forma híbrida em S2, mas sem virar “starter line”

## Curva de XP recomendada
Foi gerada uma curva simples:
`xpToNext = 28 + 8L + 0.82L²`

Razão:
- início rápido o suficiente para crianças perceberem progresso
- meio do jogo desacelera um pouco
- fim do jogo não explode de forma absurda

## Captura
Cada monstrinho recebeu:
- `capture.baseThreshold`
- `capture.fleeBase`
- `capture.recommendedOrbTier`

A ideia foi alinhar:
- comuns mais capturáveis
- raros e místicos exigindo HP mais baixo
- classes velozes e furtivas fugindo um pouco mais

## O que ainda pode ser lapidado depois
Mesmo esta base já sendo forte para protótipo, os pontos mais prováveis de ajuste fino são:
- dano real de batalha depois de 20 a 30 lutas testadas
- taxa de fuga em classes rápidas
- XP de midgame entre níveis 20 e 35
- utilidade comparativa entre linhas não iniciais

## Recomendação prática
Para o repositório atual:
1. usar `data/monsters.json` como fonte principal
2. manter `MONSTER_CATALOG` hardcoded apenas como fallback mínimo
3. depois, mover progressão para ler também `progression.config.json`

## Resumo
Esta base foi construída para ser:
- compatível com o código atual
- coerente com o cânone já discutido
- grande o suficiente para o projeto parecer um jogo real
- estruturada para exigir pouca lapidação inicial
