# Development Workflow

## Feature Implementation Flow
1. Check `docs/task_board.md` for the next task
2. Read relevant docs (`api_contracts.md`, `database_schema.md`, etc.)
3. Implement the feature following `coding_standards.md`
4. Write/run tests
5. Update documentation:
   - `feature_registry.md` — mark feature status
   - `task_board.md` — move task to completed
   - `repo_map.md` — add new files
   - `api_contracts.md` — if new endpoints added

## Backend Development
1. Define Pydantic schema in `backend/schemas/`
2. Create/modify SQLAlchemy model in `backend/models/` if needed
3. Implement service logic in `backend/services/`
4. Create router endpoint in `backend/routers/`
5. Register router in `backend/main.py` if new
6. Run Alembic migration if DB schema changed
7. Write test in `backend/tests/`

## Frontend Development (planned)
1. Define TypeScript types in `frontend/src/types/`
2. Create API call in `frontend/src/lib/api.ts`
3. Build component in `frontend/src/components/`
4. Create page in `frontend/src/app/`
5. Update Zustand store if needed

## Testing Protocol
- Backend: `cd backend && pytest`
- Frontend: `cd frontend && npm test`
- All services must have unit tests
- All routers must have integration tests via TestClient

## Git Workflow
- Commit after each feature/fix
- Format: `type(scope): description`
- Push to main for MVP (no branching needed for solo project)

2. Review current progress
   - docs/task_board.md
   - docs/session_context.md

3. Choose the next task

4. Create an implementation plan

5. Implement code

6. Update documentation
   - feature_registry.md
   - task_board.md
   - design.md (if architecture changes)

7. Write a session summary
   - update docs/session_context.md