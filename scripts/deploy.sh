#!/bin/bash

# 🚀 AI Code Visualizer - Deploy Script
# This script handles deployment to various environments (staging, production)

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="ai-code-visualizer"
DOCKER_IMAGE_NAME="ai-code-visualizer"
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
DEFAULT_ENV="staging"

# Deployment configurations
declare -A ENVIRONMENTS=(
    ["staging"]="staging"
    ["production"]="production"
    ["dev"]="development"
)

declare -A SERVER_CONFIGS=(
    ["staging"]="staging-server.example.com"
    ["production"]="production-server.example.com"
    ["dev"]="localhost"
)

declare -A PORTS=(
    ["staging"]="3001"
    ["production"]="3000"
    ["dev"]="3000"
)

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

print_deploy() {
    echo -e "${PURPLE}[DEPLOY]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking deployment prerequisites..."
    
    # Check Docker
    if ! command_exists docker; then
        print_error "Docker is not installed. Please install Docker."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    # Check Git
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git."
        exit 1
    fi
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes. Consider committing them before deployment."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled."
            exit 0
        fi
    fi
    
    print_success "Prerequisites check passed"
}

# Function to validate environment
validate_environment() {
    local env=$1
    
    if [[ ! ${ENVIRONMENTS[$env]+_} ]]; then
        print_error "Invalid environment: $env"
        print_status "Available environments: ${!ENVIRONMENTS[@]}"
        exit 1
    fi
    
    print_success "Environment '$env' is valid"
}

# Function to load environment variables
load_environment() {
    local env=$1
    
    print_status "Loading environment configuration for: $env"
    
    # Load environment-specific .env file
    if [ -f ".env.$env" ]; then
        print_status "Loading .env.$env"
        export $(cat ".env.$env" | grep -v '^#' | xargs)
    elif [ -f ".env" ]; then
        print_status "Loading .env (default)"
        export $(cat ".env" | grep -v '^#' | xargs)
    else
        print_warning "No environment file found"
    fi
    
    # Set deployment-specific variables
    export NODE_ENV=${ENVIRONMENTS[$env]}
    export DEPLOY_ENVIRONMENT=$env
    export DEPLOY_TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
    export DEPLOY_COMMIT=$(git rev-parse --short HEAD)
    export DEPLOY_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    print_success "Environment configuration loaded"
}

# Function to run pre-deployment checks
pre_deployment_checks() {
    local env=$1
    
    print_status "Running pre-deployment checks for $env..."
    
    # Check if build exists
    if [ ! -d "dist" ]; then
        print_error "Build directory not found. Please run './scripts/build.sh' first."
        exit 1
    fi
    
    # Check if Docker image exists
    if ! docker images "$DOCKER_IMAGE_NAME:latest" --format "table {{.Repository}}" | grep -q "$DOCKER_IMAGE_NAME"; then
        print_error "Docker image not found. Please run './scripts/build.sh' first."
        exit 1
    fi
    
    # Environment-specific checks
    case $env in
        "production")
            # Additional checks for production
            print_status "Running production-specific checks..."
            
            # Check if on main/master branch
            CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
            if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
                print_warning "Not on main/master branch (current: $CURRENT_BRANCH)"
                read -p "Continue with production deployment? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    print_status "Production deployment cancelled."
                    exit 0
                fi
            fi
            
            # Check for required environment variables
            if [[ -z "$OPENAI_API_KEY" ]]; then
                print_error "OPENAI_API_KEY is required for production deployment"
                exit 1
            fi
            
            if [[ -z "$GITHUB_TOKEN" ]]; then
                print_error "GITHUB_TOKEN is required for production deployment"
                exit 1
            fi
            ;;
        "staging")
            print_status "Running staging-specific checks..."
            ;;
    esac
    
    print_success "Pre-deployment checks passed"
}

