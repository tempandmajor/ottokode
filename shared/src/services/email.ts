/**
 * Email Service Implementation
 * Provides email functionality for invitations and notifications
 */

export interface EmailProvider {
  name: string;
  sendEmail(options: EmailOptions): Promise<EmailResult>;
  isConfigured(): boolean;
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject?: string;
  html?: string;
  text?: string;
  template?: {
    name: string;
    data: Record<string, any>;
  };
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text: string;
}

// Built-in email templates
const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  'project-invitation': {
    name: 'project-invitation',
    subject: 'You\'ve been invited to collaborate on {{projectName}}',
    html: `
      <h2>Project Collaboration Invitation</h2>
      <p>Hi {{inviteeName}},</p>
      <p>{{inviterName}} has invited you to collaborate on the project <strong>{{projectName}}</strong>.</p>
      <p><strong>Role:</strong> {{role}}</p>
      <p>Click the button below to accept the invitation:</p>
      <a href="{{acceptUrl}}" style="background-color: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>{{acceptUrl}}</p>
      <hr>
      <p><small>This invitation was sent by {{inviterEmail}} through Ottokode AI IDE.</small></p>
    `,
    text: `
Project Collaboration Invitation

Hi {{inviteeName}},

{{inviterName}} has invited you to collaborate on the project "{{projectName}}".

Role: {{role}}

To accept the invitation, click this link:
{{acceptUrl}}

This invitation was sent by {{inviterEmail}} through Ottokode AI IDE.
    `
  },
  'organization-invitation': {
    name: 'organization-invitation',
    subject: 'You\'ve been invited to join {{organizationName}}',
    html: `
      <h2>Organization Invitation</h2>
      <p>Hi {{inviteeName}},</p>
      <p>{{inviterName}} has invited you to join the organization <strong>{{organizationName}}</strong>.</p>
      <p><strong>Role:</strong> {{role}}</p>
      <p>Click the button below to accept the invitation:</p>
      <a href="{{acceptUrl}}" style="background-color: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a>
      <p>Or copy and paste this link into your browser:</p>
      <p>{{acceptUrl}}</p>
      <hr>
      <p><small>This invitation was sent by {{inviterEmail}} through Ottokode AI IDE.</small></p>
    `,
    text: `
Organization Invitation

Hi {{inviteeName}},

{{inviterName}} has invited you to join the organization "{{organizationName}}".

Role: {{role}}

To accept the invitation, click this link:
{{acceptUrl}}

This invitation was sent by {{inviterEmail}} through Ottokode AI IDE.
    `
  }
};

// Resend Email Provider (https://resend.com)
class ResendProvider implements EmailProvider {
  name = 'resend';
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = this.getEnvVar('RESEND_API_KEY') || '';
    this.fromEmail = this.getEnvVar('RESEND_FROM_EMAIL') || 'noreply@ottokode.com';
  }

  private getEnvVar(key: string): string {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
    return '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Resend API key not configured'
      };
    }

    try {
      const payload = {
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          messageId: result.id
        };
      } else {
        return {
          success: false,
          error: result.message || 'Failed to send email'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// SendGrid Email Provider
class SendGridProvider implements EmailProvider {
  name = 'sendgrid';
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = this.getEnvVar('SENDGRID_API_KEY') || '';
    this.fromEmail = this.getEnvVar('SENDGRID_FROM_EMAIL') || 'noreply@ottokode.com';
  }

  private getEnvVar(key: string): string {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
    return '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SendGrid API key not configured'
      };
    }

    try {
      const payload = {
        personalizations: [{
          to: Array.isArray(options.to)
            ? options.to.map(email => ({ email }))
            : [{ email: options.to }]
        }],
        from: { email: options.from || this.fromEmail },
        subject: options.subject,
        content: [
          ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
          ...(options.html ? [{ type: 'text/html', value: options.html }] : [])
        ]
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return {
          success: true,
          messageId: response.headers.get('x-message-id') || undefined
        };
      } else {
        const error = await response.text();
        return {
          success: false,
          error: error || 'Failed to send email'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Console Email Provider (for development)
class ConsoleProvider implements EmailProvider {
  name = 'console';

  isConfigured(): boolean {
    return true; // Always available for development
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    console.log('📧 Email would be sent:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Text:', options.text);
    console.log('HTML:', options.html);
    console.log('---');

    return {
      success: true,
      messageId: `console-${Date.now()}`
    };
  }
}

class EmailService {
  private providers: EmailProvider[] = [];
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    // Register available providers
    this.providers = [
      new ResendProvider(),
      new SendGridProvider(),
      new ConsoleProvider() // Fallback for development
    ];

    // Load built-in templates
    Object.values(EMAIL_TEMPLATES).forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  private getAvailableProvider(): EmailProvider | null {
    return this.providers.find(provider => provider.isConfigured()) || null;
  }

  private renderTemplate(template: EmailTemplate, data: Record<string, any>): { html: string; text: string; subject: string } {
    let html = template.html;
    let text = template.text;
    let subject = template.subject;

    // Simple template variable replacement
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const stringValue = String(value);
      html = html.replace(new RegExp(placeholder, 'g'), stringValue);
      text = text.replace(new RegExp(placeholder, 'g'), stringValue);
      subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
    });

    return { html, text, subject };
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const provider = this.getAvailableProvider();

    if (!provider) {
      return {
        success: false,
        error: 'No email provider configured'
      };
    }

    let emailOptions = { ...options };

    // If using a template, render it
    if (options.template) {
      const template = this.templates.get(options.template.name);
      if (!template) {
        return {
          success: false,
          error: `Email template '${options.template.name}' not found`
        };
      }

      const rendered = this.renderTemplate(template, options.template.data);
      emailOptions = {
        ...options,
        subject: options.subject || rendered.subject,
        html: options.html || rendered.html,
        text: options.text || rendered.text
      };
    }

    // Ensure subject is provided
    if (!emailOptions.subject) {
      return {
        success: false,
        error: 'Email subject is required'
      };
    }

    return provider.sendEmail(emailOptions);
  }

  async sendProjectInvitation(invitation: {
    to: string;
    inviterName: string;
    inviterEmail: string;
    inviteeName: string;
    projectName: string;
    role: string;
    acceptUrl: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: invitation.to,
      template: {
        name: 'project-invitation',
        data: invitation
      }
    });
  }

  async sendOrganizationInvitation(invitation: {
    to: string;
    inviterName: string;
    inviterEmail: string;
    inviteeName: string;
    organizationName: string;
    role: string;
    acceptUrl: string;
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: invitation.to,
      template: {
        name: 'organization-invitation',
        data: invitation
      }
    });
  }

  getConfiguredProvider(): string | null {
    const provider = this.getAvailableProvider();
    return provider ? provider.name : null;
  }

  isConfigured(): boolean {
    return this.getAvailableProvider() !== null;
  }

  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.name, template);
  }

  getTemplate(name: string): EmailTemplate | undefined {
    return this.templates.get(name);
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export types and classes for testing
export { EmailService, ResendProvider, SendGridProvider, ConsoleProvider };