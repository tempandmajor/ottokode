/**
 * Stripe Integration Assistant
 * Comprehensive guide for integrating Stripe payment processing
 */

import {
  ThirdPartyService,
  IntegrationGuide,
  DocCodeTemplate,
  ServicePattern,
  TroubleshootingGuide,
  AuthenticationMethod
} from '../types/documentation-guide';

export const stripeService: ThirdPartyService = {
  id: 'stripe',
  name: 'Stripe',
  description: 'Complete payment infrastructure for the internet',
  category: {
    id: 'payments',
    name: 'Payment Processing',
    description: 'Services for handling payments and subscriptions',
    icon: 'credit-card'
  },
  icon: 'credit-card',
  website: 'https://stripe.com',
  documentation: {
    quickStart: 'https://stripe.com/docs/quickstart',
    apiReference: 'https://stripe.com/docs/api',
    examples: 'https://stripe.com/docs/examples',
    sdks: [
      {
        language: 'JavaScript',
        packageName: '@stripe/stripe-js',
        installCommand: 'npm install @stripe/stripe-js',
        quickStartCode: `import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');`
      },
      {
        language: 'Node.js',
        packageName: 'stripe',
        installCommand: 'npm install stripe',
        quickStartCode: `const stripe = require('stripe')('sk_test_...');`
      },
      {
        language: 'React Native',
        packageName: '@stripe/stripe-react-native',
        installCommand: 'npm install @stripe/stripe-react-native',
        quickStartCode: `import { StripeProvider } from '@stripe/stripe-react-native';`
      },
      {
        language: 'iOS (Swift)',
        packageName: 'StripePaymentSheet',
        installCommand: 'pod "StripePaymentSheet"',
        quickStartCode: `import StripePaymentSheet`
      },
      {
        language: 'Android (Kotlin)',
        packageName: 'com.stripe:stripe-android',
        installCommand: 'implementation "com.stripe:stripe-android:20.+"',
        quickStartCode: `import com.stripe.android.PaymentConfiguration`
      }
    ],
    authentication: [
      {
        type: 'api_key',
        description: 'Use publishable and secret keys for secure authentication',
        setupSteps: [
          'Sign up for a Stripe account',
          'Navigate to the API keys section in Dashboard',
          'Copy your publishable key for client-side code',
          'Copy your secret key for server-side code (keep secure)',
          'Use test keys during development'
        ],
        exampleCode: `// Client-side (safe to expose)
const publishableKey = 'pk_test_51H7...';

// Server-side (keep secret!)
const secretKey = process.env.STRIPE_SECRET_KEY;`
      }
    ]
  },
  integrationGuides: [
    {
      id: 'stripe-payment-intent',
      title: 'Accept a Payment with Payment Intents',
      description: 'The most common integration - accept one-time payments',
      platform: ['web', 'mobile', 'api'],
      difficulty: 'beginner',
      estimatedTime: '30 minutes',
      prerequisites: [
        'Stripe account with API keys',
        'Basic knowledge of JavaScript/Node.js',
        'Understanding of client-server architecture'
      ],
      steps: [
        {
          id: 'step-1',
          title: 'Install Stripe libraries',
          description: 'Add Stripe to your client and server projects',
          code: `# Client-side
npm install @stripe/stripe-js

# Server-side
npm install stripe`,
          notes: ['Use the appropriate SDK for your platform']
        },
        {
          id: 'step-2',
          title: 'Initialize Stripe on the server',
          description: 'Set up Stripe with your secret key',
          code: `const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);`,
          validation: 'Ensure your secret key starts with sk_test_ or sk_live_'
        },
        {
          id: 'step-3',
          title: 'Create a Payment Intent',
          description: 'Generate a payment intent on your server',
          code: `app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency,
      metadata: {
        order_id: 'order_123'
      }
    });

    res.send({
      client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});`,
          notes: [
            'Amount should be in cents (multiply by 100)',
            'Always handle errors appropriately',
            'Use metadata to track orders'
          ]
        },
        {
          id: 'step-4',
          title: 'Initialize Stripe on the client',
          description: 'Set up Stripe Elements for payment collection',
          code: `import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');
const elements = stripe.elements();

const cardElement = elements.create('card');
cardElement.mount('#card-element');`,
          validation: 'Ensure the card element mounts successfully'
        },
        {
          id: 'step-5',
          title: 'Handle payment submission',
          description: 'Process the payment when user submits',
          code: `const handleSubmit = async (event) => {
  event.preventDefault();

  const { error } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: 'Customer Name',
        email: 'customer@example.com'
      }
    }
  });

  if (error) {
    console.error('Payment failed:', error);
    showError(error.message);
  } else {
    console.log('Payment succeeded!');
    showSuccess('Payment completed successfully');
  }
};`,
          notes: [
            'Always provide billing details when possible',
            'Handle both success and error cases',
            'Provide clear feedback to users'
          ]
        }
      ],
      codeTemplates: [
        {
          id: 'payment-intent-server',
          name: 'Payment Intent Server Route',
          description: 'Express.js route for creating payment intents',
          language: 'javascript',
          framework: 'express',
          template: `app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', description } = req.body;

    // Validate amount
    if (!amount || amount < 50) {
      return res.status(400).send({
        error: 'Amount must be at least $0.50'
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        {{#if orderId}}
        order_id: '{{orderId}}'
        {{/if}}
      }
    });

    res.send({
      client_secret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Payment Intent creation failed:', error);
    res.status(400).send({ error: error.message });
  }
});`,
          variables: [
            {
              name: 'orderId',
              description: 'Optional order ID for tracking',
              type: 'string',
              required: false,
              defaultValue: ''
            }
          ]
        }
      ],
      testing: {
        setup: [
          'Use Stripe test mode with test API keys',
          'Use test card numbers provided by Stripe',
          'Test various scenarios (success, failure, 3D Secure)'
        ],
        testCases: [
          {
            scenario: 'Successful payment with test card',
            expectedResult: 'Payment completes and returns success',
            code: '4242424242424242' // Test card number
          },
          {
            scenario: 'Declined payment',
            expectedResult: 'Payment fails with appropriate error message',
            code: '4000000000000002' // Declined test card
          },
          {
            scenario: '3D Secure authentication',
            expectedResult: 'User prompted for authentication, then payment completes',
            code: '4000000000003220' // 3D Secure test card
          }
        ],
        debugging: [
          {
            issue: 'Payment fails with "Invalid API key"',
            solution: 'Verify you\'re using the correct API keys for your environment',
            prevention: 'Use environment variables and validate keys on startup'
          },
          {
            issue: 'CORS errors when calling API',
            solution: 'Configure CORS headers on your server',
            prevention: 'Set up CORS properly from the beginning'
          }
        ]
      }
    },
    {
      id: 'stripe-subscriptions',
      title: 'Subscription Billing',
      description: 'Set up recurring subscription payments',
      platform: ['web', 'mobile', 'api'],
      difficulty: 'intermediate',
      estimatedTime: '60 minutes',
      prerequisites: [
        'Completed Payment Intents integration',
        'Understanding of subscription business models',
        'Database to store customer and subscription data'
      ],
      steps: [
        {
          id: 'sub-step-1',
          title: 'Create Products and Prices',
          description: 'Define your subscription plans in Stripe',
          code: `// Create a product
const product = await stripe.products.create({
  name: 'Premium Plan',
  description: 'Access to premium features'
});

// Create a price for the product
const price = await stripe.prices.create({
  unit_amount: 999, // $9.99
  currency: 'usd',
  recurring: {
    interval: 'month'
  },
  product: product.id
});`,
          notes: ['Products represent what you\'re selling', 'Prices define the cost and billing cycle']
        },
        {
          id: 'sub-step-2',
          title: 'Create a Customer',
          description: 'Create a customer record for subscription management',
          code: `const customer = await stripe.customers.create({
  email: 'customer@example.com',
  name: 'John Doe',
  metadata: {
    user_id: 'user_123'
  }
});`,
          validation: 'Store the customer ID in your database'
        },
        {
          id: 'sub-step-3',
          title: 'Create the Subscription',
          description: 'Set up the recurring subscription',
          code: `const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{
    price: 'price_...' // Your price ID
  }],
  payment_behavior: 'default_incomplete',
  payment_settings: {
    save_default_payment_method: 'on_subscription'
  },
  expand: ['latest_invoice.payment_intent']
});`,
          notes: [
            'Use default_incomplete to require payment method setup',
            'Expand the payment intent for client confirmation'
          ]
        }
      ],
      codeTemplates: [],
      testing: {
        setup: [
          'Create test products and prices in Stripe Dashboard',
          'Use Stripe CLI to forward webhooks to localhost',
          'Test subscription lifecycle events'
        ],
        testCases: [
          {
            scenario: 'Create new subscription',
            expectedResult: 'Subscription created and first payment processed',
            code: ''
          },
          {
            scenario: 'Handle failed payment',
            expectedResult: 'Subscription moves to past_due status, user notified',
            code: ''
          }
        ],
        debugging: []
      }
    }
  ],
  commonPatterns: [
    {
      id: 'webhook-handling',
      name: 'Webhook Event Handling',
      description: 'Securely process Stripe webhook events',
      useCase: 'Real-time updates when payments succeed, fail, or subscriptions change',
      implementation: `app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Handle successful payment
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      // Handle failed payment
      console.log('Payment failed:', failedPayment.id);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }

  res.json({received: true});
});`,
      pros: [
        'Real-time updates without polling',
        'Reliable event delivery with retries',
        'Secure signature verification'
      ],
      cons: [
        'Requires webhook endpoint setup',
        'Need to handle idempotency',
        'Debugging can be challenging'
      ],
      alternatives: [
        'Polling Stripe API periodically',
        'Using Stripe Dashboard for manual tracking'
      ]
    },
    {
      id: 'payment-methods',
      name: 'Saved Payment Methods',
      description: 'Allow customers to save and reuse payment methods',
      useCase: 'Subscription billing and one-click purchases',
      implementation: `// Save payment method during setup
const setupIntent = await stripe.setupIntents.create({
  customer: customerId,
  payment_method_types: ['card'],
  usage: 'off_session'
});

// Use saved payment method for future payments
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000,
  currency: 'usd',
  customer: customerId,
  payment_method: savedPaymentMethodId,
  confirmation_method: 'manual',
  confirm: true,
  off_session: true // Indicates payment without customer present
});`,
      pros: [
        'Better user experience',
        'Enables subscription billing',
        'Reduces payment friction'
      ],
      cons: [
        'Requires PCI compliance considerations',
        'Additional setup complexity',
        'Need to handle expired cards'
      ]
    }
  ],
  troubleshooting: [
    {
      id: 'api-key-errors',
      issue: 'Authentication and API key problems',
      symptoms: [
        '"Invalid API key provided" error',
        '"No such customer" errors',
        'Requests failing with 401 status'
      ],
      causes: [
        'Using wrong API keys (test vs live)',
        'API keys not properly configured',
        'Keys exposed in client-side code'
      ],
      solutions: [
        {
          description: 'Verify you\'re using the correct API keys',
          steps: [
            'Check Stripe Dashboard for current keys',
            'Ensure test keys start with pk_test_ or sk_test_',
            'Verify environment variables are set correctly'
          ],
          code: `// Check your keys
console.log('Publishable key:', process.env.STRIPE_PUBLISHABLE_KEY);
console.log('Secret key exists:', !!process.env.STRIPE_SECRET_KEY);`
        },
        {
          description: 'Separate test and live environments',
          steps: [
            'Use different environment variables for test/live',
            'Never use live keys in development',
            'Set up proper environment configuration'
          ]
        }
      ],
      prevention: [
        'Use environment variables for all API keys',
        'Never commit API keys to version control',
        'Set up proper CI/CD with secret management'
      ]
    },
    {
      id: 'payment-failures',
      issue: 'Payments failing unexpectedly',
      symptoms: [
        'Cards being declined',
        'Payment Intent in requires_action state',
        'Customers unable to complete purchases'
      ],
      causes: [
        'Insufficient funds on customer card',
        '3D Secure authentication required',
        'Card issuer blocking transaction',
        'Incorrect payment flow implementation'
      ],
      solutions: [
        {
          description: 'Implement proper error handling',
          steps: [
            'Check payment_intent.last_payment_error for details',
            'Handle requires_action status for 3D Secure',
            'Provide clear error messages to customers'
          ],
          code: `if (error) {
  switch (error.type) {
    case 'card_error':
      showError('Your card was declined: ' + error.message);
      break;
    case 'validation_error':
      showError('Payment details are invalid: ' + error.message);
      break;
    default:
      showError('Payment failed. Please try again.');
      break;
  }
}`
        }
      ],
      prevention: [
        'Test with various test cards',
        'Implement comprehensive error handling',
        'Monitor payment success rates in Stripe Dashboard'
      ]
    }
  ]
};

