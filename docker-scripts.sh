#!/bin/bash

# Solana Trading Bot Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Solana Trading Bot Docker Management

Usage: ./docker-scripts.sh [COMMAND]

Commands:
    build           Build the Docker image
    start           Start the application (production)
    start-dev       Start the application (development with hot reload)
    stop            Stop the application
    restart         Restart the application
    logs            Show application logs
    shell           Open shell in container
    clean           Clean up containers and images
    clean-data      Clear all user data
    status          Show container status
    update          Update and restart the application

Examples:
    ./docker-scripts.sh build
    ./docker-scripts.sh start
    ./docker-scripts.sh logs
    ./docker-scripts.sh clean-data

EOF
}

# Build image
build_image() {
    print_status "Building Solana Trading Bot Docker image..."
    docker-compose build
    print_success "Docker image built successfully!"
}

# Start production
start_production() {
    print_status "Starting Solana Trading Bot (Production)..."
    docker-compose up -d
    print_success "Application started! Visit http://localhost:3000"
    print_status "Use './docker-scripts.sh logs' to view logs"
}

# Start development
start_development() {
    print_status "Starting Solana Trading Bot (Development)..."
    docker-compose -f docker-compose.dev.yml up -d
    print_success "Development server started! Visit http://localhost:3000"
    print_status "Hot reload enabled. Use './docker-scripts.sh logs' to view logs"
}

# Stop application
stop_application() {
    print_status "Stopping Solana Trading Bot..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    print_success "Application stopped!"
}

# Restart application
restart_application() {
    print_status "Restarting Solana Trading Bot..."
    stop_application
    sleep 2
    start_production
}

# Show logs
show_logs() {
    print_status "Showing application logs (Ctrl+C to exit)..."
    docker-compose logs -f
}

# Open shell
open_shell() {
    print_status "Opening shell in container..."
    docker-compose exec solana-trading-bot sh
}

# Clean up
clean_up() {
    print_warning "This will remove all containers and images!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up containers and images..."
        docker-compose down
        docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
        docker rmi $(docker images "solana-trading-bot*" -q) 2>/dev/null || true
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Clean user data
clean_data() {
    print_warning "This will remove all user data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Clearing user data..."
        rm -rf ./user_data/*
        mkdir -p ./user_data
        print_success "User data cleared!"
    else
        print_status "Data cleanup cancelled."
    fi
}

# Show status
show_status() {
    print_status "Container Status:"
    docker-compose ps
    echo
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Update application
update_application() {
    print_status "Updating Solana Trading Bot..."
    git pull
    build_image
    restart_application
    print_success "Application updated successfully!"
}

# Main script logic
case "$1" in
    build)
        build_image
        ;;
    start)
        start_production
        ;;
    start-dev)
        start_development
        ;;
    stop)
        stop_application
        ;;
    restart)
        restart_application
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    clean)
        clean_up
        ;;
    clean-data)
        clean_data
        ;;
    status)
        show_status
        ;;
    update)
        update_application
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac
