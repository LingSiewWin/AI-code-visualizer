#!/bin/bash

# 🏗️ AI Code Visualizer - Build Script
# This script handles the complete build process for both frontend and backend

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-code-visualizer"
BUILD_DIR="dist"
SERVER_BUILD_DIR="server/dist"
DOCKER_IMAGE_NAME="ai-code-visualizer"
DOCKER_TAG="latest"

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

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Function to clean previous builds
clean_build() {
    print_status "Cleaning previous builds..."
    
    # Remove frontend build directory
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
        print_status "Removed frontend build directory: $BUILD_DIR"
    fi
    
    # Remove server build directory
    if [ -d "$SERVER_BUILD_DIR" ]; then
        rm -rf "$SERVER_BUILD_DIR"
        print_status "Removed server build directory: $SERVER_BUILD_DIR"
    fi
    
    # Remove node_modules if --clean flag is passed
    if [ "$1" = "--clean" ]; then
        print_status "Deep cleaning node_modules..."
        rm -rf node_modules
        rm -rf server/node_modules
        rm -rf package-lock.json
        rm -rf server/package-lock.json
    fi
    
    print_success "Clean completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm ci --production=false
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm ci --production=false
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" != "true" ]; then
        print_status "Running tests..."
        
        # Run frontend tests
        print_status "Running frontend tests..."
        npm run test -- --coverage --watchAll=false
        
        # Run server tests
        print_status "Running server tests..."
        cd server
        npm run test -- --coverage --watchAll=false
        cd ..
        
        print_success "All tests passed"
    else
        print_warning "Skipping tests (SKIP_TESTS=true)"
    fi
}

# Function to lint code
lint_code() {
    if [ "$SKIP_LINT" != "true" ]; then
        print_status "Running code linting..."
        
        # Lint frontend code
        if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
            print_status "Linting frontend code..."
            npm run lint
        fi
        
        # Lint server code
        cd server
        if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
            print_status "Linting server code..."
            npm run lint
        fi
        cd ..
        
        print_success "Code linting completed"
    else
        print_warning "Skipping linting (SKIP_LINT=true)"
    fi
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend application..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the frontend
    npm run build
    
    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Frontend build failed - no build directory found"
        exit 1
    fi
    
    # Check if main files exist
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        print_error "Frontend build failed - index.html not found"
        exit 1
    fi
    
    print_success "Frontend build completed successfully"
    
    # Print build statistics
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    print_status "Frontend build size: $BUILD_SIZE"
}

# Function to build server
build_server() {
    print_status "Building server application..."
    
    cd server
    
    # Set production environment
    export NODE_ENV=production
    
    # If TypeScript is used, compile it
    if [ -f "tsconfig.json" ]; then
        print_status "Compiling TypeScript..."
        npx tsc
    else
        # For JavaScript, just copy files and install production dependencies
        print_status "Preparing JavaScript server build..."
        mkdir -p dist
        cp -r !(node_modules|dist|*.log) dist/ 2>/dev/null || true
    fi
    
    # Install production dependencies
    print_status "Installing production dependencies..."
    npm ci --only=production
    
    cd ..
    
    print_success "Server build completed successfully"
}

# Function to build Docker image
build_docker() {
    if command_exists docker; then
        print_status "Building Docker image..."
        
        # Build the Docker image
        docker build -t "$DOCKER_IMAGE_NAME:$DOCKER_TAG" .
        
        # Tag with build timestamp
        BUILD_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        docker tag "$DOCKER_IMAGE_NAME:$DOCKER_TAG" "$DOCKER_IMAGE_NAME:$BUILD_TIMESTAMP"
        
        print_success "Docker image built successfully"
        print_status "Tagged as: $DOCKER_IMAGE_NAME:$DOCKER_TAG and $DOCKER_IMAGE_NAME:$BUILD_TIMESTAMP"
        
        # Show image size
        IMAGE_SIZE=$(docker images "$DOCKER_IMAGE_NAME:$DOCKER_TAG" --format "table {{.Size}}" | tail -n1)
        print_status "Docker image size: $IMAGE_SIZE"
    else
        print_warning "Docker not found, skipping Docker build"
    fi
}

