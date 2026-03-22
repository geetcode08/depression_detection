# Coding Standards

## Python (Backend)

### Style
- Follow PEP 8
- Use type hints on all function signatures
- Use Pydantic v2 models for all request/response schemas
- Use async/await for all I/O operations (DB, HTTP)

### Naming
- Files: `snake_case.py`
- Classes: `PascalCase`
- Functions/variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`
- Pydantic models: `PascalCase` with descriptive suffix (e.g., `UserCreate`, `ChatResponse`)

### Structure
- One router per domain in `routers/`
- One service per domain in `services/`
- Models in `models/`, schemas in `schemas/`
- Business logic in services, not in routers
- Routers handle HTTP concerns only (parsing, status codes, auth)

### Error Handling
- Use `HTTPException` with appropriate status codes
- 400: Bad request / validation error
- 401: Unauthorized (missing/invalid JWT)
- 403: Forbidden (consent not given)
- 404: Resource not found
- 500: Internal server error (should not happen in normal flow)

### Security
- JWT secret via environment variable, never hardcoded
- Passwords hashed with bcrypt, never stored in plain text
- CORS restricted to frontend origin
- No PII in logs
- Input validation via Pydantic on all endpoints

### Database
- Use SQLAlchemy ORM, no raw SQL
- All queries through async session
- Use Alembic for migrations
- Foreign keys enforced

## TypeScript (Frontend — planned)
- Strict mode enabled
- No `any` types
- Use Zod for runtime validation
- Components in PascalCase files

## Git Conventions
- Commit messages: `type(scope): description`
- Types: feat, fix, refactor, docs, test, chore
- Example: `feat(auth): implement JWT login endpoint`
