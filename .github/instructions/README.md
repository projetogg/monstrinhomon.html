# Path-Specific Instructions

This directory contains path-specific instructions for GitHub Copilot to provide specialized guidance when working on different parts of the Monstrinhomon codebase.

## Structure

Each `.instructions.md` file includes:
- **YAML frontmatter** with `description` and `applyTo` patterns
- **Specific guidelines** for that area of the codebase
- **Examples** and best practices
- **Common pitfalls** to avoid

## Available Instructions

### tests.instructions.md
**Applies to:** `tests/**/*.test.js`

Guidelines for writing and maintaining tests:
- Vitest framework patterns
- Test structure and organization
- Assertion best practices
- Coverage expectations

### data.instructions.md
**Applies to:** `data/**/*`

Guidelines for game data files:
- JSON/CSV data structure
- ID immutability rules
- Data validation requirements
- Balancing guidelines

## How Path-Specific Instructions Work

When GitHub Copilot works on a file, it automatically applies:
1. **Repository-wide instructions** from `.github/copilot-instructions.md`
2. **Agent instructions** from `.github/agents/` (if applicable)
3. **Path-specific instructions** matching the file path pattern

This provides context-aware assistance tailored to the specific part of the codebase you're working on.

## Adding New Instructions

To add path-specific instructions for a new area:

1. Create a new `.instructions.md` file in this directory
2. Add YAML frontmatter with description and pattern:
   ```yaml
   ---
   description: "Brief description"
   applyTo: "path/pattern/**/*"
   ---
   ```
3. Write clear, actionable guidelines
4. Include examples where helpful
5. Test with Copilot to ensure effectiveness

## Best Practices

- Keep instructions focused and specific
- Use imperative language ("Use X", "Avoid Y")
- Include code examples for clarity
- Reference the main copilot-instructions.md for general rules
- Update when patterns or conventions change

---

For repository-wide instructions, see: `.github/copilot-instructions.md`

For agent-specific instructions, see: `.github/agents/`
