import React, { useState, useEffect } from 'react';
import {
  Check,
  Crown,
  Users,
  Zap,
  Shield,
  BarChart3,
  HeadphonesIcon,
  Sparkles,
  Building,
  Globe,
  Lock,
  Phone
} from 'lucide-react';
import { enterpriseSubscriptionService, PricingTier } from '../../services/billing/EnterpriseSubscriptionService';
import { authService } from '../../services/auth/AuthService';
import { organizationService } from '../../services/organizations/OrganizationService';

interface PricingPageProps {
  onSelectPlan?: (planId: string, billing: 'monthly' | 'annual') => void;
  currentPlan?: string;
  organizationId?: string;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSelectPlan,
  currentPlan,
  organizationId
}) => {
  const [plans, setPlans] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [estimatedCosts, setEstimatedCosts] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    loadPricingPlans();
    if (organizationId) {
      loadEstimatedCosts();
    }
  }, [organizationId]);

  const loadPricingPlans = async () => {
    try {
      const plansData = await enterpriseSubscriptionService.getAvailablePlans();
      setPlans(plansData.filter(plan => plan.id !== 'enterprise_custom'));
      setLoading(false);
    } catch (error) {
      console.error('Error loading pricing plans:', error);
      setLoading(false);
    }
  };

  const loadEstimatedCosts = async () => {
    if (!organizationId) return;

    try {
      const costs: { [key: string]: any } = {};
      for (const plan of plans) {
        costs[plan.id] = await enterpriseSubscriptionService.estimateCost(
          organizationId,
          plan.id
        );
      }
      setEstimatedCosts(costs);
    } catch (error) {
      console.error('Error loading estimated costs:', error);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    if (onSelectPlan) {
      onSelectPlan(planId, billingCycle);
    }
  };

  const formatPrice = (plan: PricingTier) => {
    const price = billingCycle === 'annual' ? plan.annual_price / 12 : plan.monthly_price;
    return price.toFixed(0);
  };

  const getYearlySavings = (plan: PricingTier) => {
    const monthlyCost = plan.monthly_price * 12;
    const annualCost = plan.annual_price;
    const savings = ((monthlyCost - annualCost) / monthlyCost * 100);
    return savings.toFixed(0);
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'team': return <Users className="w-8 h-8" />;
      case 'enterprise': return <Building className="w-8 h-8" />;
      default: return <Zap className="w-8 h-8" />;
    }
  };

  const isCurrentPlan = (planId: string) => currentPlan === planId;
  const isPopularPlan = (planId: string) => planId === 'team_pro' || planId === 'enterprise_premium';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Choose Your Plan
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Scale your team collaboration with plans designed for every organization
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 flex items-center justify-center">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              <span className="ml-1 text-green-600 font-semibold">Save up to 17%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {plans.map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            billingCycle={billingCycle}
            isPopular={isPopularPlan(plan.id)}
            isCurrent={isCurrentPlan(plan.id)}
            estimatedCost={estimatedCosts[plan.id]}
            onSelect={() => handleSelectPlan(plan.id)}
            formatPrice={formatPrice}
            getYearlySavings={getYearlySavings}
            getPlanIcon={getPlanIcon}
          />
        ))}
      </div>

      {/* Enterprise Custom */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center mb-4">
              <Crown className="w-8 h-8 text-yellow-400 mr-3" />
              <h3 className="text-2xl font-bold">Enterprise Custom</h3>
            </div>

            <p className="text-gray-300 mb-6">
              Need something more? We'll build a custom solution that fits your exact requirements.
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Unlimited team members
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Custom AI models
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                On-premise deployment
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Dedicated support team
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                Custom integrations
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-400 mr-2" />
                White-label solution
              </div>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <p className="text-4xl font-bold mb-2">Custom</p>
            <p className="text-gray-300 mb-6">Pricing tailored to your needs</p>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <button className="flex items-center justify-center px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                <Phone className="w-4 h-4 mr-2" />
                Schedule a Call
              </button>
              <button className="flex items-center justify-center px-6 py-3 border border-white text-white rounded-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Comparison */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Compare Features
        </h2>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                <FeatureRow
                  category="Team Management"
                  feature="Team Members"
                  values={plans.map(plan =>
                    plan.max_members === -1 ? 'Unlimited' : plan.max_members.toString()
                  )}
                />

                <FeatureRow
                  category="Collaboration"
                  feature="Real-time Editing"
                  values={plans.map(() => true)}
                />

                <FeatureRow
                  category="Collaboration"
                  feature="Advanced Workflows"
                  values={[false, true, true, true]}
                />

                <FeatureRow
                  category="Security"
                  feature="SSO Integration"
                  values={[false, false, true, true]}
                />

                <FeatureRow
                  category="Security"
                  feature="Advanced Compliance"
                  values={[false, false, true, true]}
                />

                <FeatureRow
                  category="Analytics"
                  feature="Usage Analytics"
                  values={plans.map(() => true)}
                />

                <FeatureRow
                  category="Analytics"
                  feature="Custom Dashboards"
                  values={[false, true, true, true]}
                />

                <FeatureRow
                  category="Support"
                  feature="Priority Support"
                  values={[false, true, true, true]}
                />

                <FeatureRow
                  category="Support"
                  feature="Dedicated Account Manager"
                  values={[false, false, false, true]}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>

        <div className="max-w-3xl mx-auto space-y-6">
          <FAQItem
            question="Can I change plans at any time?"
            answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
          />

          <FAQItem
            question="What happens if I exceed my usage limits?"
            answer="We'll notify you when you approach your limits. For AI requests, you'll be charged based on our markup pricing. For other resources, we'll work with you to adjust your plan."
          />

          <FAQItem
            question="Do you offer discounts for nonprofits or education?"
            answer="Yes, we offer special pricing for qualified nonprofit organizations and educational institutions. Contact our sales team for more information."
          />

          <FAQItem
            question="Is there a free trial?"
            answer="Yes, all plans come with a 14-day free trial. No credit card required to get started."
          />
        </div>
      </div>
    </div>
  );
};