# Function to tag Docker image
tag_docker_image() {
    local env=$1
    local tag="${DEPLOY_TIMESTAMP}_${env}_${DEPLOY_COMMIT}"
    
    print_status "Tagging Docker image for $env deployment..."
    
    # Tag with environment-specific tag
    docker tag "$DOCKER_IMAGE_NAME:latest" "$DOCKER_IMAGE_NAME:$env"
    docker tag "$DOCKER_IMAGE_NAME:latest" "$DOCKER_IMAGE_NAME:$tag"
    
    # Tag with registry if specified
    if [ -n "$DOCKER_REGISTRY" ]; then
        docker tag "$DOCKER_IMAGE_NAME:latest" "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$env"
        docker tag "$DOCKER_IMAGE_NAME:latest" "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$tag"
        
        print_status "Tagged for registry: $DOCKER_REGISTRY"
    fi
    
    print_success "Docker image tagged successfully"
    print_status "Tags: $env, $tag"
}

# Function to push Docker image
push_docker_image() {
    local env=$1
    
    if [ -n "$DOCKER_REGISTRY" ]; then
        print_status "Pushing Docker image to registry..."
        
        # Login to registry if credentials are provided
        if [ -n "$DOCKER_USERNAME" ] && [ -n "$DOCKER_PASSWORD" ]; then
            echo "$DOCKER_PASSWORD" | docker login "$DOCKER_REGISTRY" -u "$DOCKER_USERNAME" --password-stdin
        fi
        
        # Push images
        docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$env"
        docker push "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:${DEPLOY_TIMESTAMP}_${env}_${DEPLOY_COMMIT}"
        
        print_success "Docker image pushed to registry"
    else
        print_status "No Docker registry specified, skipping push"
    fi
}

# Function to deploy to local/development environment
deploy_local() {
    local env=$1
    local port=${PORTS[$env]}
    
    print_deploy "Deploying to local environment ($env)..."
    
    # Stop existing container if running
    if docker ps | grep -q "$DOCKER_IMAGE_NAME"; then
        print_status "Stopping existing container..."
        docker stop "$DOCKER_IMAGE_NAME" || true
        docker rm "$DOCKER_IMAGE_NAME" || true
    fi
    
    # Run new container
    print_status "Starting new container on port $port..."
    docker run -d \
        --name "$DOCKER_IMAGE_NAME" \
        -p "$port:3000" \
        -e NODE_ENV="${ENVIRONMENTS[$env]}" \
        -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
        -e GITHUB_TOKEN="${GITHUB_TOKEN:-}" \
        "$DOCKER_IMAGE_NAME:$env"
    
    # Wait for container to be ready
    print_status "Waiting for application to be ready..."
    sleep 10
    
    # Health check
    if curl -f "http://localhost:$port/health" >/dev/null 2>&1; then
        print_success "Application is running and healthy"
        print_status "Access at: http://localhost:$port"
    else
        print_warning "Application may not be fully ready yet"
        print_status "Check logs with: docker logs $DOCKER_IMAGE_NAME"
    fi
}

# Function to deploy to remote server
deploy_remote() {
    local env=$1
    local server=${SERVER_CONFIGS[$env]}
    local port=${PORTS[$env]}
    
    print_deploy "Deploying to remote server ($server)..."
    
    # Check if SSH key is available
    if [ ! -f "$HOME/.ssh/id_rsa" ] && [ -z "$SSH_PRIVATE_KEY" ]; then
        print_error "SSH key not found. Please set up SSH access to the server."
        exit 1
    fi
    
    # Create deployment script for remote server
    cat > /tmp/deploy_remote.sh << EOF
#!/bin/bash
set -e

# Pull latest image
docker pull "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$env"

# Stop existing container
docker stop "$DOCKER_IMAGE_NAME" || true
docker rm "$DOCKER_IMAGE_NAME" || true

# Run new container
docker run -d \\
    --name "$DOCKER_IMAGE_NAME" \\
    -p "$port:3000" \\
    --restart unless-stopped \\
    -e NODE_ENV="${ENVIRONMENTS[$env]}" \\
    -e OPENAI_API_KEY="$OPENAI_API_KEY" \\
    -e GITHUB_TOKEN="$GITHUB_TOKEN" \\
    "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$env"

# Clean up old images
docker image prune -f

echo "Deployment completed successfully"
EOF
    
    # Copy and execute deployment script on remote server
    scp /tmp/deploy_remote.sh "$server:/tmp/"
    ssh "$server" "chmod +x /tmp/deploy_remote.sh && /tmp/deploy_remote.sh"
    
    # Clean up
    rm /tmp/deploy_remote.sh
    
    print_success "Remote deployment completed"
    print_status "Application URL: http://$server:$port"
}

