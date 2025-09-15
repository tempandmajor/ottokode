import React, { useState, useEffect } from 'react';
import { hybridAIService, UserCredits } from '../services/ai/HybridAIService';
import { authService } from '../services/auth/AuthService';
import { supabase } from '../lib/supabase';
import { stripePaymentService, PaymentPlan } from '../services/payment/StripePaymentService';
import './BillingDashboard.css';

interface BillingDashboardProps {
  onClose: () => void;
}


interface CreditTransaction {
  id: string;
  transaction_type: string;
  amount: number;
  credits_amount: number;
  description: string;
  created_at: string;
  ai_provider?: string;
  ai_model?: string;
  tokens_used?: number;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ onClose }) => {
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<PaymentPlan[]>([]);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'credits' | 'plans' | 'history'>('credits');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserCredits(),
        loadSubscriptionPlans(),
        loadCreditTransactions()
      ]);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserCredits = async () => {
    await hybridAIService.loadUserCredits();
    const credits = hybridAIService.getUserCredits();
    setUserCredits(credits);
  };

  const loadSubscriptionPlans = async () => {
    try {
      const plans = await stripePaymentService.getPaymentPlans();
      setSubscriptionPlans(plans);
    } catch (error) {
      console.error('Failed to load subscription plans:', error);
    }
  };

  const loadCreditTransactions = async () => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      const { data: transactions, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', authState.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCreditTransactions(transactions || []);
    } catch (error) {
      console.error('Failed to load credit transactions:', error);
    }
  };

  const purchaseCredits = async (planId: string) => {
    const authState = authService.getAuthState();
    if (!authState.isAuthenticated || !authState.user) {
      alert('Please sign in to purchase credits');
      return;
    }

    const plan = subscriptionPlans.find(p => p.id === planId);
    if (!plan) return;

    setIsProcessing(true);
    try {
      // Create Stripe checkout session
      const { url, error } = await stripePaymentService.createCheckoutSession(
        plan.stripe_price_id,
        plan.id
      );

      if (error) {
        throw new Error(error);
      }

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (isLoading) {
    return (
      <div className="billing-dashboard">
        <div className="billing-header">
          <h2>💳 Billing & Credits</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-dashboard">
      <div className="billing-header">
        <h2>💳 Billing & Credits</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="billing-tabs">
        <button
          className={`tab ${activeTab === 'credits' ? 'active' : ''}`}
          onClick={() => setActiveTab('credits')}
        >
          💰 Credits
        </button>
        <button
          className={`tab ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          📦 Plans
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 History
        </button>
      </div>

      <div className="billing-content">
        {activeTab === 'credits' && (
          <div className="credits-overview">
            {userCredits ? (
              <>
                <div className="credits-summary">
                  <div className="credit-card">
                    <h3>💰 Available Credits</h3>
                    <div className="credit-amount">${userCredits.available_credits.toFixed(2)}</div>
                  </div>

                  <div className="credit-card">
                    <h3>📊 Total Used</h3>
                    <div className="credit-amount used">${userCredits.used_credits.toFixed(2)}</div>
                  </div>

                  <div className="credit-card">
                    <h3>🎯 Total Purchased</h3>
                    <div className="credit-amount">${userCredits.total_credits.toFixed(2)}</div>
                  </div>
                </div>

                <div className="credits-info">
                  <h3>How Credits Work</h3>
                  <ul>
                    <li>💬 Credits are used for AI model interactions through our platform</li>
                    <li>🔄 Different models have different costs per token</li>
                    <li>⚡ Credits never expire and roll over indefinitely</li>
                    <li>🔑 You can always switch to using your own API keys for free</li>
                    <li>📈 Monitor usage in real-time with our cost tracking</li>
                  </ul>

                  {userCredits.available_credits <= 5 && (
                    <div className="low-credits-warning">
                      ⚠️ Low credits! Consider purchasing more or switch to your own API keys.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="no-credits">
                <h3>Welcome to Platform Credits!</h3>
                <p>Get started with AI models without setting up your own API keys.</p>
                <button
                  onClick={() => setActiveTab('plans')}
                  className="get-started-btn"
                >
                  View Plans
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="subscription-plans">
            <h3>Choose Your Plan</h3>
            <p className="plans-description">
              Purchase credits to use our platform AI models. No monthly commitments - credits never expire!
            </p>

            <div className="plans-grid">
              {subscriptionPlans.map(plan => (
                <div key={plan.id} className={`plan-card ${plan.is_popular ? 'popular' : ''}`}>
                  {plan.is_popular && <div className="popular-badge">Most Popular</div>}

                  <h4>{plan.name}</h4>
                  <p className="plan-description">{plan.description}</p>

                  <div className="plan-price">
                    <span className="price">{formatCurrency(plan.price)}</span>
                    <span className="credits">{plan.credits} credits</span>
                  </div>

                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <button
                    onClick={() => purchaseCredits(plan.id)}
                    disabled={isProcessing}
                    className="purchase-btn"
                  >
                    {isProcessing ? 'Processing...' : `Purchase ${plan.credits} Credits`}
                  </button>
                </div>
              ))}
            </div>

            <div className="payment-info">
              <h4>💳 Payment Information</h4>
              <p>• All purchases are processed securely</p>
              <p>• Credits are added instantly to your account</p>
              <p>• No recurring charges - pay as you go</p>
              <p>• Full refund available within 7 days</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="transaction-history">
            <h3>Transaction History</h3>

            {creditTransactions.length === 0 ? (
              <div className="no-transactions">
                <p>No transactions yet. Purchase credits to get started!</p>
              </div>
            ) : (
              <div className="transactions-list">
                {creditTransactions.map(transaction => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-type">
                        {transaction.transaction_type === 'purchase' ? '💳' :
                         transaction.transaction_type === 'usage' ? '🤖' : '📊'}
                        <span>{transaction.description}</span>
                      </div>

                      <div className="transaction-details">
                        <span className="date">{formatDate(transaction.created_at)}</span>
                        {transaction.ai_provider && (
                          <span className="provider">{transaction.ai_provider}/{transaction.ai_model}</span>
                        )}
                        {transaction.tokens_used && (
                          <span className="tokens">{transaction.tokens_used.toLocaleString()} tokens</span>
                        )}
                      </div>
                    </div>

                    <div className={`transaction-amount ${transaction.credits_amount > 0 ? 'positive' : 'negative'}`}>
                      {transaction.credits_amount > 0 ? '+' : ''}${Math.abs(transaction.credits_amount).toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};