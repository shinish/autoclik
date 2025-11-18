#!/bin/bash

# AWX Setup Script for Catalog Testing
# This script helps set up and configure AWX for testing the catalog system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed"

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed"

    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8080 is already in use. AWX may fail to start."
    else
        print_success "Port 8080 is available"
    fi
}

# Start AWX containers
start_awx() {
    print_header "Starting AWX Containers"

    print_info "Starting Docker containers..."
    docker-compose -f docker-compose.awx.yml up -d

    print_success "AWX containers started"
    print_info "Waiting for AWX to initialize (this may take 5-10 minutes)..."

    # Wait for AWX to be ready
    local max_attempts=60
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:8080/api/v2/ping/ | grep -q "version"; then
            print_success "AWX is ready!"
            return 0
        fi

        attempt=$((attempt + 1))
        echo -n "."
        sleep 10
    done

    print_error "AWX did not start within the expected time"
    print_info "Check logs with: docker-compose -f docker-compose.awx.yml logs"
    return 1
}

# Show AWX status
show_status() {
    print_header "AWX Status"

    docker-compose -f docker-compose.awx.yml ps

    echo ""
    print_info "AWX Web Interface: http://localhost:8080"
    print_info "Default Credentials:"
    echo "  Username: admin"
    echo "  Password: password"
}

# Copy test playbook
copy_playbook() {
    print_header "Setting Up Test Playbook"

    if [ -f "awx-playbooks/test-playbook.yml" ]; then
        print_info "Copying test playbook to AWX container..."
        docker cp awx-playbooks/test-playbook.yml awx-web:/var/lib/awx/projects/ 2>/dev/null || {
            print_warning "Could not copy playbook. AWX may not be fully started yet."
            print_info "Run this script again with 'playbook' option after AWX is ready"
            return 1
        }
        print_success "Test playbook copied successfully"
    else
        print_error "Test playbook not found at awx-playbooks/test-playbook.yml"
        return 1
    fi
}

# Show next steps
show_next_steps() {
    print_header "Next Steps"

    echo "1. Access AWX Web Interface:"
    echo "   URL: ${GREEN}http://localhost:8080${NC}"
    echo "   Username: ${YELLOW}admin${NC}"
    echo "   Password: ${YELLOW}password${NC}"
    echo ""
    echo "2. Create an API Token:"
    echo "   - Click on 'admin' in top right"
    echo "   - Go to 'Tokens'"
    echo "   - Click 'Add'"
    echo "   - Set Scope to 'Write'"
    echo "   - Save and copy the token"
    echo ""
    echo "3. Update .env file:"
    echo "   AWX_TOKEN=<your_token_here>"
    echo ""
    echo "4. Create Job Template in AWX:"
    echo "   - Go to Resources → Templates"
    echo "   - Add Job Template"
    echo "   - Use playbook: test-playbook.yml"
    echo "   - Note the Template ID"
    echo ""
    echo "5. Create Catalog Item:"
    echo "   - Go to ${GREEN}http://localhost:3000/catalog${NC}"
    echo "   - Click 'Add Catalog Item'"
    echo "   - Use Template ID from step 4"
    echo ""
    echo "6. Test Execution!"
    echo ""
    print_info "For detailed instructions, see: ${BLUE}AWX_SETUP.md${NC}"
}

# Stop AWX
stop_awx() {
    print_header "Stopping AWX"

    docker-compose -f docker-compose.awx.yml stop
    print_success "AWX containers stopped"
}

# Complete cleanup
cleanup_awx() {
    print_header "Cleaning Up AWX"

    read -p "This will remove all AWX data. Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.awx.yml down -v
        print_success "AWX containers and data removed"
    else
        print_info "Cleanup cancelled"
    fi
}

# Show logs
show_logs() {
    print_header "AWX Logs"

    docker-compose -f docker-compose.awx.yml logs -f --tail=100 awx-web
}

# Main menu
show_menu() {
    echo ""
    echo "AWX Setup Script"
    echo "================"
    echo ""
    echo "Commands:"
    echo "  setup      - Check prerequisites and start AWX"
    echo "  start      - Start AWX containers"
    echo "  stop       - Stop AWX containers"
    echo "  status     - Show AWX status"
    echo "  playbook   - Copy test playbook to AWX"
    echo "  logs       - Show AWX logs"
    echo "  cleanup    - Remove AWX containers and data"
    echo "  help       - Show this menu"
    echo ""
}

# Main script
case "${1:-help}" in
    setup)
        check_prerequisites
        start_awx && copy_playbook
        show_status
        show_next_steps
        ;;
    start)
        start_awx
        show_status
        ;;
    stop)
        stop_awx
        ;;
    status)
        show_status
        ;;
    playbook)
        copy_playbook
        ;;
    logs)
        show_logs
        ;;
    cleanup)
        cleanup_awx
        ;;
    help|*)
        show_menu
        ;;
esac
