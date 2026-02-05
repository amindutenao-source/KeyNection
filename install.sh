#!/bin/bash

# KeyNection Installation Script
# This script will set up the complete KeyNection project

set -e

echo "🏠 KeyNection - Installation Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Node.js $(node -v) is installed"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "npm $(npm -v) is installed"
}

# Check if Docker is installed (optional)
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_success "Docker and Docker Compose are installed"
        DOCKER_AVAILABLE=true
    else
        print_warning "Docker is not installed. You can still run the project manually."
        DOCKER_AVAILABLE=false
    fi
}

# Check if PostgreSQL is installed (optional)
check_postgres() {
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        POSTGRES_AVAILABLE=true
    else
        print_warning "PostgreSQL is not installed. You can use Docker instead."
        POSTGRES_AVAILABLE=false
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install server dependencies
    cd server
    npm install
    cd ..
    
    # Install client dependencies
    cd client
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Server environment
    if [ ! -f server/.env ]; then
        cp server/env.example server/.env
        print_success "Created server/.env from template"
    else
        print_warning "server/.env already exists, skipping..."
    fi
    
    # Client environment
    if [ ! -f client/.env ]; then
        cat > client/.env << EOF
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=KeyNection
EOF
        print_success "Created client/.env"
    else
        print_warning "client/.env already exists, skipping..."
    fi
}

# Setup database with Docker
setup_database_docker() {
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_status "Setting up database with Docker..."
        
        # Start PostgreSQL and Redis
        docker-compose up -d postgres redis
        
        # Wait for PostgreSQL to be ready
        print_status "Waiting for PostgreSQL to be ready..."
        sleep 10
        
        # Generate Prisma client
        cd server
        npm run prisma:generate
        
        # Run migrations
        npm run prisma:migrate
        
        # Seed database
        npm run prisma:seed
        cd ..
        
        print_success "Database setup completed with Docker"
    else
        print_warning "Docker not available, skipping database setup"
    fi
}

# Setup database manually
setup_database_manual() {
    if [ "$POSTGRES_AVAILABLE" = true ]; then
        print_status "Setting up database manually..."
        
        # Check if database exists
        if ! psql -lqt | cut -d \| -f 1 | grep -qw keynection; then
            print_status "Creating database 'keynection'..."
            createdb keynection
        fi
        
        # Generate Prisma client
        cd server
        npm run prisma:generate
        
        # Run migrations
        npm run prisma:migrate
        
        # Seed database
        npm run prisma:seed
        cd ..
        
        print_success "Database setup completed manually"
    else
        print_warning "PostgreSQL not available, skipping database setup"
    fi
}

# Build the project
build_project() {
    print_status "Building the project..."
    
    # Build server
    cd server
    npm run build
    cd ..
    
    # Build client
    cd client
    npm run build
    cd ..
    
    print_success "Project built successfully"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Installation completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo ""
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "1. Start the development servers:"
        echo "   npm run dev"
        echo ""
        echo "2. Or start with Docker:"
        echo "   npm run docker:up"
        echo ""
    else
        echo "1. Configure your database connection in server/.env"
        echo "2. Start the development servers:"
        echo "   npm run dev"
        echo ""
    fi
    
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001"
    echo "   API Documentation: http://localhost:3001/api-docs"
    echo ""
    echo "4. Test accounts (from seed data):"
    echo "   Owner: owner1@example.com / password123"
    echo "   Manager: manager1@example.com / password123"
    echo "   Admin: admin@keynection.com / password123"
    echo ""
    echo "5. Useful commands:"
    echo "   npm run dev              # Start development"
    echo "   npm run test             # Run tests"
    echo "   npm run lint             # Lint code"
    echo "   npm run db:studio        # Open Prisma Studio"
    echo ""
    echo "📚 For more information, see README.md"
    echo ""
}

# Main installation process
main() {
    echo "Starting KeyNection installation..."
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    check_docker
    check_postgres
    
    echo ""
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_environment
    
    # Setup database
    if [ "$DOCKER_AVAILABLE" = true ]; then
        setup_database_docker
    else
        setup_database_manual
    fi
    
    # Build project
    build_project
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@" 