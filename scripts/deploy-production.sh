#!/bin/bash

# AI IDE Production Deployment Script
set -e

echo "🚀 Deploying AI IDE to Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if production environment is configured
check_production_config() {
    print_status "Checking production configuration..."

    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found!"
        exit 1
    fi

    # Check for placeholder values
    if grep -q "PLACEHOLDER\|REPLACE_WITH" .env.production; then
        print_error "Found placeholder values in .env.production. Please update all values!"
        print_warning "Update these fields:"
        grep "PLACEHOLDER\|REPLACE_WITH" .env.production
        exit 1
    fi

    print_success "Production configuration validated"
}

# Build and deploy with Docker
deploy_with_docker() {
    print_status "Building and deploying with Docker..."

    # Stop existing containers
    docker-compose down 2>/dev/null || true

    # Build and start services
    docker-compose --env-file .env.production up --build -d

    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30

    # Check health
    if docker-compose ps | grep -q "Up (healthy)"; then
        print_success "Services are running and healthy!"
    else
        print_error "Some services are not healthy. Check logs:"
        docker-compose logs
        exit 1
    fi
}

# Deploy to cloud provider
deploy_to_cloud() {
    print_status "Cloud deployment options:"
    echo "1. Deploy to AWS ECS"
    echo "2. Deploy to Google Cloud Run"
    echo "3. Deploy to DigitalOcean App Platform"
    echo "4. Deploy to Vercel (Frontend only)"
    echo "5. Skip cloud deployment"

    read -p "Choose deployment option (1-5): " choice

    case $choice in
        1) deploy_to_aws;;
        2) deploy_to_gcp;;
        3) deploy_to_digitalocean;;
        4) deploy_to_vercel;;
        5) print_warning "Skipping cloud deployment";;
        *) print_warning "Invalid choice, skipping cloud deployment";;
    esac
}

deploy_to_aws() {
    print_status "Deploying to AWS ECS..."
    print_warning "AWS deployment requires:"
    echo "1. AWS CLI configured with credentials"
    echo "2. ECS cluster and task definitions set up"
    echo "3. ECR repositories created"
    print_warning "Please refer to AWS ECS documentation for setup"
}

deploy_to_vercel() {
    print_status "Deploying frontend to Vercel..."

    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi

    # Build for production
    npm run build

    # Deploy to Vercel
    vercel --prod

    print_success "Frontend deployed to Vercel!"
    print_warning "Don't forget to:"
    echo "1. Configure environment variables in Vercel dashboard"
    echo "2. Set up custom domain"
    echo "3. Deploy API separately (Vercel Functions or other service)"
}

# SSL certificate setup
setup_ssl() {
    print_status "SSL Certificate options:"
    echo "1. Use Let's Encrypt (certbot)"
    echo "2. Use custom certificates"
    echo "3. Skip SSL setup"

    read -p "Choose SSL option (1-3): " ssl_choice

    case $ssl_choice in
        1) setup_letsencrypt;;
        2) print_warning "Place your SSL certificates in ./ssl/ directory";;
        3) print_warning "Skipping SSL setup - HTTP only";;
    esac
}

setup_letsencrypt() {
    print_status "Setting up Let's Encrypt SSL..."

    if ! command -v certbot &> /dev/null; then
        print_error "Certbot not found. Please install certbot first"
        return
    fi

    read -p "Enter your domain name: " domain

    # Generate certificate
    certbot certonly --standalone -d $domain

    # Copy certificates
    mkdir -p ssl
    cp /etc/letsencrypt/live/$domain/fullchain.pem ssl/cert.pem
    cp /etc/letsencrypt/live/$domain/privkey.pem ssl/key.pem

    print_success "SSL certificates configured!"
}

# Database migration
run_database_migrations() {
    print_status "Running database migrations..."

    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        supabase migration up --environment production
        print_success "Database migrations completed"
    else
        print_warning "Supabase CLI not found. Run migrations manually:"
        echo "1. Access your Supabase dashboard"
        echo "2. Go to SQL Editor"
        echo "3. Run migration files in order:"
        ls -1 supabase/migrations/*.sql | sort
    fi
}

# Post-deployment checks
post_deployment_checks() {
    print_status "Running post-deployment checks..."

    # Check if services are responding
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_success "API health check passed"
    else
        print_warning "API health check failed"
    fi

    if curl -f http://localhost > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend is not accessible"
    fi

    # Check Stripe webhook
    print_warning "Don't forget to:"
    echo "1. Update Stripe webhook endpoint to your production domain"
    echo "2. Test payment flow end-to-end"
    echo "3. Monitor error logs and performance metrics"
    echo "4. Set up database backups"
    echo "5. Configure monitoring alerts"
}

# Main deployment flow
main() {
    echo "=================================="
    echo "   AI IDE Production Deployment"
    echo "=================================="

    check_production_config

    # Ask deployment method
    echo "Choose deployment method:"
    echo "1. Docker Compose (Local/VPS)"
    echo "2. Cloud Platform"
    echo "3. Manual deployment"

    read -p "Choose option (1-3): " deploy_method

    case $deploy_method in
        1)
            setup_ssl
            deploy_with_docker
            ;;
        2)
            deploy_to_cloud
            ;;
        3)
            print_warning "Manual deployment selected"
            print_status "Steps for manual deployment:"
            echo "1. Build: npm run build"
            echo "2. Deploy built files to web server"
            echo "3. Set up API server with Node.js"
            echo "4. Configure reverse proxy (Nginx/Apache)"
            echo "5. Set up SSL certificates"
            ;;
    esac

    run_database_migrations
    post_deployment_checks

    print_success "🎉 Deployment completed!"
    echo ""
    print_status "Your AI IDE is now running in production!"
}

main "$@"