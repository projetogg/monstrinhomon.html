---
description: "Instruções para testes do Monstrinhomon"
applyTo: "tests/**/*.test.js"
---

# Instruções de Testes - Monstrinhomon

## Framework de Testes
- **Vitest** é usado como framework de testes
- Todos os testes ficam em `tests/**/*.test.js`
- Usar `import { describe, it, expect } from 'vitest'`

## Estrutura de Testes

### Padrão de Nomenclatura
- Nome do arquivo: `[modulo].test.js`
- Exemplo: `xpCore.test.js`, `dataLoader.test.js`

### Estrutura de um Teste
```javascript
/**
 * [MÓDULO] TESTS (PR[número])
 * 
 * Testes para [descrição do módulo]
 * Cobertura: [funções testadas]
 */

import { describe, it, expect } from 'vitest';
import { funcaoTestada } from '../js/path/to/module.js';

describe('NomeDoMódulo - Descrição', () => {
    
    // Config padrão para testes (se necessário)
    const defaultConfig = { /* ... */ };

    describe('Grupo de Testes Relacionados', () => {
        it('deve fazer algo específico', () => {
            // Arrange
            const input = /* ... */;
            
            // Act
            const result = funcaoTestada(input);
            
            // Assert
            expect(result).toBe(expected);
        });
    });
});
```

## Boas Práticas

### Organização
- Agrupar testes relacionados com `describe` aninhados
- Um `it` deve testar um comportamento específico
- Usar nomes descritivos em português para `describe` e `it`

### Assertions
- Preferir matchers específicos do Vitest
- `expect(x).toBe(y)` - para valores primitivos
- `expect(x).toEqual(y)` - para objetos/arrays
- `expect(x).toBeCloseTo(y)` - para números com ponto flutuante
- `expect(fn).toThrow()` - para funções que devem lançar erro

### Comentários
- Incluir comentários explicando lógica complexa de teste
- Documentar valores esperados com cálculos quando não óbvios
- Exemplo: `// (15 + 1*2) * 1.0 = 17`

### Configuração Padrão
- Definir objetos de configuração padrão no topo do `describe`
- Usar constantes para valores mágicos
- Facilitar reutilização em múltiplos testes

## Cobertura de Testes

### O que testar
- **Funções puras**: todas as ramificações lógicas
- **Cálculos**: valores limite, casos especiais, edge cases
- **Validações**: inputs válidos e inválidos
- **Integrações**: comportamento entre módulos

### Casos de teste importantes
- Valores mínimos e máximos
- Valores default
- Casos de erro
- Casos limite (null, undefined, empty)

## Executando Testes

### Comandos
```bash
npm test                 # Roda todos os testes
npm test -- xpCore      # Roda testes específicos
npm test -- --watch     # Modo watch
npm test -- --coverage  # Com cobertura
```

### CI/CD
- Testes rodam automaticamente via GitHub Actions
- Todos os testes devem passar antes de merge
- Cobertura mínima pode ser configurada

## Exemplos

### Teste de Cálculo Simples
```javascript
it('deve calcular XP corretamente para inimigo nível 1 comum', () => {
    const enemy = { level: 1, rarity: 'Comum' };
    const xp = calculateBattleXP(enemy, null, defaultConfig);
    // (15 + 1*2) * 1.0 = 17
    expect(xp).toBe(17);
});
```

### Teste com Múltiplos Casos
```javascript
it.each([
    ['Comum', 1.00, 17],
    ['Incomum', 1.05, 17.85],
    ['Raro', 1.10, 18.7],
])('deve aplicar multiplicador de raridade %s (%f)', (rarity, mult, expectedXP) => {
    const enemy = { level: 1, rarity };
    const xp = calculateBattleXP(enemy, null, defaultConfig);
    expect(xp).toBeCloseTo(expectedXP, 1);
});
```

### Teste de Erro
```javascript
it('deve lançar erro se configuração for inválida', () => {
    expect(() => funcao(null)).toThrow();
    expect(() => funcao({})).toThrow('Config inválida');
});
```

## Regras Importantes

1. **Não quebrar testes existentes** - se um teste falhar, corrija o código ou atualize o teste com justificativa
2. **Adicionar testes para bugs corrigidos** - prevenir regressão
3. **Testes devem ser independentes** - não dependem de ordem de execução
4. **Manter testes rápidos** - evitar operações assíncronas desnecessárias
5. **Mock apenas quando necessário** - preferir testes de integração quando possível

---

**Última atualização**: 2026-02-02