interface PricingCardProps {
  plan: PricingTier;
  billingCycle: 'monthly' | 'annual';
  isPopular: boolean;
  isCurrent: boolean;
  estimatedCost?: any;
  onSelect: () => void;
  formatPrice: (plan: PricingTier) => string;
  getYearlySavings: (plan: PricingTier) => string;
  getPlanIcon: (planType: string) => React.ReactNode;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingCycle,
  isPopular,
  isCurrent,
  estimatedCost,
  onSelect,
  formatPrice,
  getYearlySavings,
  getPlanIcon
}) => {
  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 ${
      isPopular
        ? 'border-blue-500 ring-4 ring-blue-500 ring-opacity-20'
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6">
        {/* Plan Header */}
        <div className="text-center mb-6">
          <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
            plan.type === 'enterprise'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-blue-100 text-blue-600'
          }`}>
            {getPlanIcon(plan.type)}
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>

          <div className="mb-4">
            <span className="text-4xl font-bold text-gray-900">${formatPrice(plan)}</span>
            <span className="text-gray-600">/month</span>

            {billingCycle === 'annual' && (
              <div className="text-sm text-green-600 font-medium">
                Save {getYearlySavings(plan)}% annually
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm mb-6">
            Perfect for {plan.type === 'enterprise' ? 'large organizations' : 'growing teams'}
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm">
            <Users className="w-4 h-4 text-blue-600 mr-3" />
            <span>
              {plan.max_members === -1 ? 'Unlimited' : `Up to ${plan.max_members}`} team members
            </span>
          </div>

          {plan.features.core.slice(0, 2).map((feature, index) => (
            <div key={index} className="flex items-center text-sm">
              <Check className="w-4 h-4 text-green-600 mr-3" />
              <span>{feature}</span>
            </div>
          ))}

          {plan.features.collaboration.length > 0 && (
            <div className="flex items-center text-sm">
              <Sparkles className="w-4 h-4 text-purple-600 mr-3" />
              <span>{plan.features.collaboration[0]}</span>
            </div>
          )}

          {plan.features.security.length > 0 && (
            <div className="flex items-center text-sm">
              <Shield className="w-4 h-4 text-red-600 mr-3" />
              <span>{plan.features.security[0]}</span>
            </div>
          )}

          {plan.features.support.length > 0 && (
            <div className="flex items-center text-sm">
              <HeadphonesIcon className="w-4 h-4 text-orange-600 mr-3" />
              <span>{plan.features.support[0]}</span>
            </div>
          )}

          <div className="text-xs text-gray-500 pt-2">
            {plan.markup_percentage}% markup on AI costs
          </div>
        </div>

        {/* Estimated Cost */}
        {estimatedCost && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="text-xs text-gray-600 mb-1">Estimated monthly total:</div>
            <div className="text-lg font-semibold text-gray-900">
              ${estimatedCost.total_estimated.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Includes estimated AI usage
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onSelect}
          disabled={isCurrent}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            isCurrent
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : isPopular
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isCurrent ? 'Current Plan' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};

interface FeatureRowProps {
  category?: string;
  feature: string;
  values: (boolean | string)[];
}

const FeatureRow: React.FC<FeatureRowProps> = ({ category, feature, values }) => {
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {category && (
          <div className="text-xs text-gray-500 mb-1">{category}</div>
        )}
        {feature}
      </td>
      {values.map((value, index) => (
        <td key={index} className="px-6 py-4 whitespace-nowrap text-center">
          {typeof value === 'boolean' ? (
            value ? (
              <Check className="w-5 h-5 text-green-600 mx-auto" />
            ) : (
              <div className="w-5 h-5 mx-auto" />
            )
          ) : (
            <span className="text-sm text-gray-900">{value}</span>
          )}
        </td>
      ))}
    </tr>
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-900">{question}</span>
        <span className={`ml-2 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
};