# Function to deploy using Docker Compose
deploy_docker_compose() {
    local env=$1
    
    print_deploy "Deploying using Docker Compose ($env)..."
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        exit 1
    fi
    
    # Set environment for docker-compose
    export COMPOSE_PROJECT_NAME="$PROJECT_NAME-$env"
    export IMAGE_TAG="$env"
    
    # Deploy with docker-compose
    docker-compose down --remove-orphans
    docker-compose up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Show running services
    docker-compose ps
    
    print_success "Docker Compose deployment completed"
}

# Function to deploy to Kubernetes
deploy_kubernetes() {
    local env=$1
    
    print_deploy "Deploying to Kubernetes ($env)..."
    
    # Check if kubectl is available
    if ! command_exists kubectl; then
        print_error "kubectl is not installed. Please install kubectl."
        exit 1
    fi
    
    # Check if k8s manifests exist
    if [ ! -d "k8s" ]; then
        print_error "Kubernetes manifests directory (k8s/) not found"
        exit 1
    fi
    
    # Apply namespace
    kubectl apply -f "k8s/namespace-$env.yaml" || true
    
    # Set context to the environment namespace
    kubectl config set-context --current --namespace="$PROJECT_NAME-$env"
    
    # Apply configurations
    kubectl apply -f "k8s/configmap-$env.yaml" || true
    kubectl apply -f "k8s/secret-$env.yaml" || true
    
    # Update image in deployment
    sed -i.bak "s|image: .*|image: $DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$env|g" "k8s/deployment-$env.yaml"
    
    # Apply deployment and service
    kubectl apply -f "k8s/deployment-$env.yaml"
    kubectl apply -f "k8s/service-$env.yaml"
    
    # Wait for rollout
    kubectl rollout status deployment/"$PROJECT_NAME" --timeout=300s
    
    # Show deployment status
    kubectl get pods,svc
    
    print_success "Kubernetes deployment completed"
}

# Function to run post-deployment checks
post_deployment_checks() {
    local env=$1
    local port=${PORTS[$env]}
    
    print_status "Running post-deployment checks..."
    
    # Health check
    local health_url="http://localhost:$port/health"
    if [ "$env" != "dev" ]; then
        health_url="http://${SERVER_CONFIGS[$env]}:$port/health"
    fi
    
    # Wait for application to be ready
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f "$health_url" >/dev/null 2>&1; then
            print_success "Health check passed"
            break
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for application..."
        sleep 10
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_error "Health check failed after $max_attempts attempts"
        return 1
    fi
    
    # Additional checks can be added here
    # - API endpoint tests
    # - Database connectivity
    # - External service checks
    
    print_success "Post-deployment checks completed"
}

