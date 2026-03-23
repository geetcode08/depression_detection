# Docker Setup Guide

**Last Updated**: 2026-03-23  
**Status**: ✅ Documentation Ready

---

## Overview

This guide provides instructions for containerizing and running the depression-ai-system using Docker and Docker Compose. The setup includes:

- **Backend**: FastAPI application with Python 3.11
- **Frontend**: Next.js application with Node.js 20
- **Database**: SQLite with volume persistence
- **Networking**: Docker bridge network for service communication

---

## Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Git repository cloned locally
- API keys (GROQ_API_KEY, optionally OPENAI_API_KEY)

**Installation Links:**
- [Docker Desktop for macOS](https://www.docker.com/products/docker-desktop)
- [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux-install/)
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)

---

## Quick Start (3 steps)

### Step 1: Configure Environment Variables

```bash
# Copy the Docker environment template
cp .docker.env .env.docker

# Edit with your API keys
nano .env.docker
# Update GROQ_API_KEY and OPENAI_API_KEY
```

### Step 2: Build and Start Services

```bash
# Navigate to project root
cd /Users/macbook/Desktop/depression-ai-system

# Build and start all services in background
docker-compose up -d

# Watch logs
docker-compose logs -f

# Verify services are running
docker-compose ps
```

### Step 3: Verify Services

```bash
# Backend health check
curl http://localhost:8000/api/v1/health
# Expected: {"status":"ok"} or similar

# Frontend access
open http://localhost:3000

# Backend API access
curl http://localhost:8000/api/v1/auth/status
```

---

## File Structure

```
depression-ai-system/
├── docker-compose.yml          ← Orchestration config
├── .docker.env                 ← Docker-specific env template
├── backend/
│   ├── Dockerfile              ← Backend image definition
│   ├── requirements.txt
│   ├── main.py
│   └── ml/                      ← ML artifacts
├── frontend/
│   ├── Dockerfile              ← Frontend image definition
│   ├── package.json
│   ├── src/
│   └── next.config.js
└── docs/
    └── docker_setup.md         ← This file
```

---

## Detailed Commands

### Building Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend

# Build without cache (fresh build)
docker-compose build --no-cache
```

### Running Services

```bash
# Start all services (foreground)
docker-compose up

# Start all services (background)
docker-compose up -d

# Start specific service
docker-compose up backend
docker-compose up frontend

# With logging
docker-compose up -d && docker-compose logs -f
```

### Monitoring

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View logs with timestamps
docker-compose logs --timestamps

# Follow logs for specific service (tail last 100 lines)
docker-compose logs -f --tail=100 backend
```

### Stopping Services

```bash
# Stop all services (keeps containers)
docker-compose stop

# Stop specific service
docker-compose stop backend

# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes
docker-compose down -v

# Stop and force remove (dangerous)
docker-compose kill
```

### Accessing Service Shells

```bash
# Backend Python shell
docker-compose exec backend bash

# Frontend Node shell
docker-compose exec frontend sh

# Run Python command in backend
docker-compose exec backend python -c "import sys; print(sys.version)"

# Install package in frontend
docker-compose exec frontend npm install --save <package>
```

### Database Operations

```bash
# Access SQLite database in running backend
docker-compose exec backend sqlite3 ./depression_ai.db "SELECT COUNT(*) FROM users;"

# View database file
docker-compose exec backend ls -lh ./depression_ai.db
```

---

## Configuration

### Environment Variables

Key environment variables for Docker Compose:

