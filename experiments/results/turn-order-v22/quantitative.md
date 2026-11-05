# Experimento de ordem — harness V2.2

Status: PROPOSAL | Domain: técnica | Authority: nenhuma
VerifiedAgainst: e6d550ff427657110500d99cbc3e570cfedde2f6
Supersedes: nenhum

Execução: MM-LAB-TURN-ORDER-001. Seed: monstrinhomon-turn-order-v1. 20 pares × 2 ordens × 1000 batalhas × 3 sementes.
A é sempre o mesmo combatente; A-primeiro e B-primeiro trocam todos os campos associados ao papel.
Streams de RNG distintos por ordem e batalha. IC95 por proporção: Wilson; diferença: Newcombe para amostras independentes. Intervalos exploratórios, sem correção por múltiplas comparações.

| Cenário | Controle idêntico | A vence, A primeiro | A vence, B primeiro | Delta p.p. [IC95] | Turnos A/B primeiro | Empates A/B primeiro |
|---|---|---:|---:|---:|---:|---:|
| Guerreiro x Bárbaro — nível 1 — basic | não | 68.47% | 50.30% | 18.17 [15.71; 20.59] | 4.49 / 4.45 | 0 / 0 |
| Guerreiro x Bárbaro — nível 1 — mixed | não | 74.73% | 57.80% | 16.93 [14.57; 19.27] | 4.28 / 4.29 | 0 / 0 |
| Mago x Guerreiro — nível 1 — basic | não | 24.53% | 12.00% | 12.53 [10.60; 14.46] | 3.85 / 3.88 | 0 / 0 |
| Mago x Guerreiro — nível 1 — mixed | não | 49.97% | 27.30% | 22.67 [20.25; 25.04] | 3.41 / 3.45 | 0 / 0 |
| Ladino x Caçador — nível 1 — basic | não | 81.13% | 52.40% | 28.73 [26.44; 30.98] | 2.37 / 2.35 | 0 / 0 |
| Ladino x Caçador — nível 1 — mixed | não | 84.57% | 36.43% | 48.13 [45.94; 50.25] | 2.11 / 2.14 | 0 / 0 |
| Guerreiro x Bárbaro — nível 10 — basic | não | 79.77% | 61.83% | 17.93 [15.67; 20.18] | 5.35 / 5.38 | 0 / 0 |
| Guerreiro x Bárbaro — nível 10 — mixed | não | 81.70% | 63.57% | 18.13 [15.91; 20.33] | 4.63 / 4.60 | 0 / 0 |
| Mago x Guerreiro — nível 10 — basic | não | 2.97% | 1.07% | 1.90 [1.20; 2.64] | 4.27 / 4.19 | 0 / 0 |
| Mago x Guerreiro — nível 10 — mixed | não | 17.70% | 7.43% | 10.27 [8.61; 11.93] | 3.55 / 3.58 | 0 / 0 |
| Ladino x Caçador — nível 10 — basic | não | 84.30% | 53.47% | 30.83 [28.60; 33.02] | 2.41 / 2.39 | 0 / 0 |
| Ladino x Caçador — nível 10 — mixed | não | 83.97% | 42.17% | 41.80 [39.57; 43.97] | 2.18 / 2.18 | 0 / 0 |
| Guerreiro espelhado L1 basic | sim | 59.73% | 40.83% | 18.90 [16.40; 21.37] | 4.87 / 4.88 | 0 / 0 |
| Guerreiro espelhado L1 mixed | sim | 62.23% | 38.53% | 23.70 [21.22; 26.14] | 4.47 / 4.45 | 0 / 0 |
| Guerreiro espelhado L10 basic | sim | 58.37% | 42.60% | 15.77 [13.26; 18.25] | 6.91 / 6.92 | 0 / 0 |
| Guerreiro espelhado L10 mixed | sim | 60.53% | 41.70% | 18.83 [16.33; 21.30] | 5.60 / 5.53 | 0 / 0 |
| Mago espelhado L1 basic | sim | 61.53% | 37.67% | 23.87 [21.39; 26.30] | 2.89 / 2.93 | 0 / 0 |
| Mago espelhado L1 mixed | sim | 65.83% | 34.57% | 31.27 [28.84; 33.64] | 2.38 / 2.35 | 0 / 0 |
| Mago espelhado L10 basic | sim | 64.03% | 36.40% | 27.63 [25.18; 30.04] | 3.52 / 3.50 | 0 / 0 |
| Mago espelhado L10 mixed | sim | 66.93% | 31.57% | 35.37 [32.97; 37.70] | 2.82 / 2.84 | 0 / 0 |