# Function to create deployment report
create_deployment_report() {
    local env=$1
    
    print_status "Creating deployment report..."
    
    local report_file="deployment-report-$env-$DEPLOY_TIMESTAMP.json"
    
    cat > "$report_file" << EOF
{
  "project": "$PROJECT_NAME",
  "environment": "$env",
  "deploymentTime": "$(date '+%Y-%m-%d %H:%M:%S')",
  "commit": "$DEPLOY_COMMIT",
  "branch": "$DEPLOY_BRANCH",
  "dockerImage": "$DOCKER_IMAGE_NAME:$env",
  "registryImage": "$DOCKER_REGISTRY/$DOCKER_IMAGE_NAME:$env",
  "deployedBy": "$(whoami)",
  "deploymentMethod": "$DEPLOYMENT_METHOD",
  "applicationUrl": "http://${SERVER_CONFIGS[$env]}:${PORTS[$env]}",
  "healthCheckUrl": "http://${SERVER_CONFIGS[$env]}:${PORTS[$env]}/health"
}
EOF
    
    print_success "Deployment report created: $report_file"
}

# Function to rollback deployment
rollback_deployment() {
    local env=$1
    
    print_warning "Rolling back deployment for $env..."
    
    # Get previous image tag
    local previous_tag=$(docker images "$DOCKER_IMAGE_NAME" --format "table {{.Tag}}" | grep -E "${env}_" | head -2 | tail -1)
    
    if [ -z "$previous_tag" ]; then
        print_error "No previous deployment found to rollback to"
        exit 1
    fi
    
    print_status "Rolling back to: $DOCKER_IMAGE_NAME:$previous_tag"
    
    # Stop current container
    docker stop "$DOCKER_IMAGE_NAME" || true
    docker rm "$DOCKER_IMAGE_NAME" || true
    
    # Start container with previous image
    docker run -d \
        --name "$DOCKER_IMAGE_NAME" \
        -p "${PORTS[$env]}:3000" \
        -e NODE_ENV="${ENVIRONMENTS[$env]}" \
        "$DOCKER_IMAGE_NAME:$previous_tag"
    
    print_success "Rollback completed"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  staging       Deploy to staging environment"
    echo "  production    Deploy to production environment"
    echo "  dev           Deploy to local development environment"
    echo ""
    echo "Options:"
    echo "  --method METHOD    Deployment method (docker|compose|k8s|remote)"
    echo "  --rollback         Rollback to previous deployment"
    echo "  --dry-run         Show what would be deployed without actually deploying"
    echo "  --skip-checks     Skip pre and post deployment checks"
    echo "  --help            Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DOCKER_REGISTRY   Docker registry URL"
    echo "  DOCKER_USERNAME   Docker registry username"
    echo "  DOCKER_PASSWORD   Docker registry password"
    echo "  OPENAI_API_KEY    OpenAI API key"
    echo "  GITHUB_TOKEN      GitHub API token"
    echo ""
    echo "Examples:"
    echo "  $0 staging                           # Deploy to staging with Docker"
    echo "  $0 production --method k8s           # Deploy to production using Kubernetes"
    echo "  $0 dev --method compose              # Deploy locally using Docker Compose"
    echo "  $0 staging --rollback                # Rollback staging deployment"
}

# Function to perform dry run
dry_run() {
    local env=$1
    local method=$2
    
    print_status "=== DRY RUN MODE ==="
    print_status "Would deploy to environment: $env"
    print_status "Would use deployment method: $method"
    print_status "Would use Docker image: $DOCKER_IMAGE_NAME:$env"
    print_status "Would deploy commit: $DEPLOY_COMMIT"
    print_status "Would deploy branch: $DEPLOY_BRANCH"
    
    if [ -n "$DOCKER_REGISTRY" ]; then
        print_status "Would push to registry: $DOCKER_REGISTRY"
    fi
    
    case $method in
        "docker")
            print_status "Would run: docker run -d --name $DOCKER_IMAGE_NAME -p ${PORTS[$env]}:3000 $DOCKER_IMAGE_NAME:$env"
            ;;
        "compose")
            print_status "Would run: docker-compose up -d"
            ;;
        "k8s")
            print_status "Would apply Kubernetes manifests in k8s/ directory"
            ;;
        "remote")
            print_status "Would deploy to remote server: ${SERVER_CONFIGS[$env]}"
            ;;
    esac
    
    print_status "=== END DRY RUN ==="
}

