/**
 * Apple Human Interface Guidelines Integration
 * Comprehensive iOS/macOS design and development guidelines
 */

import { PlatformGuideline, GuidelineCategory, CodeExample, ChecklistItem, DocumentationPlatform } from '../types/documentation-guide';

export const iosGuidelineCategories: GuidelineCategory[] = [
  {
    id: 'foundations',
    name: 'Foundations',
    description: 'Core design principles and accessibility',
    icon: 'foundation',
    color: '#007AFF'
  },
  {
    id: 'patterns',
    name: 'Patterns',
    description: 'Common interaction patterns and navigation',
    icon: 'pattern',
    color: '#5856D6'
  },
  {
    id: 'components',
    name: 'Components',
    description: 'UI components and controls',
    icon: 'component',
    color: '#30D158'
  },
  {
    id: 'inputs',
    name: 'Inputs',
    description: 'User input methods and feedback',
    icon: 'input',
    color: '#FF9500'
  },
  {
    id: 'system',
    name: 'System Integration',
    description: 'Platform integration and capabilities',
    icon: 'system',
    color: '#FF3B30'
  }
];

export const iosPlatform: DocumentationPlatform = {
  id: 'ios',
  name: 'iOS',
  type: 'mobile',
  icon: 'smartphone',
  color: '#007AFF',
  guidelines: iosGuidelineCategories
};

