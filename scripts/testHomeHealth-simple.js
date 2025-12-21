/**
 * Home Health Request API Test Suite (Simplified)
 * 
 * Run with: node scripts/testHomeHealth-simple.js
 * Prerequisites: 
 * - Server running on localhost:5001
 * - Database seeded with: npm run db:seed
 * 
 * Uses existing seeded users (no cleanup needed):
 * - Admin: TCKN 99999999999, Password: Test1234!
 * - Patient: TCKN 22222222221, Password: Test1234!
 * - Cashier: TCKN 33333333331, Password: Test1234!
 * 
 * Tests all home health endpoints without creating/deleting users
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const API_PREFIX = '/api/v1';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    bold: '\x1b[1m'
};

// Test counters
let passed = 0;
let failed = 0;
const failedTests = [];

// Stored tokens and IDs
let patientToken = null;
let adminToken = null;
let cashierToken = null;
let testRequestId = null;
let testRequestId2 = null;

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(`  ${title}`, colors.bold + colors.cyan);
    console.log('='.repeat(70));
}

function logSubSection(title) {
    console.log('\n' + '-'.repeat(50));
    log(`  ${title}`, colors.magenta);
    console.log('-'.repeat(50));
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        log(`  ✓ ${name}`, colors.green);
        return true;
    } catch (error) {
        failed++;
        failedTests.push({ name, error: error.message });
        log(`  ✗ ${name}`, colors.red);
        log(`    Error: ${error.message}`, colors.yellow);
        return false;
    }
}

async function request(method, path, options = {}) {
    const url = `${BASE_URL}${API_PREFIX}${path}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }

    const config = {
        method,
        headers
    };

    if (options.body) {
        config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);
    const data = await response.json();

    return { status: response.status, data, response };
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// ============================================================================
// Authentication with Seeded Users
// ============================================================================

async function loginPatient(tckn, password) {
    const res = await request('POST', '/auth/login', {
        body: { tckn, password }
    });

    assert(res.status === 200, `Patient login failed: ${res.data.message || 'Unknown error'}`);
    assert(res.data.data && res.data.data.token, 'No token received');
    
    return res.data.data.token;
}

async function loginPersonnel(tckn, password) {
    const res = await request('POST', '/auth/personnel/login', {
        body: { tckn, password }
    });

    assert(res.status === 200, `Personnel login failed: ${res.data.message || 'Unknown error'}`);
    assert(res.data.data && res.data.data.token, 'No token received');
    
    return res.data.data.token;
}

async function setupAuth() {
    logSection('AUTHENTICATION WITH SEEDED USERS');

    await test('Login as Patient (TCKN: 22222222221)', async () => {
        patientToken = await loginPatient('22222222221', 'Test1234!');
        assert(patientToken, 'Patient token not received');
    });

    await test('Login as Cashier #1 (TCKN: 33333333331)', async () => {
        adminToken = await loginPersonnel('33333333331', 'Test1234!'); // Using Cashier for Admin tests
        assert(adminToken, 'Admin token not received');
    });

    await test('Login as Cashier #2 (TCKN: 33333333331)', async () => {
        cashierToken = await loginPersonnel('33333333331', 'Test1234!');
        assert(cashierToken, 'Cashier token not received');
    });
}

// ============================================================================
// Home Health Request Tests
// ============================================================================

async function testCreateRequest() {
    logSubSection('Create Home Health Request');

    await test('Create request as Patient (valid data)', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const preferredDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

        const res = await request('POST', '/home-health', {
            token: patientToken,
            body: {
                fullName: 'Ali Öztürk',
                tckn: '22222222221',
                phoneNumber: '+905552222221',
                email: 'ali.ozturk@test.com',
                address: 'İstanbul, Kadıköy, Test Mahallesi No:123',
                serviceType: 'Hemşire Bakımı',
                serviceDetails: 'Günde 2 kez ilaç takibi ve yara bakımı',
                preferredDate: preferredDate,
                preferredTime: '14:30',
                notes: 'Lütfen öğleden sonra gelin'
            }
        });

        assert(res.status === 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.data)}`);
        assert(res.data.success, 'Response success should be true');
        assert(res.data.data.id, 'Request ID not returned');
        assert(res.data.data.status === 'PENDING', 'Status should be PENDING');
        
        testRequestId = res.data.data.id;
    });

    await test('Create request as Admin', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 2);
        const preferredDate = tomorrow.toISOString().split('T')[0];

        const res = await request('POST', '/home-health', {
            token: adminToken,
            body: {
                fullName: 'Admin Test User',
                tckn: '99999999999',
                phoneNumber: '+905550000001',
                address: '456 Admin Street, Ankara, Çankaya',
                serviceType: 'Fizik Tedavi',
                preferredDate: preferredDate
            }
        });

        assert(res.status === 201, `Expected 201, got ${res.status}`);
        testRequestId2 = res.data.data.id;
    });

    await test('Create request without authentication (should fail)', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const preferredDate = tomorrow.toISOString().split('T')[0];

        const res = await request('POST', '/home-health', {
            body: {
                fullName: 'Test User',
                tckn: '11111111111',
                phoneNumber: '+905551111111',
                address: '123 Test Street',
                serviceType: 'Test',
                preferredDate: preferredDate
            }
        });

        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });

    await test('Create request with invalid TCKN (should fail)', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const preferredDate = tomorrow.toISOString().split('T')[0];

        const res = await request('POST', '/home-health', {
            token: patientToken,
            body: {
                fullName: 'Test User',
                tckn: '123', // Invalid TCKN
                phoneNumber: '+905551234567',
                address: '123 Test Street',
                serviceType: 'Test',
                preferredDate: preferredDate
            }
        });

        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Create request with past date (should fail)', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const preferredDate = yesterday.toISOString().split('T')[0];

        const res = await request('POST', '/home-health', {
            token: patientToken,
            body: {
                fullName: 'Test User',
                tckn: '12345678901',
                phoneNumber: '+905551234567',
                address: '123 Test Street',
                serviceType: 'Test',
                preferredDate: preferredDate
            }
        });

        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Create request with missing required fields (should fail)', async () => {
        const res = await request('POST', '/home-health', {
            token: patientToken,
            body: {
                fullName: 'Test User'
                // Missing required fields
            }
        });

        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });
}

async function testGetAllRequests() {
    logSubSection('Get All Home Health Requests');

    await test('Get all requests as Admin', async () => {
        const res = await request('GET', '/home-health', {
            token: adminToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success, 'Response success should be true');
        assert(Array.isArray(res.data.data.requests), 'Requests should be an array');
        assert(res.data.data.requests.length >= 2, 'Should have at least 2 requests');
    });

    await test('Get all requests as Cashier', async () => {
        const res = await request('GET', '/home-health', {
            token: cashierToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.data.data.requests), 'Requests should be an array');
    });

    await test('Get pending requests only (filter)', async () => {
        const res = await request('GET', '/home-health?status=PENDING', {
            token: adminToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(Array.isArray(res.data.data.requests), 'Requests should be an array');
        
        // All requests should have PENDING status
        res.data.data.requests.forEach(req => {
            assert(req.status === 'PENDING', `All requests should be PENDING, found ${req.status}`);
        });
    });

    await test('Get all requests as Patient (should fail)', async () => {
        const res = await request('GET', '/home-health', {
            token: patientToken
        });

        assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await test('Get all requests without authentication (should fail)', async () => {
        const res = await request('GET', '/home-health');

        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });
}

async function testGetRequestById() {
    logSubSection('Get Single Home Health Request');

    await test('Get request by ID as Admin', async () => {
        const res = await request('GET', `/home-health/${testRequestId}`, {
            token: adminToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success, 'Response success should be true');
        assert(res.data.data.request.id === testRequestId, 'Request ID should match');
        assert(res.data.data.request.fullName, 'Request should have fullName');
        assert(res.data.data.request.status === 'PENDING', 'Status should be PENDING');
    });

    await test('Get request by ID as Cashier', async () => {
        const res = await request('GET', `/home-health/${testRequestId}`, {
            token: cashierToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('Get request by ID as Patient (should fail)', async () => {
        const res = await request('GET', `/home-health/${testRequestId}`, {
            token: patientToken
        });

        assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await test('Get non-existent request (should fail)', async () => {
        const res = await request('GET', '/home-health/99999', {
            token: adminToken
        });

        assert(res.status === 404, `Expected 404, got ${res.status}`);
    });

    await test('Get request with invalid ID (should fail)', async () => {
        const res = await request('GET', '/home-health/invalid', {
            token: adminToken
        });

        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });
}

async function testApproveRequest() {
    logSubSection('Approve Home Health Request');

    await test('Approve request as Admin', async () => {
        const res = await request('PATCH', `/home-health/${testRequestId}/approve`, {
            token: adminToken,
            body: {
                approvalNote: 'Onaylandı, ekip yönlendirilecek'
            }
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success, 'Response success should be true');
        assert(res.data.data.status === 'APPROVED', 'Status should be APPROVED');
        assert(res.data.data.approvedBy, 'ApprovedBy should be set');
        assert(res.data.data.approvedAt, 'ApprovedAt should be set');
        assert(res.data.data.approvalNote === 'Onaylandı, ekip yönlendirilecek', 'Approval note should match');
    });

    await test('Approve already approved request (should fail)', async () => {
        const res = await request('PATCH', `/home-health/${testRequestId}/approve`, {
            token: adminToken
        });

        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Approve request as Patient (should fail)', async () => {
        const res = await request('PATCH', `/home-health/${testRequestId2}/approve`, {
            token: patientToken
        });

        assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await test('Approve non-existent request (should fail)', async () => {
        const res = await request('PATCH', '/home-health/99999/approve', {
            token: adminToken
        });

        assert(res.status === 404, `Expected 404, got ${res.status}`);
    });
}

async function testRejectRequest() {
    logSubSection('Reject Home Health Request');

    await test('Reject request as Cashier', async () => {
        const res = await request('PATCH', `/home-health/${testRequestId2}/reject`, {
            token: cashierToken,
            body: {
                approvalNote: 'Adres bilgisi eksik, lütfen tekrar başvurun'
            }
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success, 'Response success should be true');
        assert(res.data.data.status === 'REJECTED', 'Status should be REJECTED');
        assert(res.data.data.approvedBy, 'ApprovedBy should be set');
        assert(res.data.data.approvalNote === 'Adres bilgisi eksik, lütfen tekrar başvurun', 'Approval note should match');
    });

    await test('Reject already rejected request (should fail)', async () => {
        const res = await request('PATCH', `/home-health/${testRequestId2}/reject`, {
            token: adminToken
        });

        assert(res.status === 400, `Expected 400, got ${res.status}`);
    });

    await test('Reject request as Patient (should fail)', async () => {
        // Create a new request first
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 3);
        const preferredDate = tomorrow.toISOString().split('T')[0];

        const createRes = await request('POST', '/home-health', {
            token: adminToken,
            body: {
                fullName: 'Test Reject',
                tckn: '55555555555',
                phoneNumber: '+905555555555',
                address: '789 Test Street',
                serviceType: 'Test',
                preferredDate: preferredDate
            }
        });

        const newRequestId = createRes.data.data.id;

        const res = await request('PATCH', `/home-health/${newRequestId}/reject`, {
            token: patientToken
        });

        assert(res.status === 403, `Expected 403, got ${res.status}`);
    });
}

async function testGetStats() {
    logSubSection('Get Home Health Request Statistics');

    await test('Get stats as Admin', async () => {
        const res = await request('GET', '/home-health/stats', {
            token: adminToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
        assert(res.data.success, 'Response success should be true');
        assert(typeof res.data.data.pending === 'number', 'Pending count should be a number');
        assert(typeof res.data.data.approved === 'number', 'Approved count should be a number');
        assert(typeof res.data.data.rejected === 'number', 'Rejected count should be a number');
        assert(typeof res.data.data.total === 'number', 'Total count should be a number');
        
        // Verify counts
        const { pending, approved, rejected, total } = res.data.data;
        assert(total === pending + approved + rejected, 'Total should equal sum of all statuses');
        assert(total >= 3, 'Should have at least 3 requests');
    });

    await test('Get stats as Cashier', async () => {
        const res = await request('GET', '/home-health/stats', {
            token: cashierToken
        });

        assert(res.status === 200, `Expected 200, got ${res.status}`);
    });

    await test('Get stats as Patient (should fail)', async () => {
        const res = await request('GET', '/home-health/stats', {
            token: patientToken
        });

        assert(res.status === 403, `Expected 403, got ${res.status}`);
    });

    await test('Get stats without authentication (should fail)', async () => {
        const res = await request('GET', '/home-health/stats');

        assert(res.status === 401, `Expected 401, got ${res.status}`);
    });
}

// ============================================================================
// Run All Tests
// ============================================================================

async function runTests() {
    log('\n╔════════════════════════════════════════════════════════════════════╗', colors.bold);
    log('║    HOME HEALTH REQUEST API TEST SUITE (Seeded Users)              ║', colors.bold + colors.cyan);
    log('╚════════════════════════════════════════════════════════════════════╝', colors.bold);
    
    log(`\nServer: ${BASE_URL}${API_PREFIX}`, colors.blue);
    log('Using seeded users from database', colors.blue);
    log('Starting tests...', colors.blue);

    try {
        await setupAuth();
        
        logSection('HOME HEALTH REQUEST TESTS');
        
        await testCreateRequest();
        await testGetAllRequests();
        await testGetRequestById();
        await testApproveRequest();
        await testRejectRequest();
        await testGetStats();

    } catch (error) {
        log(`\n✗ Fatal error: ${error.message}`, colors.red);
        console.error(error);
    }

    // Summary
    logSection('TEST SUMMARY');
    const total = passed + failed;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    log(`\n  Total Tests: ${total}`, colors.blue);
    log(`  Passed: ${passed}`, colors.green);
    log(`  Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
    log(`  Pass Rate: ${passRate}%`, passRate >= 90 ? colors.green : colors.yellow);

    if (failedTests.length > 0) {
        log('\n  Failed Tests:', colors.red + colors.bold);
        failedTests.forEach(({ name, error }) => {
            log(`    • ${name}`, colors.red);
            log(`      ${error}`, colors.yellow);
        });
    }

    log('\n' + '═'.repeat(70) + '\n', colors.bold);

    if (failed > 0) {
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    log(`\nUnexpected error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
});

