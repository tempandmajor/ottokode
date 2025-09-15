"use client";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
          Terms of Service
        </h1>

        <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
          <div>
            <p className="text-lg mb-4">
              <strong>Effective Date:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="mb-6">
              Welcome to Ottokode. These Terms of Service (&quot;Terms&quot;) govern your use of our
              AI-powered development environment and related services.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Ottokode, you agree to be bound by these Terms.
              If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Description of Service</h2>
            <p className="mb-4">Ottokode provides:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-powered code completion and suggestions</li>
              <li>Web-based and desktop development environments</li>
              <li>Real-time collaboration tools</li>
              <li>Project management and file organization</li>
              <li>Integration with third-party development tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Account Creation</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must provide accurate and complete information</li>
                  <li>You are responsible for maintaining account security</li>
                  <li>One person or entity per account</li>
                  <li>Must be 13 years or older (or 16 in EU)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Account Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Keep login credentials confidential</li>
                  <li>Notify us immediately of unauthorized access</li>
                  <li>You are liable for all activities under your account</li>
                  <li>Accurate billing and contact information required</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Acceptable Use Policy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Permitted Uses</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Software development and coding projects</li>
                  <li>Learning and educational purposes</li>
                  <li>Commercial development within usage limits</li>
                  <li>Team collaboration on legitimate projects</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Prohibited Uses</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Illegal activities or malicious software development</li>
                  <li>Attempting to breach security or access unauthorized data</li>
                  <li>Spam, phishing, or fraudulent activities</li>
                  <li>Reverse engineering or copying our AI models</li>
                  <li>Excessive API usage or resource consumption</li>
                  <li>Sharing accounts or reselling access</li>
                  <li>Harassment or harmful content creation</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Your Content</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You retain ownership of code and content you create</li>
                  <li>You grant us license to process and improve our services</li>
                  <li>You are responsible for ensuring you have rights to uploaded content</li>
                  <li>We may use anonymized data to improve AI models</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Our Platform</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Ottokode platform and AI models are our intellectual property</li>
                  <li>You receive a limited license to use our services</li>
                  <li>No rights to redistribute or modify our platform</li>
                  <li>Feedback and suggestions become our property</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Payment Terms</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Billing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Subscription fees are billed in advance</li>
                  <li>Usage-based charges are billed monthly</li>
                  <li>All fees are non-refundable unless legally required</li>
                  <li>Prices may change with 30 days notice</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Payment Processing</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Payments processed securely through Stripe</li>
                  <li>Valid payment method required for paid plans</li>
                  <li>Automatic renewal unless cancelled</li>
                  <li>Failed payments may result in service suspension</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Service Availability</h2>
            <p className="mb-4">We strive to provide reliable service but cannot guarantee:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>100% uptime or uninterrupted access</li>
              <li>Error-free operation of AI models</li>
              <li>Compatibility with all devices or browsers</li>
              <li>Preservation of data during outages</li>
            </ul>
            <p className="mt-4">
              We provide Service Level Agreements (SLAs) for enterprise customers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">8. Data and Privacy</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your data is governed by our Privacy Policy</li>
              <li>We implement industry-standard security measures</li>
              <li>You are responsible for backing up important data</li>
              <li>We may process data to improve AI models (anonymized)</li>
              <li>Enterprise customers receive additional data protections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">9. Termination</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">By You</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancel subscription anytime through account settings</li>
                  <li>Download your data before account closure</li>
                  <li>Cancellation takes effect at end of billing period</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">By Us</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>For violation of these Terms</li>
                  <li>For non-payment of fees</li>
                  <li>For abuse or security threats</li>
                  <li>With 30 days notice for operational reasons</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">10. Disclaimers and Limitations</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Service Disclaimers</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Service provided &quot;as is&quot; without warranties</li>
                  <li>AI suggestions may contain errors or inaccuracies</li>
                  <li>No guarantee of AI model performance</li>
                  <li>Third-party integrations beyond our control</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-medium mb-2 text-foreground">Limitation of Liability</h3>
                <p>
                  Our liability is limited to the amount paid in the 12 months prior to the claim.
                  We are not liable for indirect, incidental, or consequential damages.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from claims arising from your use
              of the service, violation of these Terms, or infringement of third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be
              resolved through binding arbitration, except for injunctive relief claims.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">13. Changes to Terms</h2>
            <p>
              We may modify these Terms with 30 days notice for material changes.
              Continued use after changes constitutes acceptance. For significant changes,
              we may require explicit acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-foreground">14. Contact Information</h2>
            <p>Questions about these Terms? Contact us:</p>
            <div className="mt-4 space-y-2">
              <p><strong>Email:</strong> legal@ottokode.ai</p>
              <p><strong>Address:</strong> [Your Business Address]</p>
              <p><strong>Support:</strong> support@ottokode.ai</p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-muted/20 rounded-lg">
            <p className="text-sm">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>
            <p className="text-sm mt-2">
              For the most current version of these Terms, please visit our website.
              We maintain a changelog of significant updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}