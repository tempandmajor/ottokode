#!/usr/bin/env node

/**
 * Quick Health Check
 *
 * Runs a fast health check of the system without full integration tests
 */

const { spawn } = require('child_process');
const { promises: fs } = require('fs');
const path = require('path');

async function quickHealthCheck() {
  console.log('🏥 Quick Health Check');
  console.log('═'.repeat(40));

  const checks = [
    {
      name: 'Node.js Version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return {
          passed: major >= 18,
          message: major >= 18 ? `✅ ${version}` : `❌ ${version} (requires 18+)`,
          critical: true
        };
      }
    },
    {
      name: 'NPM Available',
      check: async () => {
        try {
          const result = await runCommand('npm', ['--version']);
          return {
            passed: result.code === 0,
            message: result.code === 0 ? `✅ ${result.stdout.trim()}` : '❌ Not available',
            critical: true
          };
        } catch {
          return { passed: false, message: '❌ Not available', critical: true };
        }
      }
    },
    {
      name: 'Rust Toolchain',
      check: async () => {
        try {
          const result = await runCommand('rustc', ['--version']);
          return {
            passed: result.code === 0,
            message: result.code === 0 ? `✅ ${result.stdout.trim()}` : '❌ Not available',
            critical: true
          };
        } catch {
          return { passed: false, message: '❌ Not available', critical: true };
        }
      }
    },
    {
      name: 'Essential Config Files',
      check: async () => {
        const files = ['package.json', 'tsconfig.json', 'src-tauri/Cargo.toml'];
        let allExist = true;
        let missing = [];

        for (const file of files) {
          try {
            await fs.access(file);
          } catch {
            allExist = false;
            missing.push(file);
          }
        }

        return {
          passed: allExist,
          message: allExist ? '✅ All present' : `❌ Missing: ${missing.join(', ')}`,
          critical: true
        };
      }
    },
    {
      name: 'Environment Variables',
      check: () => {
        const required = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'OPENAI_API_KEY'
        ];

        const missing = required.filter(env => !process.env[env]);

        return {
          passed: missing.length === 0,
          message: missing.length === 0 ? '✅ All set' : `❌ Missing: ${missing.join(', ')}`,
          critical: false
        };
      }
    },
    {
      name: 'TypeScript Compilation',
      check: async () => {
        try {
          const result = await runCommand('npx', ['tsc', '--noEmit'], 30000);
          return {
            passed: result.code === 0,
            message: result.code === 0 ? '✅ Compiles cleanly' : '❌ Type errors found',
            critical: false
          };
        } catch {
          return { passed: false, message: '❌ Compilation failed', critical: false };
        }
      }
    },
    {
      name: 'Dependencies Installed',
      check: async () => {
        try {
          const nodeModulesExists = await fs.access('node_modules').then(() => true, () => false);
          const webAppNodeModulesExists = await fs.access('web-app/node_modules').then(() => true, () => false);

          const allInstalled = nodeModulesExists && webAppNodeModulesExists;
          return {
            passed: allInstalled,
            message: allInstalled ? '✅ Dependencies installed' : '❌ Run npm install',
            critical: true
          };
        } catch {
          return { passed: false, message: '❌ Dependencies not installed', critical: true };
        }
      }
    }
  ];

  let totalChecks = 0;
  let passedChecks = 0;
  let criticalFailed = 0;
  const results = [];

  console.log('Running health checks...\n');

  for (const healthCheck of checks) {
    try {
      const result = await healthCheck.check();
      results.push({ ...result, name: healthCheck.name });

      console.log(`${result.message.includes('✅') ? '✅' : '❌'} ${healthCheck.name}: ${result.message.replace(/[✅❌] ?/, '')}`);

      totalChecks++;
      if (result.passed) {
        passedChecks++;
      } else if (result.critical) {
        criticalFailed++;
      }
    } catch (error) {
      console.log(`❌ ${healthCheck.name}: Error - ${error.message}`);
      totalChecks++;
      criticalFailed++;
      results.push({
        passed: false,
        message: `Error: ${error.message}`,
        name: healthCheck.name,
        critical: true
      });
    }
  }

  console.log('\n' + '═'.repeat(40));
  console.log(`📊 Health Check Summary:`);
  console.log(`   Total Checks: ${totalChecks}`);
  console.log(`   ✅ Passed: ${passedChecks}`);
  console.log(`   ❌ Failed: ${totalChecks - passedChecks}`);
  console.log(`   🚨 Critical Issues: ${criticalFailed}`);

  const healthScore = Math.round((passedChecks / totalChecks) * 100);
  console.log(`   📈 Health Score: ${healthScore}%`);

  console.log('\n🎯 Overall Status:');
  if (criticalFailed === 0 && healthScore >= 90) {
    console.log('🎉 EXCELLENT - System is ready for development and testing');
  } else if (criticalFailed === 0 && healthScore >= 70) {
    console.log('✅ GOOD - System is functional with minor issues');
  } else if (criticalFailed === 0) {
    console.log('⚠️  FAIR - System works but has several issues to address');
  } else {
    console.log('🚨 CRITICAL - System has critical issues that must be resolved');
  }

  // Quick recommendations
  const failedCritical = results.filter(r => !r.passed && r.critical);
  if (failedCritical.length > 0) {
    console.log('\n🔧 Immediate Actions Required:');
    failedCritical.forEach(check => {
      console.log(`   • Fix ${check.name}`);
    });
  }

  const failedNonCritical = results.filter(r => !r.passed && !r.critical);
  if (failedNonCritical.length > 0) {
    console.log('\n💡 Recommended Actions:');
    failedNonCritical.forEach(check => {
      console.log(`   • Address ${check.name}`);
    });
  }

  console.log('\n🔄 Next Steps:');
  if (criticalFailed === 0) {
    console.log('   Run full integration tests: npm run test:integration');
  } else {
    console.log('   Fix critical issues first, then re-run: npm run health');
  }

  return {
    healthy: criticalFailed === 0,
    score: healthScore,
    criticalIssues: criticalFailed,
    results
  };
}

function runCommand(command, args, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Command timeout'));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      resolve({ code: code || 0, stdout, stderr });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

// Run the health check
quickHealthCheck()
  .then(result => {
    process.exit(result.healthy ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  });