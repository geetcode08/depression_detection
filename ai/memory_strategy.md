# Memory Strategy

## Problem
AI agents lose context between sessions. This documentation system acts as persistent memory.

## Architecture
```
docs/                          ← Long-term memory (project knowledge)
├── session_context.md         ← Short-term memory (last session state)
├── task_board.md              ← Working memory (current tasks)
├── feature_registry.md        ← Feature tracking memory
└── [other docs]               ← Reference memory

ai/                            ← Agent instructions
├── system_prompt.md           ← How to behave
├── development_workflow.md    ← How to work
└── memory_strategy.md         ← This file
```

## Memory Types

### 1. Reference Memory (stable, rarely changes)
- `project_overview.md` — what the project is
- `architecture.md` — how the system is built
- `tech_stack.md` — what technologies are used
- `database_schema.md` — data structure
- `api_contracts.md` — API interface
- `coding_standards.md` — code conventions
- `glossary.md` — terminology

### 2. Working Memory (changes frequently)
- `session_context.md` — updated every session
- `task_board.md` — updated as tasks progress
- `feature_registry.md` — updated as features are built

### 3. Structural Memory (changes when files change)
- `repo_map.md` — mirror of actual file structure

## Update Protocol
1. **Before coding**: Read session_context.md + task_board.md
2. **During coding**: No doc updates needed (focus on code)
3. **After coding**: Update session_context.md, task_board.md, feature_registry.md, repo_map.md

## Context Reconstruction
A new AI session can fully reconstruct project context by reading docs in this order:
1. `session_context.md` (5 min orientation)
2. `architecture.md` (system understanding)
3. `task_board.md` (what to do next)
4. Relevant detail docs as needed during implementation