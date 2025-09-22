/**
 * Project Scaffolding Service
 * Creates new projects from templates with proper file structure and configuration
 */

import { projectStorageService } from '../storage/ProjectStorageService';
import { getTemplateById } from '@ottokode/shared';
import { TEMPLATE_CODE_SNIPPETS } from './template-code-snippets';
import type {
  ProjectTemplate,
  ProjectCreationOptions,
  FileStructureNode,
  ProjectDependency,
  ConfigurationFile
} from '@ottokode/shared';
import type { FileNode } from '@/components/ide/file-explorer';
import type { Project } from '../storage/ProjectStorageService';

export class ProjectScaffoldingService {
  /**
   * Create a new project from a template
   */
  static async createFromTemplate(
    userId: string,
    options: ProjectCreationOptions
  ): Promise<Project> {
    const template = getTemplateById(options.templateId);
    if (!template) {
      throw new Error(`Template not found: ${options.templateId}`);
    }

    // Create the base project
    const project = await projectStorageService.createProject({
      name: options.projectName,
      description: options.description,
      user_id: userId,
      is_public: false,
      file_tree: [],
      settings: {
        language: template.languages[0] || 'javascript',
        framework: template.frameworks[0],
        theme: 'dark',
        ai_provider: 'auto',
        ai_model: 'gpt-4',
        auto_save: true,
        auto_save_interval: 30,
        template_id: template.id,
        template_name: template.name,
        user_inputs: options.userInputs
      }
    });

    // Generate file structure
    const fileTree = await this.generateFileStructure(
      template,
      options.projectName,
      options.userInputs
    );

    // Update project with generated files
    project.file_tree = fileTree;
    await projectStorageService.saveProject(project);

    return project;
  }

