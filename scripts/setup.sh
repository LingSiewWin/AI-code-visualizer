#!/bin/bash

# AI Code Visualizer - Setup Script
# This script sets up the development environment for the AI Code Visualizer project

set -e  # Exit on any error

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_success "Node.js version $(node --version) is compatible"
            return 0
        else
            print_error "Node.js version $(node --version) is too old. Please install Node.js 16 or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher"
        return 1
    fi
}

# Function to setup environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please update the .env file with your actual API keys and configuration"
        else
            print_warning "No .env.example file found. Creating basic .env file..."
            cat > .env << EOF
# AI Code Visualizer Environment Variables

# GitHub API
GITHUB_TOKEN=your_github_token_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Client Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Database Configuration (if using)
DATABASE_URL=your_database_url_here
EOF
            print_success "Created basic .env file"
            print_warning "Please update the .env file with your actual API keys and configuration"
        fi
    else
        print_success ".env file already exists"
    fi
}

# Function to install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "No package.json found in root directory"
        return 1
    fi
    
    npm install
    print_success "Frontend dependencies installed"
}

# Function to install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        cd server
        npm install
        cd ..
        print_success "Backend dependencies installed"
    else
        print_warning "No server directory or package.json found. Skipping backend dependencies"
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    DIRS=(
        "src/assets/icons"
        "src/assets/images"
        "src/assets/models"
        "public/static/images"
        "public/static/icons"
        "docs/screenshots"
        "logs"
    )
    
    for dir in "${DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        fi
    done
}

# Function to setup git hooks (if git repo exists)
setup_git_hooks() {
    if [ -d ".git" ]; then
        print_status "Setting up git hooks..."
        
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run linting and tests before commit
npm run lint
npm run test:unit
EOF
        chmod +x .git/hooks/pre-commit
        print_success "Git pre-commit hook installed"
    else
        print_warning "Not a git repository. Skipping git hooks setup"
    fi
}

# Function to check required tools
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! check_node_version; then
        return 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm"
        return 1
    fi
    
    # Check git (optional)
    if ! command_exists git; then
        print_warning "git is not installed. Version control features will be limited"
    fi
    
    # Check docker (optional)
    if command_exists docker; then
        print_success "Docker is available for containerized deployment"
    else
        print_warning "Docker is not installed. Containerized deployment will not be available"
    fi
    
    print_success "System requirements check completed"
}

# Function to run initial build
initial_build() {
    print_status "Running initial build..."
    
    # Build frontend
    if command_exists npm && [ -f "package.json" ]; then
        npm run build 2>/dev/null || {
            print_warning "Frontend build failed or build script not available"
        }
    fi
    
    print_success "Initial build completed"
}

# Function to display next steps
show_next_steps() {
    echo ""
    echo "========================================"
    echo "🎉 Setup Complete!"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with actual API keys:"
    echo "   - GitHub Token: https://github.com/settings/tokens"
    echo "   - OpenAI API Key: https://platform.openai.com/api-keys"
    echo ""
    echo "2. Start the development servers:"
    echo "   Frontend: npm start"
    echo "   Backend:  cd server && npm start"
    echo ""
    echo "3. Open http://localhost:3000 in your browser"
    echo ""
    echo "4. For production deployment:"
    echo "   - Use Docker: docker-compose up"
    echo "   - Or run: npm run build && npm run start:prod"
    echo ""
    echo "📚 Check the docs/ folder for more information"
    echo "🐛 Report issues at: https://github.com/your-repo/issues"
    echo ""
}

# Main setup function
main() {
    echo ""
    echo "========================================"
    echo "🚀 AI Code Visualizer Setup"
    echo "========================================"
    echo ""
    
    # Check requirements first
    if ! check_requirements; then
        print_error "Requirements check failed. Please install required dependencies"
        exit 1
    fi
    
    # Setup environment
    setup_env
    
    # Create directories
    create_directories
    
    # Install dependencies
    install_frontend_deps
    install_backend_deps
    
    # Setup git hooks
    setup_git_hooks
    
    # Initial build
    initial_build
    
    # Show next steps
    show_next_steps
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "AI Code Visualizer Setup Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Only check requirements"
        echo "  --env          Only setup environment variables"
        echo "  --deps         Only install dependencies"
        echo ""
        exit 0
        ;;
    --check)
        check_requirements
        exit $?
        ;;
    --env)
        setup_env
        exit 0
        ;;
    --deps)
        install_frontend_deps
        install_backend_deps
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use $0 --help for usage information"
        exit 1
        ;;
esac