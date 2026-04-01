# Monstrinhomon — Arquitetura Canônica de Dados

## Arquivos recomendados
- `combat_rules.json`
- `classes.json`
- `skills.json`
- `species.json`
- `evolution_lines.json`
- `level_progression.json`
- `mvp_plan.json`

## Princípio
O motor do jogo deve ler regras e dados a partir de arquivos declarativos.  
Classe define papel macro. Espécie define estilo micro. Linha evolutiva define continuidade.

## Regras mandatórias
1. Nenhuma espécie pode ser melhor que a classe inteira em todos os eixos.
2. Defesa nunca entra inteira no confronto e inteira no dano.
3. Assinatura de classe não pode ser apenas dano maior.
4. Toda habilidade forte precisa de custo, condição ou risco.
5. O MVP deve começar pequeno e testável.

## Relação entre os arquivos
- `combat_rules.json`: regras globais e fórmulas
- `classes.json`: chassis de cada classe
- `skills.json`: habilidades canônicas por classe
- `species.json`: variações de espécie dentro do limite da classe
- `evolution_lines.json`: encadeamento de estágios
- `level_progression.json`: marcos de desbloqueio/evolução
- `mvp_plan.json`: recorte recomendado para primeira implementação