# 🐳 Docker Deployment Guide

This project includes complete Docker support for easy deployment and development.

## Quick Start with Docker

### 1. Production Deployment

```bash
# Build and start the application
npm run docker:build
npm run docker:start

# Or use docker-compose directly
docker-compose up -d

# View logs
npm run docker:logs
```

### 2. Development with Hot Reload

```bash
# Start development environment
npm run docker:start-dev

# Or use docker-compose directly
docker-compose -f docker-compose.dev.yml up -d
```

## Docker Scripts

We provide a convenient script for Docker management:

```bash
# Build the image
./docker-scripts.sh build

# Start production
./docker-scripts.sh start

# Start development (with hot reload)
./docker-scripts.sh start-dev

# Stop application
./docker-scripts.sh stop

# Restart application
./docker-scripts.sh restart

# View logs
./docker-scripts.sh logs

# Open shell in container
./docker-scripts.sh shell

# Show container status
./docker-scripts.sh status

# Clean up everything
./docker-scripts.sh clean

# Clear user data
./docker-scripts.sh clean-data

# Update application
./docker-scripts.sh update
```

## Docker Configuration Files

### 📁 Production Files

- `Dockerfile` - Production image with security optimizations
- `docker-compose.yml` - Production deployment configuration
- `.dockerignore` - Exclude unnecessary files from build

### 📁 Development Files

- `Dockerfile.dev` - Development image with hot reload
- `docker-compose.dev.yml` - Development environment configuration
- `.env.docker` - Docker environment variables

## Environment Variables

### Production Environment (`.env.docker`)

```bash
NODE_ENV=production
PORT=3000
CLEAR_DATA_ON_STARTUP=false
SESSION_TIMEOUT=86400000
INACTIVE_TIMEOUT=7200000
RATE_LIMIT_ENABLED=true
```

### Custom Configuration

```bash
# Copy and modify environment file
cp .env.docker .env.production
# Edit .env.production with your settings
```

## Security Features

### 🔒 Container Security

- **Non-root user**: Application runs as `nodejs` user (UID: 1001)
- **Minimal base image**: Uses Alpine Linux for reduced attack surface
- **Read-only filesystems**: Static files mounted as read-only
- **Health checks**: Automatic container health monitoring
- **Resource limits**: CPU and memory constraints

### 🛡️ Network Security

- **Isolated networks**: Containers run in isolated Docker networks
- **Port exposure**: Only necessary ports (3000) are exposed
- **Reverse proxy ready**: Nginx configuration included for SSL termination

## Data Persistence

### 📊 User Data

```bash
# User data is stored in volume
./user_data:/app/user_data
```

### 🔄 Backup User Data

```bash
# Create backup
docker cp solana-trading-bot:/app/user_data ./backup_user_data

# Restore backup
docker cp ./backup_user_data solana-trading-bot:/app/user_data
```

## Monitoring & Logging

### 📈 Health Checks

```bash
# Check container health
docker-compose ps

# View health check logs
docker inspect solana-trading-bot --format='{{.State.Health.Status}}'
```

### 📋 Application Logs

```bash
# Follow logs in real-time
docker-compose logs -f

# View specific service logs
docker-compose logs solana-trading-bot

# Export logs to file
docker-compose logs > application.log
```

## Production Deployment

### 🌐 With Reverse Proxy (Recommended)

1. **Enable Nginx in docker-compose.yml**:

   ```yaml
   # Uncomment nginx service in docker-compose.yml
   ```

2. **Configure SSL**:

   ```bash
   # Create SSL directory
   mkdir ssl
   # Add your SSL certificates
   cp your-domain.crt ssl/
   cp your-domain.key ssl/
   ```

3. **Start with proxy**:
   ```bash
   docker-compose up -d
   ```

### 🚀 Production Best Practices

1. **Use environment files**:

   ```bash
   # Create production environment
   cp .env.docker .env.production
   # Edit with production values
   ```

2. **Enable monitoring**:

   ```bash
   # Uncomment Prometheus in docker-compose.yml
   # Access metrics at http://localhost:9090
   ```

3. **Set up automatic restarts**:

   ```yaml
   restart: unless-stopped
   ```

4. **Configure log rotation**:
   ```bash
   # Add to docker-compose.yml
   logging:
     driver: "json-file"
     options:
       max-size: "10m"
       max-file: "3"
   ```

## Troubleshooting

### 🔧 Common Issues

**Container won't start:**

```bash
# Check logs
docker-compose logs

# Check container status
docker-compose ps

# Rebuild image
docker-compose build --no-cache
```

**Port already in use:**

```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use port 3001 instead
```

**Permission errors:**

```bash
# Fix file permissions
sudo chown -R 1001:1001 user_data
```

**Memory issues:**

```bash
# Add memory limits to docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### 📞 Support Commands

```bash
# Get system info
docker system info

# Clean up unused resources
docker system prune

# View resource usage
docker stats

# Inspect container
docker inspect solana-trading-bot
```

## Development Workflow

### 🔄 Development Process

1. **Start development environment**:

   ```bash
   npm run docker:start-dev
   ```

2. **Make code changes** (automatically reloaded)

3. **Test changes** at http://localhost:3000

4. **View logs**:

   ```bash
   npm run docker:logs
   ```

5. **Stop when done**:
   ```bash
   npm run docker:stop
   ```

### 🧪 Testing in Production Mode

```bash
# Build production image
npm run docker:build

# Start production container
npm run docker:start

# Test production deployment
curl http://localhost:3000/api/status
```

---

**🐳 Docker deployment provides:**

- ✅ **Consistent environment** across all deployments
- ✅ **Easy scaling** and load balancing
- ✅ **Automatic restarts** and health monitoring
- ✅ **Isolated execution** environment
- ✅ **Simple backup and restore** procedures
