# Team/Enterprise Platform Testing Guide

## 🚀 **Quick Setup**

### **1. Database Setup**

```bash
# If using Supabase CLI (recommended)
supabase start
supabase db reset
supabase migration up

# Or apply migrations manually in Supabase Dashboard > SQL Editor
# Copy and paste each migration file in order: 01 → 02 → 03 → 04 → 05
```

### **2. Environment Variables**

Ensure your `.env` file includes:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧪 **Testing Scenarios**

### **Phase 1: Organization Management**

#### **Test 1.1: Create Organization**
```typescript
// In browser console or test file:
import { organizationService } from './src/services/organizations/OrganizationService';

// Create test organization
const testOrg = await organizationService.createOrganization({
  name: "Acme Corp",
  slug: "acme-corp",
  description: "Test organization for enterprise features",
  industry: "Technology",
  size_category: "medium",
  subscription_plan: "team",
  billing_email: "billing@acme.com"
});

console.log('Created organization:', testOrg);
```

#### **Test 1.2: Verify Database Records**
Check in Supabase Dashboard > Table Editor:
- `organizations` table should have your new org
- `organization_members` should have you as owner
- `organization_subscriptions` should have trial subscription

#### **Test 1.3: Member Management**
```typescript
// Invite members
await organizationService.inviteMember(testOrg.id, {
  email: "john@test.com",
  role: "admin",
  permissions: {
    manage_billing: true,
    manage_members: true,
    manage_projects: true,
    manage_settings: false,
    view_analytics: true,
    export_data: false
  }
});

// Check invitation was created
const invitations = await invitationService.getOrganizationInvitations(testOrg.id);
console.log('Pending invitations:', invitations);
```

### **Phase 2: Subscription & Billing**

#### **Test 2.1: View Available Plans**
```typescript
import { enterpriseSubscriptionService } from './src/services/billing/EnterpriseSubscriptionService';

const plans = await enterpriseSubscriptionService.getAvailablePlans();
console.log('Available plans:', plans);

// Should show 5 plans: team_starter, team_pro, enterprise_standard, enterprise_premium, enterprise_custom
```

#### **Test 2.2: Create Subscription**
```typescript
// Create subscription for organization
const subscription = await enterpriseSubscriptionService.createSubscription(
  testOrg.id,
  'team_pro' // or any plan ID
);

console.log('Created subscription:', subscription);
```

#### **Test 2.3: Usage Tracking**
```typescript
// Get billing usage
const usage = await enterpriseSubscriptionService.getBillingUsage(testOrg.id);
console.log('Billing usage:', usage);

// Get usage alerts
const alerts = await enterpriseSubscriptionService.getUsageAlerts(testOrg.id);
console.log('Usage alerts:', alerts);
```

### **Phase 3: Team Collaboration**

#### **Test 3.1: Create Team Project**
```typescript
import { collaborationService } from './src/services/collaboration/CollaborationService';

const project = await collaborationService.createProject({
  name: "Test Project",
  description: "Testing team collaboration features",
  organization_id: testOrg.id,
  visibility: "internal"
});

console.log('Created project:', project);
```

#### **Test 3.2: Add Collaborators**
```typescript
// Invite collaborator to project
await collaborationService.inviteCollaborator(
  project.id,
  "jane@test.com",
  "contributor"
);

// Get project collaborators
const collaborators = await collaborationService.getProjectCollaborators(project.id);
console.log('Project collaborators:', collaborators);
```

### **Phase 4: UI Component Testing**

#### **Test 4.1: Organization Dashboard**
```typescript
// In your React app, navigate to organization dashboard
// Component: OrganizationDashboard
// Props: { organizationId: testOrg.id }

// Verify displays:
// ✓ Organization name and logo
// ✓ Member count and roles
// ✓ Usage statistics
// ✓ Quick actions based on permissions
```

#### **Test 4.2: Pricing Page**
```typescript
// Component: PricingPage
// Props: { organizationId: testOrg.id }

// Verify displays:
// ✓ All 5 pricing tiers
// ✓ Monthly/annual toggle
// ✓ Feature comparison
// ✓ Cost estimation for current org
```

## 🔧 **Manual Testing Checklist**

### **Authentication & Permissions**

