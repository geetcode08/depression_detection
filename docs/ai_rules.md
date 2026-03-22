# AI Development Rules

## Core Principles
1. **Read docs first**: Before any development, read `project_overview.md`, `architecture.md`, and `session_context.md`
2. **Follow the SRS**: All implementation decisions must trace back to the SRS
3. **No scope creep**: Only implement what is specified. Do not add features not in the SRS.
4. **Update docs**: After any structural change, update `repo_map.md`, `feature_registry.md`, and `task_board.md`

## Document Update Rules

| Document | When to Update |
|----------|---------------|
| `project_overview.md` | When project status or capabilities change |
| `architecture.md` | When adding new layers, services, or external integrations |
| `design.md` | When adding new user flows or changing thresholds |
| `tech_stack.md` | When adding/removing/upgrading a dependency |
| `database_schema.md` | When adding/modifying tables or columns |
| `api_contracts.md` | When adding/modifying API endpoints |
| `coding_standards.md` | When establishing new conventions |
| `feature_registry.md` | When starting, completing, or adding a feature |
| `task_board.md` | At start and end of every work session |
| `deployment.md` | When changing setup steps or env vars |
| `glossary.md` | When introducing new domain terms |
| `repo_map.md` | When creating/deleting/moving files |
| `session_context.md` | At the END of every AI session |

## Safety Rules
1. Never generate clinical diagnosis language
2. Never remove crisis escalation code
3. Never log PII (email, password, personal messages) to console/files
4. Never disable consent gate
5. Never hardcode API keys or secrets
6. Always validate input via Pydantic before processing

## Code Generation Rules
1. Backend: Python 3.11+, FastAPI, async/await, type hints
2. Frontend: TypeScript strict, no `any`, Zod validation
3. All new endpoints must have corresponding Pydantic schema
4. All new features must be added to feature_registry.md
5. All new files must be added to repo_map.md
6. Test coverage required for all service functions

3. Do not modify database structures without updating docs/database_schema.md.

4. When implementing a feature:
   - update docs/feature_registry.md
   - update docs/task_board.md

5. If architecture changes:
   update docs/design.md.

6. Prefer simple and maintainable code.

7. Follow coding conventions from docs/coding_standards.md.