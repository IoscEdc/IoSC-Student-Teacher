#!/bin/bash

# Deployment script for Attendance System
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BUILD_DIR="build"
LOG_FILE="deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check MongoDB
    if ! command -v mongod &> /dev/null; then
        warning "MongoDB is not installed locally. Make sure MongoDB is available on the target server."
    fi
    
    # Check PM2 for production
    if [ "$ENVIRONMENT" = "production" ] && ! command -v pm2 &> /dev/null; then
        warning "PM2 is not installed. Installing PM2..."
        npm install -g pm2
    fi
    
    success "Prerequisites check completed"
}

# Environment setup
setup_environment() {
    log "Setting up environment for $ENVIRONMENT..."
    
    # Create environment files if they don't exist
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log "Creating backend .env file..."
        cat > "$BACKEND_DIR/.env" << EOF
NODE_ENV=$ENVIRONMENT
PORT=5000
MONGO_URL=mongodb://localhost:27017/school_management
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
EOF
        warning "Please update the .env file with your actual configuration values"
    fi
    
    if [ ! -f "$FRONTEND_DIR/.env" ]; then
        log "Creating frontend .env file..."
        cat > "$FRONTEND_DIR/.env" << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=$ENVIRONMENT
GENERATE_SOURCEMAP=false
EOF
        warning "Please update the frontend .env file with your actual API URL"
    fi
    
    success "Environment setup completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    # Backend dependencies
    log "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm ci --only=production
    cd ..
    
    # Frontend dependencies
    log "Installing frontend dependencies..."
    cd $FRONTEND_DIR
    npm ci
    cd ..
    
    success "Dependencies installed successfully"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Backend tests
    log "Running backend tests..."
    cd $BACKEND_DIR
    npm run test:unit || error "Backend unit tests failed"
    npm run test:integration || warning "Backend integration tests failed"
    cd ..
    
    # Frontend tests
    log "Running frontend tests..."
    cd $FRONTEND_DIR
    npm test -- --coverage --watchAll=false || warning "Frontend tests failed"
    cd ..
    
    success "Tests completed"
}

# Build applications
build_applications() {
    log "Building applications..."
    
    # Build frontend
    log "Building frontend..."
    cd $FRONTEND_DIR
    npm run build || error "Frontend build failed"
    cd ..
    
    # Backend doesn't need building, but we can run any pre-deployment scripts
    log "Preparing backend..."
    cd $BACKEND_DIR
    # Run any backend preparation scripts here
    cd ..
    
    success "Applications built successfully"
}

# Database setup
setup_database() {
    log "Setting up database..."
    
    cd $BACKEND_DIR
    
    # Run database setup scripts
    if [ -f "scripts/setupDatabase.js" ]; then
        log "Running database setup..."
        node scripts/setupDatabase.js || error "Database setup failed"
    fi
    
    # Run migrations
    if [ -f "migrations/runMigration.js" ]; then
        log "Running database migrations..."
        node migrations/runMigration.js || error "Database migration failed"
    fi
    
    # Setup indexes
    if [ -f "scripts/setupIndexes.js" ]; then
        log "Setting up database indexes..."
        node scripts/setupIndexes.js || error "Index setup failed"
    fi
    
    cd ..
    
    success "Database setup completed"
}

# Deploy applications
deploy_applications() {
    log "Deploying applications..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        deploy_production
    else
        deploy_development
    fi
    
    success "Applications deployed successfully"
}

# Production deployment
deploy_production() {
    log "Deploying to production..."
    
    # Stop existing processes
    pm2 stop attendance-backend || true
    
    # Start backend with PM2
    cd $BACKEND_DIR
    pm2 start ecosystem.config.js --env production || error "Failed to start backend with PM2"
    cd ..
    
    # Serve frontend with a web server (nginx configuration should be set up separately)
    log "Frontend built files are ready in $FRONTEND_DIR/build/"
    log "Please configure your web server to serve these files"
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
}

# Development deployment
deploy_development() {
    log "Starting development servers..."
    
    # Start backend in development mode
    cd $BACKEND_DIR
    npm start &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend in development mode
    cd $FRONTEND_DIR
    npm start &
    FRONTEND_PID=$!
    cd ..
    
    log "Backend started with PID: $BACKEND_PID"
    log "Frontend started with PID: $FRONTEND_PID"
    log "Development servers are running..."
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:5000/api/health &> /dev/null; then
        success "Backend health check passed"
    else
        warning "Backend health check failed"
    fi
    
    # Check if frontend is accessible (in production, this would be the web server)
    if [ "$ENVIRONMENT" = "development" ]; then
        if curl -f http://localhost:3000 &> /dev/null; then
            success "Frontend health check passed"
        else
            warning "Frontend health check failed"
        fi
    fi
}

# Cleanup
cleanup() {
    log "Cleaning up temporary files..."
    
    # Remove temporary files
    rm -rf temp/
    rm -rf *.tmp
    
    # Clean npm cache
    npm cache clean --force &> /dev/null || true
    
    success "Cleanup completed"
}

# Main deployment process
main() {
    log "Starting deployment process for environment: $ENVIRONMENT"
    
    # Create log file
    touch $LOG_FILE
    
    # Run deployment steps
    check_prerequisites
    setup_environment
    install_dependencies
    
    # Skip tests in production for faster deployment (run them in CI/CD)
    if [ "$ENVIRONMENT" != "production" ]; then
        run_tests
    fi
    
    build_applications
    setup_database
    deploy_applications
    health_check
    cleanup
    
    success "Deployment completed successfully!"
    log "Check the application at:"
    log "  Backend: http://localhost:5000"
    if [ "$ENVIRONMENT" = "development" ]; then
        log "  Frontend: http://localhost:3000"
    else
        log "  Frontend: Configure your web server to serve $FRONTEND_DIR/build/"
    fi
}

# Handle script interruption
trap 'error "Deployment interrupted"' INT TERM

# Run main function
main "$@"