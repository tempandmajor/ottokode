#!/usr/bin/env node

/**
 * Enterprise Platform Test Setup Script
 * Run this script to set up test data and validate the enterprise features
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function testDatabaseConnection() {
  logInfo('Testing database connection...');

  try {
    // This would need to be adapted based on your actual Supabase setup
    const { supabase } = await import('../src/lib/supabase.js');

    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (error) {
      throw error;
    }

    logSuccess('Database connection successful');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function checkRequiredTables() {
  logInfo('Checking required database tables...');

  const requiredTables = [
    'organizations',
    'organization_members',
    'teams',
    'team_members',
    'projects',
    'project_collaborators',
    'invitations',
    'organization_subscriptions',
    'audit_logs'
  ];

  try {
    const { supabase } = await import('../src/lib/supabase.js');

    for (const table of requiredTables) {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        logError(`Table '${table}' not found or accessible`);
        return false;
      }
    }

    logSuccess('All required tables found');
    return true;
  } catch (error) {
    logError(`Table check failed: ${error.message}`);
    return false;
  }
}

async function createTestOrganization() {
  logInfo('Creating test organization...');

  try {
    const { organizationService } = await import('../src/services/organizations/OrganizationService.js');

    const testOrg = await organizationService.createOrganization({
      name: 'Test Enterprise Org',
      slug: 'test-enterprise-' + Date.now(),
      description: 'Automated test organization for enterprise features',
      industry: 'Technology',
      size_category: 'medium',
      subscription_plan: 'team',
      billing_email: 'test@example.com'
    });

    logSuccess(`Test organization created: ${testOrg.name} (ID: ${testOrg.id})`);
    return testOrg;
  } catch (error) {
    logError(`Failed to create test organization: ${error.message}`);
    return null;
  }
}

async function testSubscriptionPlans() {
  logInfo('Testing subscription plans...');

  try {
    const { enterpriseSubscriptionService } = await import('../src/services/billing/EnterpriseSubscriptionService.js');

    const plans = await enterpriseSubscriptionService.getAvailablePlans();

    if (plans.length === 0) {
      logError('No subscription plans found');
      return false;
    }

    logSuccess(`Found ${plans.length} subscription plans:`);
    plans.forEach(plan => {
      log(`  - ${plan.name}: $${plan.monthly_price}/month (${plan.max_members} members)`, colors.blue);
    });

    return true;
  } catch (error) {
    logError(`Subscription plans test failed: ${error.message}`);
    return false;
  }
}

async function testInvitationSystem(organizationId) {
  logInfo('Testing invitation system...');

  try {
    const { invitationService } = await import('../src/services/invitations/InvitationService.js');

    // Test single invitation
    const invitations = await invitationService.sendOrganizationInvitation({
      organization_id: organizationId,
      emails: ['testuser@example.com'],
      role: 'member',
      message: 'Test invitation'
    });

    if (invitations.length === 0) {
      logError('Failed to create test invitation');
      return false;
    }

    logSuccess(`Test invitation sent to: ${invitations[0].email}`);

    // Test bulk invitations
    const bulkInvitations = await invitationService.sendBulkInvitations({
      organization_id: organizationId,
      invitations: [
        { email: 'bulk1@example.com', role: 'member' },
        { email: 'bulk2@example.com', role: 'admin' }
      ]
    });

    logSuccess(`Bulk invitations sent: ${bulkInvitations.length} invitations`);
    return true;
  } catch (error) {
    logError(`Invitation system test failed: ${error.message}`);
    return false;
  }
}

async function testCollaborationFeatures(organizationId) {
  logInfo('Testing collaboration features...');

  try {
    const { collaborationService } = await import('../src/services/collaboration/CollaborationService.js');

    const project = await collaborationService.createProject({
      name: 'Test Collaboration Project',
      description: 'Testing collaboration features',
      organization_id: organizationId,
      visibility: 'internal'
    });

    logSuccess(`Test project created: ${project.name} (ID: ${project.id})`);

    // Test file versioning (mock)
    logInfo('File versioning system would be tested here...');

    return true;
  } catch (error) {
    logError(`Collaboration features test failed: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  logInfo('Running enterprise platform diagnostics...');

  const results = {
    database: false,
    tables: false,
    organization: null,
    subscriptions: false,
    invitations: false,
    collaboration: false
  };

  // Test database connection
  results.database = await testDatabaseConnection();
  if (!results.database) {
    logError('Database connection failed. Please check your Supabase configuration.');
    return results;
  }

  // Check required tables
  results.tables = await checkRequiredTables();
  if (!results.tables) {
    logError('Required tables missing. Please run database migrations.');
    return results;
  }

  // Test subscription plans
  results.subscriptions = await testSubscriptionPlans();

  // Create test organization
  results.organization = await createTestOrganization();
  if (!results.organization) {
    logError('Failed to create test organization. Check authentication and permissions.');
    return results;
  }

  // Test invitation system
  results.invitations = await testInvitationSystem(results.organization.id);

  // Test collaboration features
  results.collaboration = await testCollaborationFeatures(results.organization.id);

  return results;
}

async function generateTestReport(results) {
  log('\n' + '='.repeat(50), colors.bold);
  log('ENTERPRISE PLATFORM TEST REPORT', colors.bold);
  log('='.repeat(50), colors.bold);

  const tests = [
    { name: 'Database Connection', passed: results.database },
    { name: 'Required Tables', passed: results.tables },
    { name: 'Subscription Plans', passed: results.subscriptions },
    { name: 'Organization Creation', passed: !!results.organization },
    { name: 'Invitation System', passed: results.invitations },
    { name: 'Collaboration Features', passed: results.collaboration }
  ];

  let passedCount = 0;
  tests.forEach(test => {
    if (test.passed) {
      logSuccess(test.name);
      passedCount++;
    } else {
      logError(test.name);
    }
  });

  log('\n' + '-'.repeat(50), colors.bold);
  log(`SUMMARY: ${passedCount}/${tests.length} tests passed`,
      passedCount === tests.length ? colors.green : colors.yellow);

  if (passedCount === tests.length) {
    log('\n🎉 Your enterprise platform is ready for testing!', colors.green + colors.bold);
    log('\nNext steps:', colors.blue);
    log('1. Run the UI components in your development environment');
    log('2. Test user workflows manually');
    log('3. Run the automated test suite with: npm test');
    log('4. Set up monitoring and analytics');
  } else {
    log('\n🔧 Some issues need to be resolved before your platform is ready.', colors.yellow);
    log('\nTroubleshooting:', colors.blue);
    log('1. Check your .env file for correct Supabase credentials');
    log('2. Ensure all database migrations have been applied');
    log('3. Verify user authentication is working');
    log('4. Check browser console for additional error details');
  }

  if (results.organization) {
    log('\n📋 Test Data Created:', colors.blue);
    log(`Organization ID: ${results.organization.id}`);
    log('You can use this ID to test the OrganizationDashboard component');
    log('Remember to clean up test data when done!');
  }
}

async function cleanupTestData() {
  logInfo('Cleaning up test data...');

  try {
    // This would implement cleanup logic
    // For now, just log the information
    logWarning('Manual cleanup required:');
    log('1. Delete test organizations from Supabase dashboard');
    log('2. Remove test invitations');
    log('3. Clear test projects and teams');
  } catch (error) {
    logError(`Cleanup failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  log('🚀 Enterprise Platform Test Setup', colors.bold + colors.blue);
  log('This script will validate your enterprise features setup\n');

  try {
    const results = await runDiagnostics();
    await generateTestReport(results);

    // Ask if user wants to cleanup test data
    if (results.organization) {
      log('\n❓ Clean up test data? (You may want to keep it for manual testing)');
      // In a real implementation, you might prompt the user here
    }

  } catch (error) {
    logError(`Test setup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runDiagnostics, generateTestReport };