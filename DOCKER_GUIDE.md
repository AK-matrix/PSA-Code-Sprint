# PSA System Docker Guide

This guide provides comprehensive instructions for running the PSA System using Docker.

## 🐳 Docker Architecture

The PSA System is containerized with the following services:

- **Backend**: Flask application with LangGraph workflow
- **Frontend**: Next.js React application
- **Redis**: Caching and session storage
- **Nginx**: Reverse proxy and load balancer (optional)
- **Monitoring**: Prometheus and Grafana (optional)

## 🚀 Quick Start

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

### Basic Setup

1. **Clone and navigate to the project:**
   ```bash
   git clone <repository-url>
   cd psa-system
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your API keys
   ```

3. **Run the setup script:**
   ```bash
   chmod +x docker-setup.sh
   ./docker-setup.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Health Check: http://localhost:5000/health

## 📋 Docker Compose Files

### Development (docker-compose.dev.yml)
- Hot reloading enabled
- Debug mode active
- Volume mounting for live code changes
- Minimal resource usage

### Production (docker-compose.prod.yml)
- Optimized for performance
- Resource limits configured
- Health checks enabled
- Monitoring stack included
- SSL/TLS ready

### Default (docker-compose.yml)
- Balanced configuration
- Suitable for testing
- Basic monitoring

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Email Configuration
SENDER_EMAIL=your_email@company.com
EMAIL_APP_PASSWORD=your_gmail_app_password

# Database Configuration
DATABASE_URL=sqlite:///psa_incidents.db

# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_here

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Monitoring (optional)
GRAFANA_PASSWORD=admin
```

### Volume Mounts

The system uses the following volume mounts:

- `./chroma_db:/app/chroma_db` - Vector database
- `./Application Logs:/app/Application Logs` - Log files
- `./Database:/app/Database` - Database schemas
- `./Case Log.xlsx:/app/Case Log.xlsx` - Historical data
- `./contacts.json:/app/contacts.json` - Contact information
- `./knowledge_base.json:/app/knowledge_base.json` - Knowledge base

## 🚀 Running the System

### Development Mode

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production Mode

```bash
# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop production environment
docker-compose -f docker-compose.prod.yml down
```

### Default Mode

```bash
# Start default environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop default environment
docker-compose down
```

## 🔍 Monitoring and Health Checks

### Health Endpoints

- **Backend Health**: http://localhost:5000/health
- **Frontend Health**: http://localhost:3000
- **Redis Health**: Check container logs

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "langgraph": "operational",
    "chromadb": "operational",
    "llm": "operational"
  }
}
```

### Monitoring Stack (Production)

When using the monitoring profile:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
  - Username: admin
  - Password: (set in GRAFANA_PASSWORD)

## 📊 Resource Management

### Resource Limits (Production)

- **Backend**: 2GB RAM, 1 CPU
- **Frontend**: 1GB RAM, 0.5 CPU
- **Redis**: 1GB RAM, 0.5 CPU
- **Nginx**: 512MB RAM, 0.25 CPU

### Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Scale frontend service
docker-compose up -d --scale frontend=2
```

## 🔧 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3000
   netstat -tulpn | grep :5000
   
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"  # Frontend on port 3001
     - "5001:5000"  # Backend on port 5001
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x docker-setup.sh
   chmod +x docker-cleanup.sh
   ```

3. **Memory issues:**
   ```bash
   # Check Docker memory usage
   docker stats
   
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   ```

4. **API key issues:**
   ```bash
   # Check environment variables
   docker-compose exec backend env | grep API_KEY
   
   # Restart with new environment
   docker-compose down
   docker-compose up -d
   ```

### Debugging

```bash
# View container logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in container
docker-compose exec backend bash
docker-compose exec frontend sh

# Check container status
docker-compose ps

# View resource usage
docker stats
```

## 🧹 Cleanup

### Basic Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Clean up unused resources
docker system prune -f
```

### Complete Cleanup

```bash
# Run cleanup script
./docker-cleanup.sh

# Remove all data (including databases)
docker-compose down -v
docker system prune -a -f
```

## 🔒 Security Considerations

### Production Security

1. **Use secrets management:**
   ```bash
   # Create Docker secrets
   echo "your_secret_key" | docker secret create secret_key -
   echo "your_jwt_secret" | docker secret create jwt_secret -
   ```

2. **Enable SSL/TLS:**
   ```bash
   # Place SSL certificates in ./ssl/
   # Update nginx.conf for SSL configuration
   ```

3. **Network security:**
   ```yaml
   # Use custom networks
   networks:
     psa-network:
       driver: bridge
       internal: true  # Internal network only
   ```

4. **Resource limits:**
   ```yaml
   # Set resource limits
   deploy:
     resources:
       limits:
         memory: 2G
         cpus: '1.0'
   ```

## 📈 Performance Optimization

### Production Optimizations

1. **Enable Redis caching:**
   ```yaml
   environment:
     - REDIS_URL=redis://redis:6379
   ```

2. **Configure Nginx caching:**
   ```nginx
   location /_next/static/ {
     expires 1y;
     add_header Cache-Control "public, immutable";
   }
   ```

3. **Optimize Docker images:**
   ```dockerfile
   # Use multi-stage builds
   FROM node:18-alpine AS builder
   # ... build steps
   FROM node:18-alpine AS production
   # ... copy built files
   ```

## 🚀 Deployment Strategies

### Single Server Deployment

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Multi-Server Deployment

```bash
# Deploy backend on server 1
docker-compose -f docker-compose.prod.yml up -d backend redis

# Deploy frontend on server 2
docker-compose -f docker-compose.prod.yml up -d frontend nginx
```

### Kubernetes Deployment

```bash
# Convert to Kubernetes manifests
kompose convert -f docker-compose.prod.yml

# Deploy to Kubernetes
kubectl apply -f .
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Flask Docker Guide](https://flask.palletsprojects.com/en/2.0.x/deploying/docker/)

## 🆘 Support

For Docker-related issues:

1. Check the logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec backend curl localhost:5000/health`
4. Check resources: `docker stats`

---

**Happy Containerizing! 🐳**