export const iosGuidelines: PlatformGuideline[] = [
  {
    id: 'ios-accessibility',
    platform: iosPlatform,
    category: iosGuidelineCategories[0], // Foundations
    title: 'Accessibility',
    description: 'Design inclusive experiences that work for everyone',
    importance: 'critical',
    difficulty: 'intermediate',
    tags: ['accessibility', 'inclusive-design', 'voiceover', 'dynamic-type'],
    content: {
      overview: 'Accessibility is a fundamental aspect of iOS app design. Every app should be usable by people with diverse abilities, including those who use assistive technologies.',
      requirements: [
        'Support VoiceOver screen reader',
        'Implement Dynamic Type for text scaling',
        'Provide sufficient color contrast (4.5:1 minimum)',
        'Ensure touch targets are at least 44x44 points',
        'Support assistive technologies like Switch Control',
        'Provide alternative text for images and icons'
      ],
      bestPractices: [
        'Test your app with VoiceOver enabled',
        'Use semantic markup with accessibility labels',
        'Group related elements logically',
        'Provide keyboard navigation support',
        'Use system colors that adapt to accessibility settings',
        'Implement haptic feedback appropriately'
      ],
      commonMistakes: [
        'Missing accessibility labels on custom controls',
        'Inaccessible color-only information',
        'Touch targets smaller than 44x44 points',
        'Poor focus management in complex views',
        'Ignoring Dynamic Type scaling'
      ],
      resources: [
        {
          title: 'Accessibility - Human Interface Guidelines',
          url: 'https://developer.apple.com/design/human-interface-guidelines/accessibility',
          type: 'documentation',
          description: 'Apple\'s comprehensive accessibility guidelines'
        },
        {
          title: 'Accessibility Inspector',
          url: 'https://developer.apple.com/library/archive/documentation/Accessibility/Conceptual/AccessibilityMacOSX/OSXAXTestingApps.html',
          type: 'tool',
          description: 'Tool for testing accessibility in your apps'
        }
      ]
    },
    examples: [
      {
        id: 'accessibility-label-swiftui',
        title: 'Accessibility Labels in SwiftUI',
        description: 'Properly implement accessibility labels for UI elements',
        language: 'swift',
        code: `Button(action: {
    // Action
}) {
    Image(systemName: "plus")
}
.accessibilityLabel("Add item")
.accessibilityHint("Adds a new item to your list")

Text("Temperature: 72°F")
    .accessibilityLabel("Temperature: 72 degrees Fahrenheit")`,
        explanation: 'Always provide descriptive accessibility labels that convey the purpose and state of UI elements.'
      },
      {
        id: 'dynamic-type-support',
        title: 'Dynamic Type Support',
        description: 'Support Dynamic Type for better accessibility',
        language: 'swift',
        code: `// SwiftUI - Automatic Dynamic Type support
Text("Welcome to our app")
    .font(.headline)

// UIKit - Manual Dynamic Type support
let label = UILabel()
label.font = UIFont.preferredFont(forTextStyle: .headline)
label.adjustsFontForContentSizeCategory = true`,
        explanation: 'Use system fonts and text styles that automatically scale with user preferences.'
      }
    ],
    checklist: [
      {
        id: 'voiceover-test',
        description: 'Test all screens with VoiceOver enabled',
        required: true,
        category: 'testing',
        verification: 'Navigate through your app using only VoiceOver'
      },
      {
        id: 'contrast-check',
        description: 'Verify color contrast meets WCAG AA standards (4.5:1)',
        required: true,
        category: 'visual',
        verification: 'Use Accessibility Inspector or online contrast checkers'
      },
      {
        id: 'touch-targets',
        description: 'Ensure all interactive elements are at least 44x44 points',
        required: true,
        category: 'interaction',
        verification: 'Measure touch targets in Interface Builder or programmatically'
      },
      {
        id: 'dynamic-type',
        description: 'Test with largest accessibility text sizes',
        required: true,
        category: 'typography',
        verification: 'Test with accessibility text sizes in Settings > Accessibility > Display & Text Size'
      }
    ],
    relatedGuidelines: ['ios-color', 'ios-typography', 'ios-layout'],
    lastUpdated: '2024-09-01'
  },
  {
    id: 'ios-navigation',
    platform: {
      id: 'ios',
      name: 'iOS',
      type: 'mobile',
      icon: 'smartphone',
      color: '#007AFF',
      guidelines: iosGuidelineCategories
    },
    category: iosGuidelineCategories[1], // Patterns
    title: 'Navigation',
    description: 'Create clear, predictable navigation experiences',
    importance: 'critical',
    difficulty: 'beginner',
    tags: ['navigation', 'tab-bar', 'navigation-bar', 'hierarchy'],
    content: {
      overview: 'Navigation helps users understand where they are in your app and how to get to their destination. iOS provides standard navigation patterns that users expect.',
      requirements: [
        'Use consistent navigation patterns throughout the app',
        'Provide clear visual hierarchy',
        'Implement standard iOS navigation controls',
        'Support standard gestures (swipe back, etc.)',
        'Maintain navigation state appropriately'
      ],
      bestPractices: [
        'Use tab bars for top-level navigation (3-5 tabs)',
        'Implement navigation bars for hierarchical content',
        'Provide clear, descriptive titles',
        'Use standard back button behavior',
        'Consider split view for iPad apps',
        'Implement search consistently'
      ],
      commonMistakes: [
        'Too many tabs in tab bar (more than 5)',
        'Inconsistent navigation patterns',
        'Missing or unclear back navigation',
        'Poor navigation hierarchy',
        'Custom navigation that doesn\'t follow platform conventions'
      ],
      resources: [
        {
          title: 'Navigation - Human Interface Guidelines',
          url: 'https://developer.apple.com/design/human-interface-guidelines/navigation',
          type: 'documentation',
          description: 'Apple\'s navigation guidelines'
        }
      ]
    },
    examples: [
      {
        id: 'tab-bar-swiftui',
        title: 'Tab Bar Navigation in SwiftUI',
        description: 'Implement standard tab bar navigation',
        language: 'swift',
        code: `TabView {
    HomeView()
        .tabItem {
            Label("Home", systemImage: "house")
        }

    SearchView()
        .tabItem {
            Label("Search", systemImage: "magnifyingglass")
        }

    ProfileView()
        .tabItem {
            Label("Profile", systemImage: "person")
        }
}`,
        explanation: 'Use standard tab bar with appropriate system images and descriptive labels.'
      },
      {
        id: 'navigation-stack',
        title: 'Navigation Stack Implementation',
        description: 'Create hierarchical navigation with proper back button behavior',
        language: 'swift',
        code: `NavigationStack {
    List(items) { item in
        NavigationLink(destination: DetailView(item: item)) {
            ItemRow(item: item)
        }
    }
    .navigationTitle("Items")
    .navigationBarTitleDisplayMode(.large)
}`,
        explanation: 'Use NavigationStack for hierarchical content with automatic back button handling.'
      }
    ],
    checklist: [
      {
        id: 'tab-count',
        description: 'Tab bar contains 3-5 tabs maximum',
        required: true,
        category: 'structure',
        verification: 'Count tabs in main navigation'
      },
      {
        id: 'back-navigation',
        description: 'All screens have clear back navigation',
        required: true,
        category: 'navigation',
        verification: 'Test navigation from any deep screen back to root'
      },
      {
        id: 'swipe-back',
        description: 'Standard swipe-back gesture works throughout the app',
        required: true,
        category: 'interaction',
        verification: 'Test edge swipe gesture on all navigation views'
      }
    ],
    relatedGuidelines: ['ios-layout', 'ios-gestures'],
    lastUpdated: '2024-09-01'
  },
  {
    id: 'ios-app-store-guidelines',
    platform: {
      id: 'ios',
      name: 'iOS',
      type: 'mobile',
      icon: 'smartphone',
      color: '#007AFF',
      guidelines: iosGuidelineCategories
    },
    category: iosGuidelineCategories[4], // System
    title: 'App Store Review Guidelines',
    description: 'Ensure your app meets App Store submission requirements',
    importance: 'critical',
    difficulty: 'advanced',
    tags: ['app-store', 'review', 'submission', 'guidelines', 'rejection'],
    content: {
      overview: 'The App Store Review Guidelines help ensure apps are safe, provide a good user experience, and comply with platform policies.',
      requirements: [
        'App must be fully functional without crashes',
        'Comply with content and design guidelines',
        'Follow platform conventions and standards',
        'Implement proper privacy practices',
        'Use appropriate monetization methods',
        'Provide accurate app metadata'
      ],
      bestPractices: [
        'Test thoroughly before submission',
        'Follow Human Interface Guidelines',
        'Implement proper error handling',
        'Use standard iOS UI components',
        'Provide clear app descriptions',
        'Include privacy policy if collecting data',
        'Test on multiple device sizes',
        'Ensure app works offline where appropriate'
      ],
      commonMistakes: [
        'App crashes on launch or during use',
        'Incomplete or placeholder content',
        'Poor user interface design',
        'Missing privacy disclosures',
        'Inappropriate content or metadata',
        'Violating intellectual property rights',
        'Non-functional features or buttons',
        'Apps that don\'t follow iOS design patterns'
      ],
      resources: [
        {
          title: 'App Store Review Guidelines',
          url: 'https://developer.apple.com/app-store/review/guidelines/',
          type: 'documentation',
          description: 'Official App Store review guidelines'
        },
        {
          title: 'Common App Rejections',
          url: 'https://developer.apple.com/app-store/review/rejections/',
          type: 'documentation',
          description: 'Common reasons for app rejection'
        }
      ]
    },
    examples: [
      {
        id: 'privacy-manifest',
        title: 'Privacy Manifest Implementation',
        description: 'Properly declare data collection in PrivacyInfo.xcprivacy',
        language: 'xml',
        code: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
</dict>
</plist>`,
        explanation: 'Declare all data collection practices in your privacy manifest file.'
      },
      {
        id: 'error-handling',
        title: 'Proper Error Handling',
        description: 'Implement comprehensive error handling to prevent crashes',
        language: 'swift',
        code: `func fetchData() async {
    do {
        let data = try await networkService.fetchUserData()
        await MainActor.run {
            self.userData = data
            self.showError = false
        }
    } catch {
        await MainActor.run {
            self.showError = true
            self.errorMessage = "Unable to load data. Please try again."
        }
        // Log error for debugging
        print("Error fetching data: \\(error)")
    }
}`,
        explanation: 'Always handle errors gracefully and provide meaningful feedback to users.'
      }
    ],
    checklist: [
      {
        id: 'crash-free',
        description: 'App launches and runs without crashes',
        required: true,
        category: 'stability',
        verification: 'Test app thoroughly on multiple devices and iOS versions'
      },
      {
        id: 'complete-content',
        description: 'All features are implemented and functional',
        required: true,
        category: 'functionality',
        verification: 'Verify all buttons, links, and features work as expected'
      },
      {
        id: 'privacy-compliance',
        description: 'Privacy manifest accurately describes data collection',
        required: true,
        category: 'privacy',
        verification: 'Review PrivacyInfo.xcprivacy against actual data practices'
      },
      {
        id: 'ui-guidelines',
        description: 'App follows iOS Human Interface Guidelines',
        required: true,
        category: 'design',
        verification: 'Review app against HIG checklist'
      }
    ],
    relatedGuidelines: ['ios-accessibility', 'ios-privacy', 'ios-security'],
    lastUpdated: '2024-09-01'
  },
  {
    id: 'ios-performance',
    platform: {
      id: 'ios',
      name: 'iOS',
      type: 'mobile',
      icon: 'smartphone',
      color: '#007AFF',
      guidelines: iosGuidelineCategories
    },
    category: iosGuidelineCategories[4], // System
    title: 'Performance Guidelines',
    description: 'Optimize your app for speed, battery life, and memory efficiency',
    importance: 'recommended',
    difficulty: 'advanced',
    tags: ['performance', 'memory', 'battery', 'optimization', 'instruments'],
    content: {
      overview: 'Performance is crucial for user experience. iOS users expect apps to launch quickly, respond immediately, and preserve battery life.',
      requirements: [
        'Launch time under 400ms for initial display',
        'Smooth 60fps scrolling and animations',
        'Efficient memory usage without leaks',
        'Minimal battery drain',
        'Responsive UI during background tasks'
      ],
      bestPractices: [
        'Use Instruments to profile performance',
        'Implement lazy loading for large datasets',
        'Optimize images and assets',
        'Use background queues for heavy operations',
        'Implement proper memory management',
        'Cache frequently accessed data',
        'Use compression for network data'
      ],
      commonMistakes: [
        'Blocking main thread with heavy operations',
        'Memory leaks from retain cycles',
        'Loading unnecessary data upfront',
        'Inefficient image loading and caching',
        'Poor network request management',
        'Excessive background processing'
      ],
      resources: [
        {
          title: 'Performance - Apple Developer',
          url: 'https://developer.apple.com/performance/',
          type: 'documentation',
          description: 'Apple\'s performance optimization guides'
        },
        {
          title: 'Instruments User Guide',
          url: 'https://help.apple.com/instruments/',
          type: 'tool',
          description: 'Learn to use Instruments for performance analysis'
        }
      ]
    },
    examples: [
      {
        id: 'async-image-loading',
        title: 'Efficient Image Loading',
        description: 'Load images asynchronously to maintain UI responsiveness',
        language: 'swift',
        code: `// SwiftUI AsyncImage
AsyncImage(url: URL(string: imageURL)) { image in
    image
        .resizable()
        .aspectRatio(contentMode: .fit)
} placeholder: {
    ProgressView()
}
.frame(width: 200, height: 200)

// UIKit with URLSession
func loadImage(from url: URL, completion: @escaping (UIImage?) -> Void) {
    URLSession.shared.dataTask(with: url) { data, response, error in
        guard let data = data, let image = UIImage(data: data) else {
            completion(nil)
            return
        }
        DispatchQueue.main.async {
            completion(image)
        }
    }.resume()
}`,
        explanation: 'Always load images asynchronously to prevent blocking the main thread.'
      },
      {
        id: 'background-processing',
        title: 'Background Processing',
        description: 'Perform heavy operations on background queues',
        language: 'swift',
        code: `func processLargeDataset() {
    DispatchQueue.global(qos: .userInitiated).async {
        // Heavy processing work
        let processedData = self.performComplexCalculation()

        DispatchQueue.main.async {
            // Update UI on main thread
            self.updateUI(with: processedData)
        }
    }
}

// Using async/await
func fetchAndProcessData() async {
    do {
        let data = try await networkService.fetchData()
        let processedData = await processData(data)

        await MainActor.run {
            updateUI(with: processedData)
        }
    } catch {
        await MainActor.run {
            handleError(error)
        }
    }
}`,
        explanation: 'Use background queues for processing and return to main queue for UI updates.'
      }
    ],
    checklist: [
      {
        id: 'launch-time',
        description: 'App launches and displays content within 400ms',
        required: false,
        category: 'performance',
        verification: 'Use Instruments to measure launch time'
      },
      {
        id: 'memory-leaks',
        description: 'No memory leaks detected in Instruments',
        required: true,
        category: 'memory',
        verification: 'Run Leaks instrument during typical app usage'
      },
      {
        id: 'smooth-scrolling',
        description: 'Lists and collection views scroll at 60fps',
        required: true,
        category: 'performance',
        verification: 'Test scrolling performance with large datasets'
      }
    ],
    relatedGuidelines: ['ios-memory-management', 'ios-networking'],
    lastUpdated: '2024-09-01'
  }
];

export const getIOSGuidelinesByCategory = (categoryId: string): PlatformGuideline[] => {
  return iosGuidelines.filter(guideline => guideline.category.id === categoryId);
};

export const getIOSGuidelineById = (id: string): PlatformGuideline | undefined => {
  return iosGuidelines.find(guideline => guideline.id === id);
};

export const searchIOSGuidelines = (query: string): PlatformGuideline[] => {
  const lowercaseQuery = query.toLowerCase();
  return iosGuidelines.filter(guideline =>
    guideline.title.toLowerCase().includes(lowercaseQuery) ||
    guideline.description.toLowerCase().includes(lowercaseQuery) ||
    guideline.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    guideline.content.overview.toLowerCase().includes(lowercaseQuery)
  );
};