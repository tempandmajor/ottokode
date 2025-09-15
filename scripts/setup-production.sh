#!/bin/bash

# AI IDE Production Setup Script
# This script sets up the production environment for the AI IDE

set -e

echo "🚀 Setting up AI IDE for Production..."

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

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi

    NODE_VERSION=$(node -v | sed 's/v//')
    REQUIRED_NODE_VERSION="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_NODE_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 18+."
        exit 1
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi

    # Check if Tauri CLI is installed
    if ! command -v cargo &> /dev/null; then
        print_error "Rust/Cargo is not installed. Please install Rust first."
        exit 1
    fi

    print_success "All requirements met!"
}

# Create environment file
setup_environment() {
    print_status "Setting up environment configuration..."

    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
            print_warning "Please update the .env file with your actual API keys and configuration"
        else
            print_error ".env.example file not found. Please create it manually."
            exit 1
        fi
    else
        print_warning ".env file already exists. Skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."

    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Build the application
build_application() {
    print_status "Building application..."

    # Build frontend
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi

    # Build Tauri app
    npm run tauri build
    if [ $? -eq 0 ]; then
        print_success "Tauri build completed"
    else
        print_error "Tauri build failed"
        exit 1
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."

    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_warning "Supabase environment variables not set. Skipping database setup."
        print_warning "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file"
        return
    fi

    print_status "Running database migrations..."

    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        supabase migration up
        print_success "Database migrations completed"
    else
        print_warning "Supabase CLI not found. Please run migrations manually:"
        print_warning "1. Install Supabase CLI: npm install -g supabase"
        print_warning "2. Login: supabase login"
        print_warning "3. Link project: supabase link --project-ref YOUR_PROJECT_REF"
        print_warning "4. Run migrations: supabase migration up"
    fi
}

# Setup Stripe webhooks
setup_stripe() {
    print_status "Setting up Stripe..."

    if [ -z "$STRIPE_SECRET_KEY" ]; then
        print_warning "Stripe environment variables not set. Skipping Stripe setup."
        print_warning "Please set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env file"
        return
    fi

    print_warning "Don't forget to:"
    print_warning "1. Configure Stripe webhook endpoint: https://your-domain.com/api/stripe-webhook"
    print_warning "2. Enable events: payment_intent.succeeded, payment_intent.payment_failed, checkout.session.completed"
    print_warning "3. Update STRIPE_WEBHOOK_SECRET in .env file"
}

# Security checklist
security_checklist() {
    print_status "Security checklist..."

    # Check for common security issues
    if grep -r "console.log" src/ --exclude-dir=node_modules > /dev/null 2>&1; then
        print_warning "Found console.log statements in source code. Consider removing them for production."
    fi

    if [ -f ".env" ]; then
        if grep -q "test\|example\|changeme\|password123" .env; then
            print_error "Found test/example values in .env file. Please update with production values."
        fi
    fi

    print_success "Basic security checks completed"

    print_warning "Additional security considerations:"
    print_warning "1. Ensure all API keys are properly set in production environment"
    print_warning "2. Review and update Content Security Policy headers"
    print_warning "3. Enable HTTPS in production"
    print_warning "4. Set up proper error monitoring (Sentry, etc.)"
    print_warning "5. Configure rate limiting"
    print_warning "6. Review database Row Level Security policies"
}

# Performance optimization
performance_optimization() {
    print_status "Performance optimization suggestions..."

    print_warning "For better performance in production:"
    print_warning "1. Enable gzip compression on your web server"
    print_warning "2. Set up CDN for static assets"
    print_warning "3. Configure database connection pooling"
    print_warning "4. Set up Redis for caching (if needed)"
    print_warning "5. Monitor application performance with tools like New Relic or DataDog"
}

# Main setup process
main() {
    echo "=================================="
    echo "   AI IDE Production Setup"
    echo "=================================="

    check_requirements
    setup_environment
    install_dependencies
    build_application
    setup_database
    setup_stripe
    security_checklist
    performance_optimization

    echo ""
    print_success "🎉 Production setup completed!"
    echo ""
    print_status "Next steps:"
    echo "1. Review and update .env file with production values"
    echo "2. Deploy the built application to your production environment"
    echo "3. Set up SSL certificates"
    echo "4. Configure your web server (Nginx, Apache, etc.)"
    echo "5. Set up monitoring and logging"
    echo "6. Test all functionality in production environment"
    echo ""
    print_status "Built files location:"
    echo "- Frontend: dist/"
    echo "- Desktop app: src-tauri/target/release/"
    echo ""
}

# Run main function
main "$@"