# Function to generate build report
generate_build_report() {
    print_status "Generating build report..."
    
    BUILD_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    BUILD_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    BUILD_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    
    # Create build report
    cat > build-report.json << EOF
{
  "project": "$PROJECT_NAME",
  "buildTime": "$BUILD_TIMESTAMP",
  "commit": "$BUILD_COMMIT",
  "branch": "$BUILD_BRANCH",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "frontendBuildSize": "$(du -sh $BUILD_DIR 2>/dev/null | cut -f1 || echo 'N/A')",
  "dockerImage": "$DOCKER_IMAGE_NAME:$DOCKER_TAG"
}
EOF
    
    print_success "Build report generated: build-report.json"
}

# Function to verify build
verify_build() {
    print_status "Verifying build integrity..."
    
    # Check frontend build
    if [ -d "$BUILD_DIR" ]; then
        FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
        print_status "Frontend build contains $FILE_COUNT files"
    else
        print_error "Frontend build directory not found"
        return 1
    fi
    
    # Check server build
    cd server
    if [ -d "node_modules" ]; then
        print_status "Server dependencies installed"
    else
        print_error "Server dependencies not found"
        return 1
    fi
    cd ..
    
    print_success "Build verification completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean           Clean node_modules and build directories"
    echo "  --skip-tests      Skip running tests"
    echo "  --skip-lint       Skip code linting"
    echo "  --skip-docker     Skip Docker image building"
    echo "  --frontend-only   Build only frontend"
    echo "  --server-only     Build only server"
    echo "  --help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  NODE_ENV          Set to 'production' for production builds"
    echo "  SKIP_TESTS        Set to 'true' to skip tests"
    echo "  SKIP_LINT         Set to 'true' to skip linting"
    echo "  DOCKER_REGISTRY   Docker registry for tagging images"
}

# Main build function
main() {
    local CLEAN_BUILD=false
    local SKIP_DOCKER=false
    local FRONTEND_ONLY=false
    local SERVER_ONLY=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN_BUILD=true
                shift
                ;;
            --skip-tests)
                export SKIP_TESTS=true
                shift
                ;;
            --skip-lint)
                export SKIP_LINT=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                shift
                ;;
            --server-only)
                SERVER_ONLY=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Start build process
    print_status "Starting build process for $PROJECT_NAME"
    print_status "Build started at: $(date)"
    
    # Check dependencies
    check_dependencies
    
    # Clean previous builds
    if [ "$CLEAN_BUILD" = true ]; then
        clean_build --clean
    else
        clean_build
    fi
    
    # Install dependencies
    install_dependencies
    
    # Run linting
    lint_code
    
    # Run tests
    run_tests
    
    # Build applications
    if [ "$SERVER_ONLY" != true ]; then
        build_frontend
    fi
    
    if [ "$FRONTEND_ONLY" != true ]; then
        build_server
    fi
    
    # Build Docker image
    if [ "$SKIP_DOCKER" != true ] && [ "$FRONTEND_ONLY" != true ] && [ "$SERVER_ONLY" != true ]; then
        build_docker
    fi
    
    # Verify build
    verify_build
    
    # Generate build report
    generate_build_report
    
    # Success message
    print_success "🎉 Build completed successfully!"
    print_status "Build finished at: $(date)"
    
    # Show next steps
    echo ""
    print_status "Next steps:"
    echo "  • Run 'npm start' to start the development server"
    echo "  • Run 'docker run -p 3000:3000 $DOCKER_IMAGE_NAME:$DOCKER_TAG' to run with Docker"
    echo "  • Run './scripts/deploy.sh' to deploy to production"
}

# Run main function with all arguments
main "$@"