/**
 * AI-Powered Guideline Checker
 * Analyzes code in real-time against platform guidelines and best practices
 */

import {
  CodeAnalysisRequest,
  CodeAnalysisResult,
  GuidelineViolation,
  Suggestion,
  SecurityIssue,
  PerformanceHint,
  AccessibilityHint,
  CodeLocation
} from '../types/documentation-guide';
import { iosGuidelines } from '../data/ios-guidelines';
import { stripeService } from '../data/stripe-integration';

export class AIGuidelineChecker {
  private patterns: Map<string, RegExp[]> = new Map();
  private platformRules: Map<string, PlatformRule[]> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializePlatformRules();
  }

  private initializePatterns(): void {
    // iOS/Swift patterns
    this.patterns.set('swift', [
      /UIWebView/g, // Deprecated API
      /\.frame\s*=\s*CGRect\(/g, // Hardcoded frames
      /dispatch_get_main_queue/g, // Deprecated GCD syntax
      /NSUserDefaults\.standard/g, // UserDefaults best practices
    ]);

    // JavaScript/Web patterns
    this.patterns.set('javascript', [
      /innerHTML\s*[+]=\s*[^;]+[+]/g, // Potential XSS
      /document\.write\(/g, // Deprecated DOM manipulation
      /eval\(/g, // Security risk
      /var\s+/g, // Use let/const instead
      /==(?!=)/g, // Use strict equality
    ]);

    // HTML patterns
    this.patterns.set('html', [
      /<img(?![^>]*alt=)/gi, // Missing alt attributes
      /<input(?![^>]*aria-label)/gi, // Missing accessibility labels
      /<button(?![^>]*aria-label)/gi, // Missing button labels
      /onclick\s*=/gi, // Inline event handlers
    ]);

    // CSS patterns
    this.patterns.set('css', [
      /!important/g, // Avoid !important
      /position:\s*fixed/g, // Fixed positioning concerns
      /overflow:\s*hidden/g, // Accessibility concerns
    ]);

    // Stripe-specific patterns
    this.patterns.set('stripe', [
      /sk_live_[a-zA-Z0-9]+/g, // Live secret key exposure
      /pk_live_[a-zA-Z0-9]+/g, // Live publishable key in client
      /amount:\s*\d+(?!\s*\*\s*100)/g, // Amount not in cents
    ]);
  }

  private initializePlatformRules(): void {
    // iOS-specific rules
    this.platformRules.set('ios', [
      {
        id: 'deprecated-uiwebview',
        pattern: /UIWebView/g,
        severity: 'error',
        message: 'UIWebView is deprecated. Use WKWebView instead.',
        category: 'deprecation',
        fix: 'Replace UIWebView with WKWebView',
        learnMore: 'https://developer.apple.com/documentation/webkit/wkwebview'
      },
      {
        id: 'hardcoded-frames',
        pattern: /\.frame\s*=\s*CGRect\(/g,
        severity: 'warning',
        message: 'Avoid hardcoded frames. Use Auto Layout constraints.',
        category: 'layout',
        fix: 'Use Auto Layout constraints or SwiftUI',
        learnMore: 'https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/AutolayoutPG/'
      },
      {
        id: 'main-thread-blocking',
        pattern: /URLSession\.shared\.dataTask.*\.resume\(\)\s*$/gm,
        severity: 'info',
        message: 'Ensure network calls don\'t block the main thread',
        category: 'performance',
        fix: 'Use async/await or proper completion handlers',
        learnMore: 'https://developer.apple.com/documentation/foundation/urlsession'
      }
    ]);

    // Web accessibility rules
    this.platformRules.set('web', [
      {
        id: 'missing-alt-text',
        pattern: /<img(?![^>]*alt=)/gi,
        severity: 'error',
        message: 'Images must have alt attributes for accessibility',
        category: 'accessibility',
        fix: 'Add descriptive alt attributes to all images',
        learnMore: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html'
      },
      {
        id: 'inline-styles',
        pattern: /style\s*=\s*["'][^"']*["']/gi,
        severity: 'warning',
        message: 'Avoid inline styles. Use CSS classes instead.',
        category: 'maintainability',
        fix: 'Move styles to CSS files and use classes',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Style_Attributes'
      },
      {
        id: 'console-logs',
        pattern: /console\.(log|warn|error|debug)/g,
        severity: 'info',
        message: 'Remove console statements before production',
        category: 'cleanup',
        fix: 'Use proper logging library or remove statements',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/API/Console'
      }
    ]);

    // Security rules
    this.platformRules.set('security', [
      {
        id: 'xss-vulnerability',
        pattern: /innerHTML\s*[+]=.*[+]/g,
        severity: 'error',
        message: 'Potential XSS vulnerability with innerHTML',
        category: 'security',
        fix: 'Use textContent or proper sanitization',
        learnMore: 'https://owasp.org/www-community/attacks/xss/'
      },
      {
        id: 'eval-usage',
        pattern: /eval\(/g,
        severity: 'error',
        message: 'eval() is dangerous and should be avoided',
        category: 'security',
        fix: 'Use JSON.parse() or other safe alternatives',
        learnMore: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval'
      },
      {
        id: 'exposed-secrets',
        pattern: /(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{10,}["']/gi,
        severity: 'error',
        message: 'Potential secret or API key exposed in code',
        category: 'security',
        fix: 'Move secrets to environment variables',
        learnMore: 'https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials'
      }
    ]);

    // Stripe-specific rules
    this.platformRules.set('stripe', [
      {
        id: 'live-key-exposure',
        pattern: /sk_live_[a-zA-Z0-9]+/g,
        severity: 'error',
        message: 'Stripe live secret key should never be in client-side code',
        category: 'security',
        fix: 'Move to server-side environment variables',
        learnMore: 'https://stripe.com/docs/keys'
      },
      {
        id: 'amount-not-in-cents',
        pattern: /amount:\s*(\d+)(?!\s*\*\s*100)/g,
        severity: 'warning',
        message: 'Stripe amounts should be in cents (multiply by 100)',
        category: 'stripe',
        fix: 'Multiply amount by 100 to convert to cents',
        learnMore: 'https://stripe.com/docs/currencies#zero-decimal'
      },
      {
        id: 'missing-error-handling',
        pattern: /stripe\.\w+\.\w+\([^)]*\)(?!\s*\.catch|\s*try)/g,
        severity: 'warning',
        message: 'Stripe API calls should include error handling',
        category: 'stripe',
        fix: 'Add try-catch or .catch() for error handling',
        learnMore: 'https://stripe.com/docs/error-handling'
      }
    ]);
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeAnalysisResult> {
    const violations: GuidelineViolation[] = [];
    const suggestions: Suggestion[] = [];
    const securityIssues: SecurityIssue[] = [];
    const performanceHints: PerformanceHint[] = [];
    const accessibilityHints: AccessibilityHint[] = [];

    // Analyze based on language and platform
    const languageViolations = this.analyzeByLanguage(request);
    violations.push(...languageViolations);

    // Platform-specific analysis
    if (request.platform) {
      const platformViolations = this.analyzeByPlatform(request);
      violations.push(...platformViolations);
    }

    // Security analysis
    const securityViolations = this.analyzeForSecurity(request);
    violations.push(...securityViolations);
    securityIssues.push(...this.convertToSecurityIssues(securityViolations));

    // Performance analysis
    performanceHints.push(...this.analyzePerformance(request));

    // Accessibility analysis
    accessibilityHints.push(...this.analyzeAccessibility(request));

    // Generate suggestions
    suggestions.push(...this.generateSuggestions(request, violations));

    return {
      guidelines: violations,
      suggestions,
      bestPractices: [],
      securityIssues,
      performance: performanceHints,
      accessibility: accessibilityHints,
      score: this.calculateScore(violations, securityIssues, performanceHints, accessibilityHints)
    };
  }

  private analyzeByLanguage(request: CodeAnalysisRequest): GuidelineViolation[] {
    const violations: GuidelineViolation[] = [];
    const { code, language } = request;

    // Get patterns for the language
    const patterns = this.patterns.get(language.toLowerCase()) || [];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const location = this.getCodeLocation(code, match.index);

        violations.push({
          guideline: `${language} Best Practices`,
          severity: this.getSeverityForPattern(match[0]),
          description: this.getDescriptionForPattern(match[0]),
          location,
          suggestion: this.getSuggestionForPattern(match[0]),
          autoFixAvailable: this.isAutoFixAvailable(match[0])
        });
      }
    });

    return violations;
  }

  private analyzeByPlatform(request: CodeAnalysisRequest): GuidelineViolation[] {
    const violations: GuidelineViolation[] = [];
    const { code, platform } = request;

    if (!platform) return violations;

    const rules = this.platformRules.get(platform.toLowerCase()) || [];

    rules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(code)) !== null) {
        const location = this.getCodeLocation(code, match.index);

        violations.push({
          guideline: `${platform} Guidelines - ${rule.category}`,
          severity: rule.severity as 'error' | 'warning' | 'info',
          description: rule.message,
          location,
          suggestion: rule.fix,
          autoFixAvailable: false,
          learnMoreUrl: rule.learnMore
        });
      }
    });

    return violations;
  }

  private analyzeForSecurity(request: CodeAnalysisRequest): GuidelineViolation[] {
    const violations: GuidelineViolation[] = [];
    const { code } = request;

    const securityRules = this.platformRules.get('security') || [];

    securityRules.forEach(rule => {
      let match;
      while ((match = rule.pattern.exec(code)) !== null) {
        const location = this.getCodeLocation(code, match.index);

        violations.push({
          guideline: `Security - ${rule.category}`,
          severity: rule.severity as 'error' | 'warning' | 'info',
          description: rule.message,
          location,
          suggestion: rule.fix,
          autoFixAvailable: false,
          learnMoreUrl: rule.learnMore
        });
      }
    });

    // Check for Stripe-specific security issues
    const stripeRules = this.platformRules.get('stripe') || [];
    if (code.includes('stripe') || code.includes('Stripe')) {
      stripeRules.forEach(rule => {
        let match;
        while ((match = rule.pattern.exec(code)) !== null) {
          const location = this.getCodeLocation(code, match.index);

          violations.push({
            guideline: `Stripe Security - ${rule.category}`,
            severity: rule.severity as 'error' | 'warning' | 'info',
            description: rule.message,
            location,
            suggestion: rule.fix,
            autoFixAvailable: false,
            learnMoreUrl: rule.learnMore
          });
        }
      });
    }

    return violations;
  }

  private analyzePerformance(request: CodeAnalysisRequest): PerformanceHint[] {
    const hints: PerformanceHint[] = [];
    const { code, language } = request;

    // JavaScript performance checks
    if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      // Check for inefficient DOM queries
      if (code.includes('document.getElementById') && code.match(/document\.getElementById.*document\.getElementById/)) {
        hints.push({
          type: 'DOM optimization',
          description: 'Multiple DOM queries detected',
          impact: 'Cache DOM elements instead of repeated queries',
          solution: 'Store DOM elements in variables: const element = document.getElementById("id");',
          measurement: 'Use browser DevTools Performance tab'
        });
      }

      // Check for missing keys in React lists
      if (code.includes('.map(') && !code.includes('key=')) {
        hints.push({
          type: 'React optimization',
          description: 'Missing keys in list rendering',
          impact: 'Poor reconciliation performance in React',
          solution: 'Add unique key prop to list items',
          measurement: 'Check React DevTools Profiler'
        });
      }
    }

    // iOS/Swift performance checks
    if (language.toLowerCase() === 'swift') {
      // Check for synchronous network calls
      if (code.includes('URLSession') && code.includes('.dataTask') && !code.includes('async')) {
        hints.push({
          type: 'Network performance',
          description: 'Consider using async/await for network calls',
          impact: 'Better error handling and code readability',
          solution: 'Use async/await pattern with URLSession',
          measurement: 'Monitor with Instruments Network tool'
        });
      }
    }

    return hints;
  }

  private analyzeAccessibility(request: CodeAnalysisRequest): AccessibilityHint[] {
    const hints: AccessibilityHint[] = [];
    const { code, language } = request;

    // HTML accessibility checks
    if (language.toLowerCase() === 'html' || code.includes('<')) {
      // Check for images without alt text
      if (code.match(/<img(?![^>]*alt=)/gi)) {
        hints.push({
          guideline: 'WCAG 2.1 - Non-text Content',
          description: 'Images must have alternative text',
          solution: 'Add descriptive alt attributes to all images',
          priority: 'high',
          testing: 'Test with screen readers like VoiceOver or NVDA'
        });
      }

      // Check for insufficient color contrast
      if (code.includes('color:') && code.includes('#')) {
        hints.push({
          guideline: 'WCAG 2.1 - Color Contrast',
          description: 'Ensure sufficient color contrast (4.5:1 minimum)',
          solution: 'Use tools like WebAIM Contrast Checker to verify colors',
          priority: 'high',
          testing: 'Use browser accessibility audit tools'
        });
      }
    }

    // iOS accessibility checks
    if (language.toLowerCase() === 'swift') {
      // Check for missing accessibility labels
      if ((code.includes('UIButton') || code.includes('Button')) && !code.includes('accessibilityLabel')) {
        hints.push({
          guideline: 'iOS Accessibility - Labels',
          description: 'Custom UI elements should have accessibility labels',
          solution: 'Add .accessibilityLabel() modifier or accessibilityLabel property',
          priority: 'high',
          testing: 'Test with VoiceOver enabled on device'
        });
      }
    }

    return hints;
  }

  private generateSuggestions(request: CodeAnalysisRequest, violations: GuidelineViolation[]): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Generate suggestions based on violations
    violations.forEach(violation => {
      if (violation.guideline.includes('JavaScript')) {
        if (violation.description.includes('var')) {
          suggestions.push({
            type: 'improvement',
            description: 'Use modern variable declarations',
            before: 'var userName = "John";',
            after: 'const userName = "John"; // or let if reassignment needed',
            reasoning: 'const and let have block scope and prevent hoisting issues',
            impact: 'medium'
          });
        }
      }

      if (violation.guideline.includes('iOS')) {
        if (violation.description.includes('UIWebView')) {
          suggestions.push({
            type: 'improvement',
            description: 'Migrate to modern WebKit framework',
            before: 'let webView = UIWebView()',
            after: 'let webView = WKWebView()',
            reasoning: 'WKWebView provides better performance, security, and features',
            impact: 'high'
          });
        }
      }
    });

    // Framework-specific suggestions
    if (request.language === 'javascript' && request.framework === 'react') {
      suggestions.push({
        type: 'optimization',
        description: 'Consider using React.memo for expensive components',
        before: 'const ExpensiveComponent = ({ data }) => { /* complex rendering */ }',
        after: 'const ExpensiveComponent = React.memo(({ data }) => { /* complex rendering */ })',
        reasoning: 'Prevents unnecessary re-renders when props haven\'t changed',
        impact: 'medium'
      });
    }

    return suggestions;
  }

  private getCodeLocation(code: string, index: number): CodeLocation {
    const lines = code.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      length: 0
    };
  }

  private getSeverityForPattern(pattern: string): 'error' | 'warning' | 'info' {
    const errorPatterns = ['UIWebView', 'eval(', 'innerHTML', 'sk_live_'];
    const warningPatterns = ['var ', '.frame =', 'console.'];

    if (errorPatterns.some(p => pattern.includes(p))) return 'error';
    if (warningPatterns.some(p => pattern.includes(p))) return 'warning';
    return 'info';
  }

  private getDescriptionForPattern(pattern: string): string {
    const descriptions: { [key: string]: string } = {
      'UIWebView': 'UIWebView is deprecated. Use WKWebView instead.',
      'var ': 'Avoid var declarations. Use let or const instead.',
      'eval(': 'eval() is dangerous and should be avoided.',
      'innerHTML': 'Be careful with innerHTML to prevent XSS attacks.',
      'console.': 'Remove console statements before production.',
      '.frame =': 'Avoid hardcoded frames. Use Auto Layout instead.'
    };

    for (const [key, desc] of Object.entries(descriptions)) {
      if (pattern.includes(key)) return desc;
    }

    return 'Code pattern detected that may need attention.';
  }

  private getSuggestionForPattern(pattern: string): string {
    const suggestions: { [key: string]: string } = {
      'UIWebView': 'Replace with WKWebView for better performance and security.',
      'var ': 'Use const for constants or let for variables that change.',
      'eval(': 'Use JSON.parse() or other safe alternatives.',
      'innerHTML': 'Use textContent or proper sanitization libraries.',
      'console.': 'Use a proper logging library or remove for production.',
      '.frame =': 'Use Auto Layout constraints or SwiftUI for adaptive layouts.'
    };

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (pattern.includes(key)) return suggestion;
    }

    return 'Review this pattern against best practices.';
  }

  private isAutoFixAvailable(pattern: string): boolean {
    const autoFixable = ['var ', 'console.', '=='];
    return autoFixable.some(p => pattern.includes(p));
  }

  private convertToSecurityIssues(violations: GuidelineViolation[]): SecurityIssue[] {
    return violations
      .filter(v => v.guideline.includes('Security'))
      .map(v => ({
        type: v.guideline,
        severity: v.severity === 'error' ? 'high' : v.severity === 'warning' ? 'medium' : 'low',
        description: v.description,
        location: v.location,
        remediation: v.suggestion,
        references: v.learnMoreUrl ? [v.learnMoreUrl] : []
      }));
  }

  private calculateScore(
    violations: GuidelineViolation[],
    securityIssues: SecurityIssue[],
    performanceHints: PerformanceHint[],
    accessibilityHints: AccessibilityHint[]
  ): any {
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    const criticalSecurityCount = securityIssues.filter(s => s.severity === 'critical' || s.severity === 'high').length;
    const highAccessibilityCount = accessibilityHints.filter(h => h.priority === 'high').length;

    const overall = Math.max(0, 100 - (errorCount * 15) - (warningCount * 5) - (criticalSecurityCount * 20));
    const security = Math.max(0, 100 - (criticalSecurityCount * 25) - (securityIssues.length * 5));
    const accessibility = Math.max(0, 100 - (highAccessibilityCount * 15) - (accessibilityHints.length * 5));
    const performance = Math.max(0, 100 - (performanceHints.length * 10));

    return {
      overall,
      guidelines: overall,
      security,
      performance,
      accessibility,
      maintainability: Math.max(0, 100 - (warningCount * 8))
    };
  }
}

interface PlatformRule {
  id: string;
  pattern: RegExp;
  severity: string;
  message: string;
  category: string;
  fix: string;
  learnMore: string;
}

export const aiGuidelineChecker = new AIGuidelineChecker();