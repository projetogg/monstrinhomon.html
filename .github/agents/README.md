# Agent Instructions

This directory contains specialized instructions for GitHub Copilot agents working on specific aspects of the Monstrinhomon project.

## Structure

- `default.md` - Default agent instructions for general development tasks
- Additional agent-specific instruction files can be added here for specialized tasks

## How It Works

GitHub Copilot will automatically use instructions from the nearest `AGENTS.md` or agent-specific instruction file when working on the project. The instructions in this directory complement the repository-wide instructions in `.github/copilot-instructions.md`.

## Best Practices

- Keep agent instructions focused on specific domains or tasks
- Reference the main copilot-instructions.md for general project rules
- Update these files when significant changes are made to the project structure or rules
