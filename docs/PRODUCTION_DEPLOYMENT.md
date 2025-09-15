# AI IDE Production Deployment Guide

## Overview

This guide covers the complete production deployment setup for AI IDE, including SSL configuration, environment setup, automated backups, and troubleshooting.

## Quick Start

1. **SSL Setup**: Place certificates in `ssl/` directory
2. **Environment**: Configure `.env.production` with your API keys
3. **Deploy**: Run `docker-compose -f docker-compose.ai.yml up -d`
4. **Backups**: Run `./scripts/backup/setup-cron.sh` for automated backups

## Detailed Setup

### 1. SSL Configuration

#### Option A: Let's Encrypt (Recommended for new domains)
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/server.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/server.key

# Set proper permissions
sudo chmod 600 ssl/server.key
sudo chmod 644 ssl/server.crt
```

#### Option B: Commercial Certificate
1. Purchase SSL certificate from your provider
2. Download certificate files
3. Place in `ssl/` directory:
   - Certificate file → `ssl/server.crt`
   - Private key → `ssl/server.key`

### 2. Environment Configuration

Edit `.env.production` with your production values:

```bash
# Required: Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_production_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Required: Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: AI Provider Keys (users can provide their own)
OPENAI_API_KEY=sk-your_openai_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key

# Required: Security Keys (generate random values)
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)
DATABASE_PASSWORD=$(openssl rand -base64 32)

# Required: Domain Configuration
VITE_API_BASE_URL=https://yourdomain.com/api
CORS_ORIGIN=https://yourdomain.com
```

### 3. Deployment Options

#### Basic Deployment (API + Frontend only)
```bash
docker-compose up -d
```

#### Full AI Deployment (Recommended)
```bash
docker-compose -f docker-compose.ai.yml up -d
```

### 4. Memory Optimization

The deployment includes optimized memory limits:
- **AI Service**: 8GB limit, 4GB reserved
- **Ollama**: 16GB limit, 8GB reserved
- **Qdrant**: 4GB limit, 2GB reserved

#### Adjust for your server:
```yaml
# In docker-compose.ai.yml
deploy:
  resources:
    limits:
      memory: 4G  # Reduce for smaller servers
    reservations:
      memory: 2G
```

### 5. Automated Backups

#### Setup automated daily backups:
```bash
# Make scripts executable
chmod +x scripts/backup/*.sh

# Setup daily backups at 2 AM
./scripts/backup/setup-cron.sh

# Manual backup
./scripts/backup/backup-all.sh

# Restore from backup
./scripts/backup/restore-database.sh
```

#### Backup locations:
- Database backups: `/backups/database/`
- Files backups: `/backups/files/`
- Retention: 30 days (configurable)

### 6. Scaling for Production

#### Docker Swarm (Multi-node)
```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.ai.yml ai-ide

# Scale services
docker service scale ai-ide_ai-service=3
docker service scale ai-ide_api=2
```

#### Kubernetes (Advanced)
See `k8s/` directory for Kubernetes manifests (coming soon).

## Monitoring & Health Checks

### Built-in Health Checks
- API: `http://localhost:3001/health`
- AI Service: `http://localhost:3002/health`
- Ollama: `http://localhost:11434/api/tags`

### Grafana Dashboard
- Access: `http://localhost:3000`
- Default login: `admin` / `${GRAFANA_PASSWORD}`

### Prometheus Metrics
- Access: `http://localhost:9090`
- Metrics endpoint: `/metrics` on each service

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Change ports in docker-compose.ai.yml
ports:
  - "8080:80"    # Alternative HTTP port
  - "8443:443"   # Alternative HTTPS port
```

#### Memory Issues
```bash
# Check Docker memory usage
docker stats

# Increase Docker Desktop memory limit (Mac/Windows)
# Docker Desktop → Settings → Resources → Memory: 16GB+

# Linux: No limit by default, but check available memory
free -h
```

#### GPU Not Found
```bash
# Install NVIDIA Docker runtime
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# Enable GPU in docker-compose.ai.yml
# Uncomment the GPU sections under ai-service and ollama
```

#### Models Won't Download
```bash
# Check disk space
df -h

# Check Ollama logs
docker logs ai-ide-ollama-1

# Manually download model
docker exec ai-ide-ollama-1 ollama pull llama2

# Check internet connectivity from container
docker exec ai-ide-ollama-1 ping 8.8.8.8
```

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker logs ai-ide-postgres-1

# Test connection
docker exec ai-ide-postgres-1 psql -U ai_ide_user -d ai_ide -c "SELECT 1;"

# Reset database
docker-compose -f docker-compose.ai.yml down -v
docker-compose -f docker-compose.ai.yml up -d
```

#### SSL Certificate Issues
```bash
# Verify certificate
openssl x509 -in ssl/server.crt -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443

# Check certificate expiry
openssl x509 -in ssl/server.crt -noout -dates
```

### Performance Optimization

#### Database Performance
```bash
# Tune PostgreSQL settings in docker-compose.ai.yml
environment:
  - POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements
  - POSTGRES_MAX_CONNECTIONS=200
  - POSTGRES_SHARED_BUFFERS=256MB
  - POSTGRES_WORK_MEM=4MB
```

#### Redis Optimization
```bash
# Create redis.conf for production
echo "maxmemory 2gb" > redis.conf
echo "maxmemory-policy allkeys-lru" >> redis.conf

# Redis is already configured in docker-compose.ai.yml
```

### Log Management

#### View service logs
```bash
# All services
docker-compose -f docker-compose.ai.yml logs -f

# Specific service
docker-compose -f docker-compose.ai.yml logs -f api

# Backup logs
docker logs ai-ide-api-1 > api.log 2>&1
```

#### Centralized logging (Optional)
```bash
# Add to docker-compose.ai.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Security Checklist

- [ ] SSL certificates installed and valid
- [ ] Strong passwords in `.env.production`
- [ ] JWT_SECRET and ENCRYPTION_KEY are random
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Docker daemon secured
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled
- [ ] Database access restricted
- [ ] API rate limiting configured

## Maintenance

### Regular Tasks
- **Daily**: Check logs and monitoring
- **Weekly**: Review backup integrity
- **Monthly**: Update Docker images, security patches
- **Quarterly**: SSL certificate renewal, security audit

### Updates
```bash
# Update Docker images
docker-compose -f docker-compose.ai.yml pull
docker-compose -f docker-compose.ai.yml up -d

# Update Node.js dependencies
docker-compose -f docker-compose.ai.yml exec api npm update
docker-compose -f docker-compose.ai.yml restart api
```

## Support

For issues not covered in this guide:
1. Check Docker logs: `docker-compose logs -f`
2. Review GitHub issues: https://github.com/your-repo/ai-ide/issues
3. Contact support with logs and environment details

---

**Important**: Always test deployments in a staging environment before production!