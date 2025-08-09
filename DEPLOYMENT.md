# 🚀 Production Deployment Guide

Deploy your Solana Trading Bot to `solana-trading-bot.antcoders.dev` with SSL and nginx-proxy.

## 📋 Prerequisites

1. **Server Setup**: Ubuntu/Debian server with Docker and Docker Compose
2. **Domain**: DNS A record pointing `solana-trading-bot.antcoders.dev` to your server IP
3. **nginx-proxy**: Your existing nginx-proxy container running
4. **Ports**: Make sure ports 80 and 443 are open

## 🔧 Server Setup Steps

### 1. Upload Your Project

```bash
# On your server, clone or upload the project
git clone [your-repo-url] /home/solana-trading-bot
cd /home/solana-trading-bot
```

### 2. Configure Environment

```bash
# Copy production environment template
cp .env.production .env

# Edit with your actual configuration
nano .env

# Important: Set your actual private key!
# PRIVATE_KEY=your_actual_private_key_here
```

### 3. Ensure nginx-proxy Network Exists

```bash
# Check if nginx-proxy network exists
docker network ls | grep nginx-proxy

# If not found, your nginx-proxy should create it automatically
# Or create manually:
# docker network create nginx-proxy
```

### 4. Deploy

```bash
# Make deployment script executable
chmod +x deploy-production.sh

# Deploy to production
./deploy-production.sh deploy
```

## 🎛️ Management Commands

```bash
# Deploy/Start
./deploy-production.sh deploy

# Check status
./deploy-production.sh status

# View logs
./deploy-production.sh logs

# Restart services
./deploy-production.sh restart

# Stop services
./deploy-production.sh stop

# Update and redeploy
./deploy-production.sh update

# Cleanup old containers
./deploy-production.sh cleanup
```

## 🌐 DNS Configuration

Make sure your DNS has:

```
Type: A
Name: solana-trading-bot
Value: [Your Server IP]
TTL: 300
```

## 🔐 SSL Certificate

Let's Encrypt will automatically generate SSL certificates for:

- `https://solana-trading-bot.antcoders.dev`

The certificate may take 2-3 minutes to generate on first deployment.

## 📊 Monitoring

### Check if site is live:

```bash
curl -I https://solana-trading-bot.antcoders.dev
```

### Monitor logs:

```bash
./deploy-production.sh logs
```

### Check nginx-proxy logs:

```bash
docker logs nginx-proxy
docker logs nginx-letsencrypt
```

## 🛡️ Security Features

- ✅ SSL/HTTPS encryption
- ✅ User session isolation
- ✅ Private key protection
- ✅ Automatic data cleanup
- ✅ Rate limiting
- ✅ Health monitoring

## 🚨 Troubleshooting

### Domain not accessible:

1. Check DNS propagation: `nslookup solana-trading-bot.antcoders.dev`
2. Verify nginx-proxy is running: `docker ps | grep nginx-proxy`
3. Check firewall: `ufw status` (ports 80, 443 should be open)

### SSL certificate issues:

1. Check Let's Encrypt logs: `docker logs nginx-letsencrypt`
2. Verify domain pointing to correct IP
3. Wait 5-10 minutes for certificate generation

### Container not starting:

1. Check logs: `./deploy-production.sh logs`
2. Verify environment variables: `docker-compose -f docker-compose.production.yml config`
3. Check if port 3000 is available

### Performance issues:

1. Monitor resources: `docker stats`
2. Check available disk space: `df -h`
3. Monitor memory usage: `free -h`

## 🔄 Updates

To update your bot:

```bash
git pull
./deploy-production.sh update
```

## 🎯 Final Result

After successful deployment, your trading bot will be available at:
**https://solana-trading-bot.antcoders.dev**

- ✅ SSL secured with Let's Encrypt
- ✅ Professional subdomain
- ✅ Production-ready configuration
- ✅ Automatic certificate renewal
- ✅ Zero-downtime updates
