#!/bin/bash

# Production deployment script for Solana Trading Bot
# Deploy to: solana-trading-bot.antcoders.dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Solana Trading Bot to Production${NC}"
echo -e "${BLUE}Domain: solana-trading-bot.antcoders.dev${NC}"
echo "================================================"

# Check if nginx-proxy network exists
if ! docker network ls | grep -q "nginx-proxy"; then
    echo -e "${RED}❌ nginx-proxy network not found!${NC}"
    echo -e "${YELLOW}Please make sure your nginx-proxy is running first.${NC}"
    exit 1
fi

# Function to handle commands
case "$1" in
    "deploy"|"start")
        echo -e "${YELLOW}📦 Building and starting services...${NC}"
        
        # Ensure user_data directory exists and has correct permissions
        echo -e "${YELLOW}🔧 Setting up user_data directory permissions...${NC}"
        mkdir -p ./user_data
        sudo chown -R 1000:1000 ./user_data
        sudo chmod -R 755 ./user_data
        
        docker compose -f docker-compose.production.yml build
        docker compose -f docker-compose.production.yml up -d
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo -e "${GREEN}🌐 Your bot is now available at: https://solana-trading-bot.antcoders.dev${NC}"
        echo -e "${YELLOW}⏳ SSL certificate may take a few minutes to generate...${NC}"
        ;;
    
    "stop")
        echo -e "${YELLOW}🛑 Stopping services...${NC}"
        docker compose -f docker-compose.production.yml down
        echo -e "${GREEN}✅ Services stopped${NC}"
        ;;
    
    "restart")
        echo -e "${YELLOW}🔄 Restarting services...${NC}"
        
        # Ensure user_data directory has correct permissions
        echo -e "${YELLOW}🔧 Fixing user_data directory permissions...${NC}"
        mkdir -p ./user_data
        sudo chown -R 1000:1000 ./user_data
        sudo chmod -R 755 ./user_data
        
        docker compose -f docker-compose.production.yml down
        docker compose -f docker-compose.production.yml up -d
        echo -e "${GREEN}✅ Services restarted${NC}"
        ;;
    
    "logs")
        echo -e "${YELLOW}📋 Showing logs...${NC}"
        docker compose -f docker-compose.production.yml logs -f
        ;;
    
    "status")
        echo -e "${YELLOW}📊 Service Status:${NC}"
        docker compose -f docker-compose.production.yml ps
        echo ""
        echo -e "${YELLOW}🌐 Checking domain status...${NC}"
        curl -s -o /dev/null -w "%{http_code}" https://solana-trading-bot.antcoders.dev || echo "Domain not responding"
        ;;
    
    "update")
        echo -e "${YELLOW}🔄 Updating and redeploying...${NC}"
        git pull
        docker compose -f docker-compose.production.yml build --no-cache
        docker compose -f docker-compose.production.yml up -d
        echo -e "${GREEN}✅ Update complete!${NC}"
        ;;
    
    "cleanup")
        echo -e "${YELLOW}🧹 Cleaning up old images and containers...${NC}"
        docker compose -f docker-compose.production.yml down
        docker system prune -f
        docker image prune -f
        echo -e "${GREEN}✅ Cleanup complete${NC}"
        ;;
    
    "fix-permissions")
        echo -e "${YELLOW}🔧 Fixing user_data directory permissions...${NC}"
        mkdir -p ./user_data
        sudo chown -R 1000:1000 ./user_data
        sudo chmod -R 755 ./user_data
        echo -e "${GREEN}✅ Permissions fixed${NC}"
        echo -e "${YELLOW}Now restart the service: ./deploy-production.sh restart${NC}"
        ;;
    
    *)
        echo -e "${BLUE}Solana Trading Bot - Production Deployment${NC}"
        echo ""
        echo "Usage: ./deploy-production.sh [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    - Build and deploy to production"
        echo "  start     - Start services"
        echo "  stop      - Stop services"
        echo "  restart   - Restart services"
        echo "  logs      - Show live logs"
        echo "  status    - Show service status"
        echo "  update    - Pull latest code and redeploy"
        echo "  cleanup   - Clean up old containers and images"
        echo "  fix-permissions - Fix user_data directory permissions"
        echo ""
        echo "Examples:"
        echo "  ./deploy-production.sh deploy"
        echo "  ./deploy-production.sh logs"
        echo "  ./deploy-production.sh status"
        ;;
esac