- [ ] **Owner Role**: Can manage all aspects of organization
- [ ] **Admin Role**: Can manage members and projects, cannot manage billing
- [ ] **Member Role**: Can create projects, cannot manage members
- [ ] **Guest Role**: Read-only access to assigned projects

### **Organization Management**

- [ ] Create organization with valid data
- [ ] Update organization settings
- [ ] View member list with correct roles
- [ ] Invite members via email
- [ ] Remove members from organization
- [ ] Create and manage teams

### **Subscription & Billing**

- [ ] View all pricing plans
- [ ] Create trial subscription
- [ ] Upgrade/downgrade subscription
- [ ] View usage analytics
- [ ] Receive usage alerts at 75% and 90%
- [ ] Generate cost estimates

### **Project Collaboration**

- [ ] Create team projects
- [ ] Invite project collaborators
- [ ] Real-time cursor tracking
- [ ] File versioning system
- [ ] Comments and discussions
- [ ] Project-level permissions

### **Enterprise Features**

- [ ] Audit logging for all actions
- [ ] SSO configuration (if implemented)
- [ ] IP whitelisting
- [ ] Data export capabilities
- [ ] Custom domain settings

## 🐛 **Common Issues & Solutions**

### **Database Issues**

**Problem**: Migration fails with permission errors
```bash
# Solution: Ensure you're using a Supabase project with proper permissions
# Check your connection string and try again
```

**Problem**: Tables not created
```bash
# Solution: Apply migrations in correct order
supabase migration up --db-url "your_connection_string"
```

### **Authentication Issues**

**Problem**: User not authenticated errors
```typescript
// Solution: Ensure user is signed in before testing org features
import { authService } from './src/services/auth/AuthService';
const user = authService.getCurrentUser();
console.log('Current user:', user);
```

**Problem**: Permission denied errors
```typescript
// Solution: Check user role in organization
const role = await organizationService.getUserRole(orgId);
console.log('User role:', role);
```

### **API Integration Issues**

**Problem**: Supabase connection errors
```typescript
// Solution: Verify environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

## 📊 **Performance Testing**

### **Load Testing Organization Features**

```typescript
// Test with multiple organizations
const createMultipleOrgs = async () => {
  const orgs = [];
  for (let i = 0; i < 10; i++) {
    const org = await organizationService.createOrganization({
      name: `Test Org ${i}`,
      slug: `test-org-${i}`,
      subscription_plan: 'team'
    });
    orgs.push(org);
  }
  return orgs;
};

// Measure performance
console.time('Create 10 organizations');
const orgs = await createMultipleOrgs();
console.timeEnd('Create 10 organizations');
```

### **Test Member Invitation Bulk Operations**

```typescript
// Test bulk invitations
const testBulkInvites = async (orgId) => {
  const emails = Array.from({ length: 50 }, (_, i) => `user${i}@test.com`);

  console.time('Bulk invite 50 users');
  const invitations = await invitationService.sendBulkInvitations({
    invitations: emails.map(email => ({
      email,
      role: 'member',
      permissions: organizationService.getDefaultPermissions('member')
    })),
    organization_id: orgId
  });
  console.timeEnd('Bulk invite 50 users');

  return invitations;
};
```

## 🎯 **Success Criteria**

Your platform is ready for enterprise customers when:

- [ ] **All database migrations apply successfully**
- [ ] **Organization CRUD operations work flawlessly**
- [ ] **Role-based permissions are enforced**
- [ ] **Billing calculations are accurate**
- [ ] **UI components render without errors**
- [ ] **Real-time collaboration functions properly**
- [ ] **Bulk operations complete within reasonable time**
- [ ] **Error handling provides clear feedback**

## 📈 **Next Steps After Testing**

1. **Security Audit**: Review all permission checks
2. **Performance Optimization**: Profile database queries
3. **Error Handling**: Implement comprehensive error boundaries
4. **Documentation**: Create user guides for each role
5. **Monitoring**: Set up analytics for usage tracking
6. **Payment Integration**: Connect Stripe for actual billing

## 🔗 **Integration Testing**

Test the complete user journey:

1. **Sign Up** → Create account
2. **Create Organization** → Set up team
3. **Invite Members** → Send email invitations
4. **Accept Invitations** → Join organization
5. **Create Projects** → Start collaboration
6. **Upgrade Plan** → Scale with growth
7. **Monitor Usage** → Track costs and limits

Each step should work seamlessly without manual intervention.