export const getStripeIntegrationGuide = (id: string): IntegrationGuide | undefined => {
  return stripeService.integrationGuides.find(guide => guide.id === id);
};

export const getStripePatterns = (): ServicePattern[] => {
  return stripeService.commonPatterns;
};

export const getStripeTroubleshooting = (): TroubleshootingGuide[] => {
  return stripeService.troubleshooting;
};

export const searchStripeDocumentation = (query: string): any[] => {
  const results: any[] = [];
  const lowercaseQuery = query.toLowerCase();

  // Search integration guides
  stripeService.integrationGuides.forEach(guide => {
    if (guide.title.toLowerCase().includes(lowercaseQuery) ||
        guide.description.toLowerCase().includes(lowercaseQuery)) {
      results.push({ type: 'guide', data: guide });
    }
  });

  // Search patterns
  stripeService.commonPatterns.forEach(pattern => {
    if (pattern.name.toLowerCase().includes(lowercaseQuery) ||
        pattern.description.toLowerCase().includes(lowercaseQuery)) {
      results.push({ type: 'pattern', data: pattern });
    }
  });

  // Search troubleshooting
  stripeService.troubleshooting.forEach(trouble => {
    if (trouble.issue.toLowerCase().includes(lowercaseQuery) ||
        trouble.symptoms.some(symptom => symptom.toLowerCase().includes(lowercaseQuery))) {
      results.push({ type: 'troubleshooting', data: trouble });
    }
  });

  return results;
};