/**
 * BasePath Implementation Tests
 * 
 * Run this script to verify basepath utilities work correctly
 * Usage: npx tsx scripts/test-basepath.ts
 */

import {
    getBasePath,
    withBasePath,
    apiUrl,
    removeBasePath,
    isExternalPath,
    getFullUrl
} from '../lib/basepath';

// Test configuration
const TEST_CASES = [
    {
        name: 'Root deployment (no basePath)',
        env: { NEXT_PUBLIC_BASE_PATH: '' },
        tests: [
            { fn: 'getBasePath', args: [], expected: '' },
            { fn: 'withBasePath', args: ['/dashboard'], expected: '/dashboard' },
            { fn: 'withBasePath', args: ['/api/users'], expected: '/api/users' },
            { fn: 'apiUrl', args: ['/users'], expected: '/api/users' },
            { fn: 'apiUrl', args: ['users'], expected: '/api/users' },
            { fn: 'removeBasePath', args: ['/dashboard'], expected: '/dashboard' },
        ]
    },
    {
        name: 'Subpath deployment (/sso)',
        env: { NEXT_PUBLIC_BASE_PATH: '/sso' },
        tests: [
            { fn: 'getBasePath', args: [], expected: '/sso' },
            { fn: 'withBasePath', args: ['/dashboard'], expected: '/sso/dashboard' },
            { fn: 'withBasePath', args: ['/api/users'], expected: '/sso/api/users' },
            { fn: 'apiUrl', args: ['/users'], expected: '/sso/api/users' },
            { fn: 'apiUrl', args: ['users'], expected: '/sso/api/users' },
            { fn: 'removeBasePath', args: ['/sso/dashboard'], expected: '/dashboard' },
            { fn: 'removeBasePath', args: ['/dashboard'], expected: '/dashboard' },
        ]
    },
    {
        name: 'External path detection',
        env: { NEXT_PUBLIC_BASE_PATH: '/sso' },
        tests: [
            { fn: 'isExternalPath', args: ['https://example.com'], expected: true },
            { fn: 'isExternalPath', args: ['http://example.com'], expected: true },
            { fn: 'isExternalPath', args: ['/dashboard'], expected: false },
            { fn: 'isExternalPath', args: ['dashboard'], expected: false },
        ]
    }
];

// Function map
const FUNCTIONS: Record<string, Function> = {
    getBasePath,
    withBasePath,
    apiUrl,
    removeBasePath,
    isExternalPath,
    getFullUrl,
};

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Run tests
function runTests() {
    log('\n🧪 Running BasePath Implementation Tests\n', 'cyan');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    for (const testCase of TEST_CASES) {
        log(`\n📦 ${testCase.name}`, 'blue');
        log('─'.repeat(50), 'blue');

        // Set environment variables
        for (const [key, value] of Object.entries(testCase.env)) {
            process.env[key] = value;
        }

        for (const test of testCase.tests) {
            totalTests++;
            const fn = FUNCTIONS[test.fn];

            if (!fn) {
                log(`  ❌ Function ${test.fn} not found`, 'red');
                failedTests++;
                continue;
            }

            try {
                const result = fn(...test.args);
                const passed = result === test.expected;

                if (passed) {
                    log(`  ✅ ${test.fn}(${test.args.map(a => JSON.stringify(a)).join(', ')}) = ${JSON.stringify(result)}`, 'green');
                    passedTests++;
                } else {
                    log(`  ❌ ${test.fn}(${test.args.map(a => JSON.stringify(a)).join(', ')})`, 'red');
                    log(`     Expected: ${JSON.stringify(test.expected)}`, 'yellow');
                    log(`     Got:      ${JSON.stringify(result)}`, 'yellow');
                    failedTests++;
                }
            } catch (error) {
                log(`  ❌ ${test.fn}(${test.args.map(a => JSON.stringify(a)).join(', ')}) threw error:`, 'red');
                log(`     ${error instanceof Error ? error.message : String(error)}`, 'yellow');
                failedTests++;
            }
        }
    }

    // Summary
    log('\n' + '═'.repeat(50), 'cyan');
    log('📊 Test Summary', 'cyan');
    log('═'.repeat(50), 'cyan');
    log(`Total Tests:  ${totalTests}`, 'blue');
    log(`Passed:       ${passedTests}`, 'green');
    log(`Failed:       ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`,
        failedTests === 0 ? 'green' : 'yellow');

    // Exit with appropriate code
    process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runTests();