  /**
   * Generate file structure from template
   */
  private static async generateFileStructure(
    template: ProjectTemplate,
    projectName: string,
    userInputs: Record<string, any>
  ): Promise<FileNode[]> {
    const variables = {
      projectName,
      projectNameKebab: projectName.toLowerCase().replace(/\s+/g, '-'),
      projectNameCamel: projectName.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toLowerCase()),
      projectNamePascal: projectName.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^\w/, c => c.toUpperCase()),
      projectNameSnake: projectName.toLowerCase().replace(/\s+/g, '_'),
      ...userInputs
    };

    const fileNodes: FileNode[] = [];
    const fileMap = new Map<string, FileNode>();

    // Process file structure
    for (const node of template.scaffolding.fileStructure) {
      if (node.conditional && !this.evaluateCondition(node.conditional, variables)) {
        continue;
      }

      const processedPath = this.processTemplate(node.path, variables);
      const pathParts = processedPath.split('/');

      // Create intermediate directories
      let currentPath = '';
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += (currentPath ? '/' : '') + pathParts[i];

        if (!fileMap.has(currentPath)) {
          const dirNode: FileNode = {
            id: crypto.randomUUID(),
            name: pathParts[i],
            type: 'folder',
            path: currentPath,
            children: []
          };
          fileMap.set(currentPath, dirNode);

          if (i === 0) {
            fileNodes.push(dirNode);
          } else {
            const parentPath = pathParts.slice(0, i).join('/');
            const parent = fileMap.get(parentPath);
            if (parent && parent.children) {
              parent.children.push(dirNode);
            }
          }
        }
      }

      // Create the file/directory
      const fileNode: FileNode = {
        id: crypto.randomUUID(),
        name: pathParts[pathParts.length - 1],
        type: node.type === 'directory' ? 'folder' : 'file',
        path: processedPath,
        content: node.type === 'file' ? await this.generateFileContent(node, variables, template) : undefined,
        children: node.type === 'directory' ? [] : undefined
      };

      fileMap.set(processedPath, fileNode);

      if (pathParts.length === 1) {
        fileNodes.push(fileNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = fileMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(fileNode);
        }
      }
    }

    // Generate package.json or equivalent configuration files
    await this.generateConfigurationFiles(template, variables, fileNodes, fileMap);

    return fileNodes;
  }

  /**
   * Generate content for a file from template
   */
  private static async generateFileContent(
    node: FileStructureNode,
    variables: Record<string, any>,
    template: ProjectTemplate
  ): Promise<string> {
    if (node.content) {
      return this.processTemplate(node.content, variables);
    }

    if (node.template) {
      const templateContent = TEMPLATE_CODE_SNIPPETS[node.template];
      if (templateContent) {
        return this.processTemplate(templateContent, variables);
      }
    }

    // Generate default content based on file extension
    const extension = node.path.split('.').pop()?.toLowerCase();
    return this.generateDefaultContent(extension || '', variables, template);
  }

  /**
   * Generate default content for common file types
   */
  private static generateDefaultContent(
    extension: string,
    variables: Record<string, any>,
    template: ProjectTemplate
  ): string {
    switch (extension) {
      case 'json':
        if (variables.path?.includes('package.json')) {
          return this.generatePackageJson(template, variables);
        }
        return '{}';

      case 'md':
        return this.generateReadme(template, variables);

      case 'ts':
      case 'tsx':
        return this.generateTypeScriptFile(variables, template);

      case 'js':
      case 'jsx':
        return this.generateJavaScriptFile(variables, template);

      case 'swift':
        return this.generateSwiftFile(variables, template);

      case 'kt':
        return this.generateKotlinFile(variables, template);

      case 'cs':
        return this.generateCSharpFile(variables, template);

      case 'py':
        return this.generatePythonFile(variables, template);

      case 'gitignore':
        return this.generateGitignore(template);

      default:
        return '';
    }
  }

  /**
   * Generate package.json content
   */
  private static generatePackageJson(template: ProjectTemplate, variables: Record<string, any>): string {
    const packageJson = {
      name: variables.projectNameKebab,
      version: '1.0.0',
      description: variables.description || `A ${template.name} project`,
      main: 'index.js',
      scripts: template.scaffolding.scripts,
      dependencies: {},
      devDependencies: {}
    };

    // Add dependencies
    template.scaffolding.dependencies.forEach(dep => {
      if (dep.manager === 'npm') {
        const target = dep.type === 'devDependency' ? packageJson.devDependencies : packageJson.dependencies;
        target[dep.name] = dep.version || 'latest';
      }
    });

    return JSON.stringify(packageJson, null, 2);
  }

  /**
   * Generate README.md content
   */
  private static generateReadme(template: ProjectTemplate, variables: Record<string, any>): string {
    return `# ${variables.projectName}

${variables.description || `A ${template.name} project created with Ottokode AI IDE.`}

## Getting Started

This project was created using the **${template.name}** template.

### Prerequisites

- ${template.languages.join(', ')} development environment
${template.frameworks.length > 0 ? `- ${template.frameworks.join(', ')}` : ''}

### Installation

\`\`\`bash
# Install dependencies
${template.scaffolding.dependencies.some(d => d.manager === 'npm') ? 'npm install' : '# Follow platform-specific setup instructions'}
\`\`\`

### Development

\`\`\`bash
# Start development server
${template.scaffolding.scripts.dev || template.scaffolding.scripts.start || '# Platform-specific run command'}
\`\`\`

### Build

\`\`\`bash
# Build for production
${template.scaffolding.scripts.build || '# Platform-specific build command'}
\`\`\`

## Features

${template.tags.map(tag => `- ${tag.charAt(0).toUpperCase() + tag.slice(1)}`).join('\n')}

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

Created with ❤️ using [Ottokode AI IDE](https://ottokode.com)
`;
  }

  /**
   * Generate TypeScript file content
   */
  private static generateTypeScriptFile(variables: Record<string, any>, template: ProjectTemplate): string {
    if (template.category === 'web-frontend' || template.category === 'web-fullstack') {
      return `import React from 'react';

interface ${variables.projectNamePascal}Props {
  // Define your props here
}

const ${variables.projectNamePascal}: React.FC<${variables.projectNamePascal}Props> = () => {
  return (
    <div>
      <h1>Welcome to ${variables.projectName}</h1>
      <p>Your ${template.name} project is ready!</p>
    </div>
  );
};

export default ${variables.projectNamePascal};
`;
    }

    return `// ${variables.projectName}
// Generated by Ottokode AI IDE

export class ${variables.projectNamePascal} {
  constructor() {
    console.log('Welcome to ${variables.projectName}!');
  }

  public start(): void {
    // Your application logic here
  }
}

// Initialize the application
const app = new ${variables.projectNamePascal}();
app.start();
`;
  }

  /**
   * Generate JavaScript file content
   */
  private static generateJavaScriptFile(variables: Record<string, any>, template: ProjectTemplate): string {
    return `// ${variables.projectName}
// Generated by Ottokode AI IDE

class ${variables.projectNamePascal} {
  constructor() {
    console.log('Welcome to ${variables.projectName}!');
  }

  start() {
    // Your application logic here
  }
}

// Initialize the application
const app = new ${variables.projectNamePascal}();
app.start();
`;
  }

  /**
   * Generate Swift file content
   */
  private static generateSwiftFile(variables: Record<string, any>, template: ProjectTemplate): string {
    return `//
//  ${variables.projectNamePascal}.swift
//  ${variables.projectName}
//
//  Created by Ottokode AI IDE
//

import Foundation
import UIKit

class ${variables.projectNamePascal} {

    init() {
        print("Welcome to ${variables.projectName}!")
    }

    func start() {
        // Your application logic here
    }
}

// Initialize the application
let app = ${variables.projectNamePascal}()
app.start()
`;
  }

  /**
   * Generate Kotlin file content
   */
  private static generateKotlinFile(variables: Record<string, any>, template: ProjectTemplate): string {
    return `/**
 * ${variables.projectName}
 * Generated by Ottokode AI IDE
 */

package com.example.${variables.projectNameSnake}

class ${variables.projectNamePascal} {

    init {
        println("Welcome to ${variables.projectName}!")
    }

    fun start() {
        // Your application logic here
    }
}

// Initialize the application
fun main() {
    val app = ${variables.projectNamePascal}()
    app.start()
}
`;
  }

  /**
   * Generate C# file content
   */
  private static generateCSharpFile(variables: Record<string, any>, template: ProjectTemplate): string {
    return `//
// ${variables.projectNamePascal}.cs
// ${variables.projectName}
//
// Created by Ottokode AI IDE
//

using System;

namespace ${variables.projectNamePascal}
{
    public class ${variables.projectNamePascal}
    {
        public ${variables.projectNamePascal}()
        {
            Console.WriteLine("Welcome to ${variables.projectName}!");
        }

        public void Start()
        {
            // Your application logic here
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var app = new ${variables.projectNamePascal}();
            app.Start();
        }
    }
}
`;
  }

  /**
   * Generate Python file content
   */
  private static generatePythonFile(variables: Record<string, any>, template: ProjectTemplate): string {
    return `"""
${variables.projectName}
Generated by Ottokode AI IDE
"""

class ${variables.projectNamePascal}:
    def __init__(self):
        print("Welcome to ${variables.projectName}!")

    def start(self):
        """Your application logic here"""
        pass

# Initialize the application
if __name__ == "__main__":
    app = ${variables.projectNamePascal}()
    app.start()
`;
  }

  /**
   * Generate .gitignore content
   */
  private static generateGitignore(template: ProjectTemplate): string {
    const commonIgnores = [
      '# Dependencies',
      'node_modules/',
      'bower_components/',
      '',
      '# IDE files',
      '.vscode/',
      '.idea/',
      '*.swp',
      '*.swo',
      '*~',
      '',
      '# OS files',
      '.DS_Store',
      'Thumbs.db',
      '',
      '# Logs',
      '*.log',
      'logs/',
      '',
      '# Environment variables',
      '.env',
      '.env.local',
      '.env.*.local'
    ];

    // Add platform-specific ignores
    if (template.platforms.includes('ios')) {
      commonIgnores.push('', '# iOS', 'build/', 'DerivedData/', '*.xcuserstate');
    }

    if (template.platforms.includes('android')) {
      commonIgnores.push('', '# Android', 'build/', 'local.properties', '*.iml');
    }

    if (template.platforms.includes('web')) {
      commonIgnores.push('', '# Build outputs', 'dist/', 'build/', '.next/', 'out/');
    }

    if (template.category === 'game') {
      commonIgnores.push('', '# Unity', 'Library/', 'Temp/', 'Obj/', 'Build/', 'Builds/');
    }

    return commonIgnores.join('\n');
  }

  /**
   * Generate configuration files
   */
  private static async generateConfigurationFiles(
    template: ProjectTemplate,
    variables: Record<string, any>,
    fileNodes: FileNode[],
    fileMap: Map<string, FileNode>
  ): Promise<void> {
    for (const config of template.scaffolding.configuration) {
      const processedPath = this.processTemplate(config.path, variables);

      let content: string;
      if (typeof config.content === 'string') {
        content = this.processTemplate(config.content, variables);
      } else {
        content = JSON.stringify(config.content, null, 2);
      }

      const configNode: FileNode = {
        id: crypto.randomUUID(),
        name: processedPath.split('/').pop() || 'config',
        type: 'file',
        path: processedPath,
        content
      };

      // Add to appropriate location in file tree
      const pathParts = processedPath.split('/');
      if (pathParts.length === 1) {
        fileNodes.push(configNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = fileMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(configNode);
        }
      }

      fileMap.set(processedPath, configNode);
    }
  }

  /**
   * Process template strings with variables
   */
  private static processTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Evaluate conditional expressions
   */
  private static evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      // Simple evaluation - in production, use a safer expression evaluator
      const func = new Function(...Object.keys(variables), `return ${condition}`);
      return !!func(...Object.values(variables));
    } catch {
      return false;
    }
  }
}