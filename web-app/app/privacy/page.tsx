"use client";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
          Privacy Policy
        </h1>

        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <div>
            <p className="text-lg mb-4">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="mb-6">
              At Ottokode, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our modern development environment.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email address and name when you create an account</li>
                  <li>GitHub profile information when using OAuth authentication</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Organization details for enterprise accounts</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Usage Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Code snippets and project files you create or edit</li>
                  <li>AI chat conversations and prompts</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Performance metrics and error logs</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Technical Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Session data and cookies</li>
                  <li>API usage and request logs</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain our AI development services</li>
              <li>Improve AI model performance and accuracy</li>
              <li>Process payments and manage subscriptions</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send important updates about service changes</li>
              <li>Analyze usage patterns to improve our platform</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Information Sharing</h2>
            <p className="mb-4">We do not sell your personal information. We may share information in these situations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Third-party services that help us operate (Supabase, Stripe, etc.)</li>
              <li><strong>AI Training:</strong> Anonymous, aggregated code patterns to improve AI models</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>End-to-end encryption for sensitive data</li>
              <li>Secure authentication and session management</li>
              <li>Regular security audits and monitoring</li>
              <li>SOC 2 compliance for enterprise customers</li>
              <li>Data backup and disaster recovery procedures</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
              <li>Restrict processing of your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Cookies and Tracking</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Analyze site usage with Google Analytics</li>
              <li>Improve user experience</li>
            </ul>
            <p className="mt-4">You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Data Retention</h2>
            <p>We retain your information for as long as necessary to provide services. Specific retention periods:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Account Data:</strong> Until account deletion</li>
              <li><strong>Code Files:</strong> Until manually deleted by user</li>
              <li><strong>Chat History:</strong> 90 days unless saved by user</li>
              <li><strong>Usage Logs:</strong> 12 months for analytics</li>
              <li><strong>Payment Records:</strong> 7 years for tax compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">International Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your residence.
              We ensure appropriate safeguards are in place for international transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via email or through our platform. Continued use constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights, contact us:</p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> privacy@ottokode.ai</p>
              <p><strong>Address:</strong> [Your Business Address]</p>
              <p><strong>Data Protection Officer:</strong> dpo@ottokode.ai</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}