# Main deployment function
main() {
    local environment=$DEFAULT_ENV
    local deployment_method="docker"
    local rollback=false
    local dry_run_mode=false
    local skip_checks=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            staging|production|dev)
                environment=$1
                shift
                ;;
            --method)
                deployment_method=$2
                shift 2
                ;;
            --rollback)
                rollback=true
                shift
                ;;
            --dry-run)
                dry_run_mode=true
                shift
                ;;
            --skip-checks)
                skip_checks=true
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
    
    # Validate deployment method
    case $deployment_method in
        docker|compose|k8s|remote)
            ;;
        *)
            print_error "Invalid deployment method: $deployment_method"
            print_status "Valid methods: docker, compose, k8s, remote"
            exit 1
            ;;
    esac
    
    # Set deployment method for reporting
    export DEPLOYMENT_METHOD=$deployment_method
    
    # Start deployment process
    print_deploy "🚀 Starting deployment process"
    print_status "Environment: $environment"
    print_status "Method: $deployment_method"
    print_status "Timestamp: $(date)"
    
    # Validate environment
    validate_environment "$environment"
    
    # Load environment configuration
    load_environment "$environment"
    
    # Handle rollback
    if [ "$rollback" = true ]; then
        rollback_deployment "$environment"
        exit 0
    fi
    
    # Handle dry run
    if [ "$dry_run_mode" = true ]; then
        dry_run "$environment" "$deployment_method"
        exit 0
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Run pre-deployment checks
    if [ "$skip_checks" != true ]; then
        pre_deployment_checks "$environment"
    fi
    
    # Tag Docker image
    tag_docker_image "$environment"
    
    # Push Docker image (if registry is configured)
    push_docker_image "$environment"
    
    # Deploy based on method
    case $deployment_method in
        "docker")
            if [ "$environment" = "dev" ]; then
                deploy_local "$environment"
            else
                deploy_remote "$environment"
            fi
            ;;
        "compose")
            deploy_docker_compose "$environment"
            ;;
        "k8s")
            deploy_kubernetes "$environment"
            ;;
        "remote")
            deploy_remote "$environment"
            ;;
    esac
    
    # Run post-deployment checks
    if [ "$skip_checks" != true ]; then
        post_deployment_checks "$environment" || {
            print_error "Post-deployment checks failed"
            print_status "Consider rolling back with: $0 $environment --rollback"
            exit 1
        }
    fi
    
    # Create deployment report
    create_deployment_report "$environment"
    
    # Success message
    print_success "🎉 Deployment completed successfully!"
    print_deploy "Environment: $environment"
    print_deploy "Method: $deployment_method"
    print_deploy "Image: $DOCKER_IMAGE_NAME:$environment"
    print_deploy "Commit: $DEPLOY_COMMIT"
    
    # Show access information
    case $environment in
        "dev")
            print_status "🌐 Application URL: http://localhost:${PORTS[$environment]}"
            print_status "📊 Health Check: http://localhost:${PORTS[$environment]}/health"
            ;;
        *)
            print_status "🌐 Application URL: http://${SERVER_CONFIGS[$environment]}:${PORTS[$environment]}"
            print_status "📊 Health Check: http://${SERVER_CONFIGS[$environment]}:${PORTS[$environment]}/health"
            ;;
    esac
    
    # Show useful commands
    echo ""
    print_status "Useful commands:"
    echo "  • View logs: docker logs $DOCKER_IMAGE_NAME"
    echo "  • Monitor: docker stats $DOCKER_IMAGE_NAME"
    echo "  • Rollback: $0 $environment --rollback"
    
    # Cleanup
    print_status "Cleaning up old Docker images..."
    docker image prune -f >/dev/null 2>&1 || true
    
    print_deploy "Deployment process completed at: $(date)"
}

# Trap errors and cleanup
trap 'print_error "Deployment failed at line $LINENO. Exit code: $?"' ERR

# Run main function with all arguments
main "$@"