## Duração, HP e oportunidades

| Cenário | Mediana A/B primeiro | P10–P90 A primeiro | P10–P90 B primeiro | HP A final A/B primeiro | Ações médias A/B (A primeiro) | Ações médias A/B (B primeiro) | Sem resposta A/B primeiro |
|---|---:|---:|---:|---:|---:|---:|---:|
| Guerreiro x Bárbaro — nível 1 — basic | 4/4 | 3–6 | 3–6 | 8.24/5.02 | 4.49/3.81 | 3.95/4.45 | 0/0 |
| Guerreiro x Bárbaro — nível 1 — mixed | 4/4 | 3–6 | 3–6 | 9.14/5.87 | 4.28/3.53 | 3.86/4.29 | 0/0 |
| Mago x Guerreiro — nível 1 — basic | 4/4 | 3–5 | 3–5 | 1.82/0.79 | 3.85/3.60 | 3.00/3.88 | 0/0 |
| Mago x Guerreiro — nível 1 — mixed | 3/3 | 2–4 | 2–4 | 5.03/2.21 | 3.41/2.91 | 2.72/3.45 | 0/0 |
| Ladino x Caçador — nível 1 — basic | 2/2 | 2–3 | 2–3 | 10.02/4.68 | 2.37/1.55 | 1.88/2.35 | 0/0 |
| Ladino x Caçador — nível 1 — mixed | 2/2 | 2–2 | 2–3 | 11.61/3.99 | 2.11/1.27 | 1.50/2.14 | 0/0 |
| Guerreiro x Bárbaro — nível 10 — basic | 5/5 | 4–7 | 4–7 | 15.51/9.68 | 5.35/4.55 | 5.00/5.38 | 0/0 |
| Guerreiro x Bárbaro — nível 10 — mixed | 4/4 | 4–6 | 4–6 | 16.90/10.52 | 4.63/3.81 | 4.23/4.60 | 0/0 |
| Mago x Guerreiro — nível 10 — basic | 4/4 | 3–6 | 3–6 | 0.23/0.10 | 4.27/4.24 | 3.20/4.19 | 0/0 |
| Mago x Guerreiro — nível 10 — mixed | 3/4 | 2–5 | 2–5 | 2.24/0.74 | 3.55/3.37 | 2.65/3.58 | 0/0 |
| Ladino x Caçador — nível 10 — basic | 2/2 | 2–3 | 2–3 | 17.93/6.46 | 2.41/1.56 | 1.92/2.39 | 0/0 |
| Ladino x Caçador — nível 10 — mixed | 2/2 | 2–3 | 2–3 | 20.03/5.22 | 2.18/1.34 | 1.60/2.18 | 0/0 |
| Guerreiro espelhado L1 basic | 5/5 | 4–6 | 4–6 | 6.57/3.65 | 4.87/4.28 | 4.29/4.88 | 0/0 |
| Guerreiro espelhado L1 mixed | 4/4 | 4–6 | 4–6 | 7.45/3.64 | 4.47/3.85 | 3.84/4.45 | 0/0 |
| Guerreiro espelhado L10 basic | 7/7 | 5–9 | 5–9 | 9.15/5.51 | 6.91/6.33 | 6.35/6.92 | 0/0 |
| Guerreiro espelhado L10 mixed | 6/6 | 4–7 | 4–7 | 10.86/6.21 | 5.60/5.00 | 4.94/5.53 | 0/0 |
| Mago espelhado L1 basic | 3/3 | 2–4 | 2–4 | 7.24/3.36 | 2.89/2.27 | 2.30/2.93 | 0/0 |
| Mago espelhado L1 mixed | 2/2 | 2–3 | 2–3 | 9.51/3.46 | 2.38/1.72 | 1.70/2.35 | 0/0 |
| Mago espelhado L10 basic | 3/3 | 3–4 | 3–4 | 10.46/4.18 | 3.52/2.88 | 2.86/3.50 | 0/0 |
| Mago espelhado L10 mixed | 3/3 | 2–4 | 2–4 | 12.48/4.00 | 2.82/2.15 | 2.16/2.84 | 0/0 |

