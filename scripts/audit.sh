#!/bin/bash

# 🔍 Comprehensive Project Audit Script
# Automatically checks dependencies, security, code quality, and build health

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Track issues found
ISSUES_FOUND=0
CRITICAL_ISSUES=0

# Function to increment issue counters
add_issue() {
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
    if [[ "$1" == "critical" ]]; then
        CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
    fi
}

echo "🔍 Starting comprehensive project audit..."
echo "=================================================="

# Phase 1: Dependencies & Security
echo ""
log_info "Phase 1: Dependencies & Security Audit"
echo "----------------------------------------"

# Root project dependencies
log_info "Checking root project dependencies..."
if npm audit --audit-level=moderate --silent; then
    log_success "Root dependencies: No vulnerabilities found"
else
    log_error "Root dependencies: Vulnerabilities detected"
    add_issue "critical"
fi

# Web app dependencies
log_info "Checking web-app dependencies..."
cd web-app
if npm audit --audit-level=moderate --silent; then
    log_success "Web-app dependencies: No vulnerabilities found"
else
    log_error "Web-app dependencies: Vulnerabilities detected"
    add_issue "critical"
fi
cd ..

# Check for outdated packages
log_info "Checking for outdated packages..."
OUTDATED=$(npm outdated --json 2>/dev/null || echo "{}")
if [[ "$OUTDATED" == "{}" ]]; then
    log_success "All packages are up to date"
else
    OUTDATED_COUNT=$(echo "$OUTDATED" | jq 'length' 2>/dev/null || echo "unknown")
    log_warning "Found $OUTDATED_COUNT outdated packages"
    add_issue
fi

# Check for unused dependencies
log_info "Checking for unused dependencies..."
if command -v depcheck >/dev/null 2>&1; then
    UNUSED=$(npx depcheck --json --skip-missing 2>/dev/null)
    UNUSED_DEPS=$(echo "$UNUSED" | jq '.dependencies | length' 2>/dev/null || echo "0")
    UNUSED_DEV=$(echo "$UNUSED" | jq '.devDependencies | length' 2>/dev/null || echo "0")

    if [[ "$UNUSED_DEPS" == "0" && "$UNUSED_DEV" == "0" ]]; then
        log_success "No unused dependencies found"
    else
        log_warning "Found $UNUSED_DEPS unused dependencies and $UNUSED_DEV unused dev dependencies"
        add_issue
    fi
else
    log_warning "depcheck not available, skipping unused dependency check"
fi

# Phase 2: Code Quality
echo ""
log_info "Phase 2: Code Quality Audit"
echo "----------------------------"

# TypeScript type checking
log_info "Running TypeScript type check..."
if npm run type-check >/dev/null 2>&1; then
    log_success "TypeScript: No type errors"
else
    log_error "TypeScript: Type errors found"
    add_issue
fi

# ESLint checking
log_info "Running ESLint analysis..."
if npm run lint >/dev/null 2>&1; then
    log_success "ESLint: No linting errors"
else
    log_error "ESLint: Linting errors found"
    add_issue
fi

# Phase 3: Build Health
echo ""
log_info "Phase 3: Build Health Check"
echo "----------------------------"

# Test build process
log_info "Testing build process..."
if npm run build >/dev/null 2>&1; then
    log_success "Build: Successful"
else
    log_error "Build: Failed"
    add_issue "critical"
fi

# Test web-app build
log_info "Testing web-app build..."
cd web-app
if npm run build >/dev/null 2>&1; then
    log_success "Web-app build: Successful"
else
    log_error "Web-app build: Failed"
    add_issue "critical"
fi
cd ..

# Phase 4: Rust/Tauri Checks (if available)
echo ""
log_info "Phase 4: Rust/Tauri Audit"
echo "--------------------------"

if [[ -d "src-tauri" ]]; then
    cd src-tauri

    # Rust clippy
    log_info "Running Rust clippy..."
    if cargo clippy --all-targets --all-features -- -D warnings >/dev/null 2>&1; then
        log_success "Rust clippy: No issues"
    else
        log_warning "Rust clippy: Issues found"
        add_issue
    fi

    # Rust security audit
    log_info "Running Rust security audit..."
    if command -v cargo-audit >/dev/null 2>&1; then
        if cargo audit >/dev/null 2>&1; then
            log_success "Rust security: No vulnerabilities"
        else
            log_error "Rust security: Vulnerabilities found"
            add_issue "critical"
        fi
    else
        log_warning "cargo-audit not installed, skipping Rust security check"
    fi

    cd ..
else
    log_warning "src-tauri directory not found, skipping Rust checks"
fi

# Summary Report
echo ""
echo "=================================================="
log_info "Audit Summary Report"
echo "=================================================="

if [[ $CRITICAL_ISSUES -eq 0 && $ISSUES_FOUND -eq 0 ]]; then
    log_success "🎉 No issues found! Project is in excellent health."
    exit 0
elif [[ $CRITICAL_ISSUES -eq 0 ]]; then
    log_warning "Found $ISSUES_FOUND non-critical issues"
    echo ""
    echo "Recommended actions:"
    echo "- Update outdated packages: npm update"
    echo "- Remove unused dependencies: npm uninstall <package>"
    echo "- Fix linting issues: npm run lint -- --fix"
    exit 0
else
    log_error "Found $ISSUES_FOUND total issues ($CRITICAL_ISSUES critical)"
    echo ""
    echo "CRITICAL issues require immediate attention:"
    echo "- Fix security vulnerabilities: npm audit fix"
    echo "- Resolve build failures: Check error logs"
    echo "- Address type errors: npm run type-check"
    exit 1
fi