| Variable | Service | Purpose | Required |
|----------|---------|---------|----------|
| GROQ_API_KEY | Backend | LLM inference provider | Yes |
| OPENAI_API_KEY | Backend | Fallback LLM | No |
| DATABASE_URL | Backend | SQLite connection | Auto |
| NEXTAUTH_SECRET | Frontend | Session encryption | Yes |
| NEXT_PUBLIC_API_URL | Frontend | Backend API endpoint | Auto (http://backend:8000/api/v1) |
| CORS_ORIGINS | Backend | Allowed frontend origins | Auto (http://frontend:3000) |

### Networking

- **Internal Service Communication**: Use service names as hostnames
  - Backend → Frontend: `http://frontend:3000`
  - Frontend → Backend: `http://backend:8000/api/v1`

- **External Access**:
  - Backend: `http://localhost:8000`
  - Frontend: `http://localhost:3000`

### Port Mapping

```yaml
# From docker-compose.yml
services:
  backend:
    ports:
      - "8000:8000"  # localhost:8000 → container:8000

  frontend:
    ports:
      - "3000:3000"  # localhost:3000 → container:3000
```

---

## Health Checks

Each service includes automated health checks:

### Backend Health Check
```bash
# Manual check
curl http://localhost:8000/api/v1/health

# Docker health status
docker-compose ps  # Look for "healthy" status
```

### Frontend Health Check
```bash
# Manual check
curl http://localhost:3000

# Docker health status
docker-compose ps  # Look for "healthy" status
```

### Restart on Failure
Docker Compose automatically monitors health and restarts unhealthy services.

---

## Development Workflow

### Hot Reload During Development

Both services mount the source code as volumes and support hot reload:

```bash
# Backend changes auto-reload (Uvicorn)
# Edit backend/main.py → auto-restart

# Frontend changes auto-reload (Next.js)
# Edit frontend/src/app/page.tsx → auto-refresh in browser
```

### Adding Python Dependencies

```bash
# Add to requirements.txt, then:
docker-compose rebuild backend
docker-compose up -d backend
```

### Adding Node Dependencies

```bash
# Run npm install in container
docker-compose exec frontend npm install --save <package>
```

### Testing in Container

```bash
# Run backend tests
docker-compose exec backend pytest tests/ -v

# Run frontend lint
docker-compose exec frontend npm run lint

# Run frontend build
docker-compose exec frontend npm run build
```

---

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Check if ports are in use
lsof -i :8000  # Check port 8000
lsof -i :3000  # Check port 3000
```

### API Keys Not Working

```bash
# Verify environment variables in container
docker-compose exec backend env | grep GROQ_API_KEY

# Check configuration is loaded
docker-compose exec backend python -c "from config import settings; print(settings.GROQ_API_KEY[:10] + '...')"
```

### Database Issues

```bash
# Check database file exists
docker-compose exec backend ls -lh ./depression_ai.db

# Reset database (destructive)
docker-compose exec backend rm ./depression_ai.db
docker-compose restart backend
```

### Build Failures

```bash
# Clear build cache
docker-compose build --no-cache

# Remove all images and rebuild
docker system prune -a
docker-compose build --no-cache
```

---

## Performance Tips

### Memory and CPU Limits

```yaml
# Add to docker-compose.yml services for resource limits:
backend:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

### Volume Performance (macOS)

For faster file sync on macOS, use `:cached` flag:

```yaml
volumes:
  - ./backend:/app:cached
  - ./frontend:/app:cached
```

---

## Production Deployment

For production deployment, consider:

1. **Use Multi-Stage Builds** (already implemented in frontend Dockerfile)
2. **Remove Volume Mounts** (for immutable containers)
3. **Add Container Registries** (Docker Hub, AWS ECR, etc.)
4. **Use Docker Swarm or Kubernetes** (for orchestration)
5. **Implement CI/CD Pipeline** (GitHub Actions)
6. **Use Managed Databases** (AWS RDS, Google Cloud SQL)

See `DEPLOYMENT.md` for detailed production deployment guide.

---

## Next Steps

1. Run `docker-compose up -d` to start services
2. Verify both services are healthy: `docker-compose ps`
3. Test endpoints:
   - Backend: `curl http://localhost:8000/api/v1/auth/status`
   - Frontend: Open `http://localhost:3000` in browser
4. Proceed to Phase 7.3: Frontend Tests (Vitest setup)

---

## Useful Docker Commands Reference

```bash
# Image management
docker images | grep depression       # List depression-ai images
docker rmi <image-id>                 # Remove image

# Container management
docker ps -a | grep depression-ai     # List all containers
docker rm <container-id>              # Remove container
docker stats                          # View resource usage

# Network management
docker network ls                     # List networks
docker network inspect depression-ai-network  # Inspect network

# Cleanup
docker system df                      # Disk usage
docker system prune                   # Clean up unused resources
docker system prune -a --volumes      # Deep cleanup (warning: destructive)

# Debugging
docker exec -it <container> bash     # Run bash in container
docker logs <container>               # View container logs
docker inspect <container>            # View container details
```

---

## Support & Documentation

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [FastAPI Docker Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Next.js Docker Deployment](https://nextjs.org/docs/app/building-your-application/deploying#docker-image)