## Recursos e dano efetivo

| Cenário | Dano médio A causa/recebe (A primeiro) | Dano médio A causa/recebe (B primeiro) | ENE total média A/B primeiro | Skills totais médias A/B primeiro |
|---|---:|---:|---:|---:|
| Guerreiro x Bárbaro — nível 1 — basic | 29.02/20.76 | 26.15/23.98 | 0.00/0.00 | 0.00/0.00 |
| Guerreiro x Bárbaro — nível 1 — mixed | 29.53/19.86 | 27.01/23.13 | 3.23/2.53 | 0.81/0.63 |
| Mago x Guerreiro — nível 1 — basic | 20.07/22.18 | 15.97/23.21 | 0.00/0.00 | 0.00/0.00 |
| Mago x Guerreiro — nível 1 — mixed | 23.50/18.97 | 19.28/21.79 | 6.71/6.26 | 1.68/1.57 |
| Ladino x Caçador — nível 1 — basic | 23.63/12.98 | 20.27/18.32 | 0.00/0.00 | 0.00/0.00 |
| Ladino x Caçador — nível 1 — mixed | 23.56/11.39 | 17.52/19.01 | 5.01/5.85 | 1.25/1.46 |
| Guerreiro x Bárbaro — nível 10 — basic | 57.54/39.49 | 54.19/45.32 | 0.00/0.00 | 0.00/0.00 |
| Guerreiro x Bárbaro — nível 10 — mixed | 57.53/38.10 | 54.00/44.48 | 14.77/14.75 | 3.17/3.10 |
| Mago x Guerreiro — nível 10 — basic | 29.78/44.77 | 22.29/44.90 | 0.00/0.00 | 0.00/0.00 |
| Mago x Guerreiro — nível 10 — mixed | 36.97/42.76 | 26.86/44.26 | 15.26/12.55 | 3.81/3.14 |
| Ladino x Caçador — nível 10 — basic | 44.95/25.07 | 37.78/36.54 | 0.00/0.00 | 0.00/0.00 |
| Ladino x Caçador — nível 10 — mixed | 44.88/22.97 | 33.88/37.78 | 6.07/7.15 | 1.52/1.79 |
| Guerreiro espelhado L1 basic | 25.40/22.43 | 22.39/25.35 | 0.00/0.00 | 0.00/0.00 |
| Guerreiro espelhado L1 mixed | 25.55/21.55 | 21.74/25.36 | 5.97/5.96 | 1.49/1.49 |
| Guerreiro espelhado L10 basic | 49.80/45.85 | 46.01/49.49 | 0.00/0.00 | 0.00/0.00 |
| Guerreiro espelhado L10 mixed | 49.39/44.14 | 44.34/48.79 | 19.35/19.10 | 4.84/4.77 |
| Mago espelhado L1 basic | 20.57/16.76 | 16.59/20.64 | 0.00/0.00 | 0.00/0.00 |
| Mago espelhado L1 mixed | 20.66/14.49 | 14.42/20.54 | 6.59/6.50 | 1.65/1.63 |
| Mago espelhado L10 basic | 40.65/34.54 | 34.59/40.82 | 0.00/0.00 | 0.00/0.00 |
| Mago espelhado L10 mixed | 40.60/32.52 | 32.06/41.00 | 11.88/11.95 | 2.97/2.99 |

## Limites

- Mede apenas o harness 1×1, sem tabuleiro, grupos, cura, itens, IA completa ou passivas de espécie.
- Não implementa nem valida SPD + d6; a divergência DIV-INIT-01 permanece aberta.
- mixed usa a primeira skill ofensiva estágio 0; Curandeiro sem skill ofensiva retorna ao básico.
- Níveis acima de 1 usam crescimento sintético do harness, sem garantir evolução natural.
- Contadores de ações/ENE são totais dos dois lados; turnos incluem batalhas encerradas no limite.
- Amostra fixa; diferenças pequenas podem ser ruído de Monte Carlo. Nenhuma decisão de balanceamento.
- Dano efetivo é HP perdido, com HP final limitado a zero; não inclui overkill. Ações por lado inferidas da alternância estrita, incluindo falhas.
- sourceCommit é referência declarada; hashes dos bytes executados são a evidência exata.

Hash dos resultados: df7e920105470f402dc37f65de7d602b3c8ad5203cecad6cd47baa9d429119bc
