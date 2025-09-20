export const USER_AGREEMENT_CONTENT = {
  title: "Ottokode User Agreement",
  version: "1.0",
  lastUpdated: "January 2025",

  sections: [
    {
      title: "1. ACCEPTANCE OF TERMS",
      content: `By downloading, installing, or using Ottokode ("the Software"), you agree to be bound by this User Agreement ("Agreement"). If you do not agree to these terms, do not use the Software.`
    },
    {
      title: "2. DESCRIPTION OF SERVICE",
      content: `Ottokode is an AI-powered integrated development environment (IDE) that provides code completion, debugging tools, and development assistance. The Software may connect to external AI services and cloud platforms to provide enhanced functionality.`
    },
    {
      title: "3. LICENSE GRANT",
      content: `Subject to your compliance with this Agreement, Ottokode grants you a limited, non-exclusive, non-transferable license to use the Software for your personal or commercial development projects. This license does not grant you any rights to the underlying source code except as expressly provided.`
    },
    {
      title: "4. USER RESPONSIBILITIES",
      content: `You agree to:
• Use the Software in compliance with all applicable laws and regulations
• Not reverse engineer, decompile, or attempt to extract the source code
• Not use the Software for any illegal or unauthorized purpose
• Maintain the security of your account credentials
• Not share your license with unauthorized users`
    },
    {
      title: "5. AI SERVICES AND DATA PROCESSING",
      content: `The Software may process your code and project data through AI services to provide intelligent assistance. By using these features:
• You consent to the processing of your code for AI-powered suggestions
• You understand that code snippets may be temporarily processed by external AI providers
• You retain ownership of your code and intellectual property
• We implement security measures to protect your data during processing`
    },
    {
      title: "6. PRIVACY AND DATA COLLECTION",
      content: `We collect and process certain data to improve the Software:
• Usage analytics and performance metrics
• Error reports and crash logs (anonymous)
• User preferences and settings
• Project metadata (file types, sizes, not content)
We do not sell your personal data or store your source code permanently.`
    },
    {
      title: "7. SUBSCRIPTION AND PAYMENT",
      content: `Certain features may require a subscription:
• Subscription fees are billed in advance
• You may cancel your subscription at any time
• Refunds are provided according to our refund policy
• Trial period provides full access to all features`
    },
    {
      title: "8. INTELLECTUAL PROPERTY",
      content: `• You retain all rights to your code and projects created using the Software
• Ottokode retains all rights to the Software itself
• AI-generated suggestions become part of your project under your ownership
• You grant us permission to use anonymous usage data to improve the Software`
    },
    {
      title: "9. DISCLAIMERS AND LIMITATIONS",
      content: `THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

We are not liable for:
• Data loss or corruption
• Downtime or service interruptions
• Third-party service failures
• Indirect or consequential damages`
    },
    {
      title: "10. TERMINATION",
      content: `This Agreement remains in effect until terminated:
• You may terminate by uninstalling the Software
• We may terminate for violations of this Agreement
• Certain provisions survive termination (intellectual property, limitations of liability)
• Upon termination, you must cease all use of the Software`
    },
    {
      title: "11. UPDATES AND MODIFICATIONS",
      content: `We may update this Agreement from time to time:
• Changes will be effective upon posting or notification
• Continued use constitutes acceptance of modified terms
• Material changes will be communicated via the Software or email
• You may review the current version at any time`
    },
    {
      title: "12. GOVERNING LAW",
      content: `This Agreement is governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through binding arbitration or in the courts of [Your Jurisdiction]. If any provision is found unenforceable, the remainder of this Agreement remains in effect.`
    }
  ],

  summary: `By accepting this agreement, you acknowledge that you have read, understood, and agree to be bound by all terms and conditions. You confirm that you are authorized to accept this agreement on behalf of yourself or your organization.`,

  contactInfo: `If you have questions about this Agreement, please contact us at legal@ottokode.ai`
};

export const AGREEMENT_STORAGE_KEY = 'ottokode_user_agreement_accepted';
export const AGREEMENT_VERSION_KEY = 'ottokode_agreement_version';