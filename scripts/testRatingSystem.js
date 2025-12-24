/**
 * Doctor Rating System Test Suite
 * 
 * Run with: node scripts/testRatingSystem.js
 * Prerequisites: 
 *   1. Server running on localhost:5001
 *   2. Database seeded with: npm run db:seed
 * 
 * Uses seeded test data:
 *   - Patient 1: TCKN 22222222221 (Ali Öztürk)
 *   - Patient 2: TCKN 22222222222 (Ayşe Şahin)
 *   - Doctor:    TCKN 11111111111 (Ahmet Yılmaz - Kardiyoloji)
 *   - Admin:     TCKN 99999999999
 *   - Password:  Test1234!
 * 
 * Tests:
 * - POST /api/v1/appointments/:id/rate (rate appointment)
 * - GET /api/v1/appointments (with rating fields)
 * - GET /api/v1/doctors (with averageRating and totalRatings)
 * - Rating validations (DONE status, owner check, duplicate prevention, 1-5 range)
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const API_PREFIX = '/api/v1';

// Test credentials from seedDatabase.js
const TEST_PASSWORD = 'Test1234!';
const TEST_USERS = {
    patient1: { tckn: '22222222221', name: 'Ali Öztürk' },
    patient2: { tckn: '22222222222', name: 'Ayşe Şahin' },
    doctor: { tckn: '11111111111', name: 'Ahmet Yılmaz' },
    admin: { tckn: '99999999999', name: 'Admin User' },
};

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

// Test data
let patientToken = null;
let patient2Token = null;
let doctorToken = null;
let adminToken = null;
let testPatientId = null;
let testDoctorId = null;
let testAppointmentId = null; // DONE appointment
let testApprovedAppointmentId = null; // APPROVED appointment

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    log(`  ${title}`, colors.bold + colors.cyan);
    console.log('='.repeat(70));
}

async function test(name, fn) {
    try {
        await fn();
        passed++;
        log(`  ✓ ${name}`, colors.green);
        return true;
    } catch (error) {
        failed++;
        failedTests.push({ name, error: error.message, details: error.details });
        log(`  ✗ ${name}`, colors.red);
        log(`    Error: ${error.message}`, colors.yellow);
        if (error.details) {
            log(`    Details: ${JSON.stringify(error.details, null, 2)}`, colors.yellow);
        }
        return false;
    }
}

async function request(method, path, options = {}) {
    const fullPath = path.startsWith('/api') ? `${API_PREFIX}${path.slice(4)}` : path;
    const url = `${BASE_URL}${fullPath}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (options.token) {
        headers['Authorization'] = `Bearer ${options.token}`;
    }

    const fetchOptions = {
        method,
        headers,
    };

    if (options.body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    return { status: response.status, data };
}

function assert(condition, message, details = null) {
    if (!condition) {
        const error = new Error(message);
        error.details = details;
        throw error;
    }
}

async function setupTestData() {
    logSection('Setting Up Test Data');

    // Login as patient 1
    await test(`Login as patient 1 (${TEST_USERS.patient1.name})`, async () => {
        const res = await request('POST', '/api/auth/login', {
            body: { tckn: TEST_USERS.patient1.tckn, password: TEST_PASSWORD }
        });
        assert(res.status === 200, `Login should succeed - got ${res.status}`, res.data);
        assert(res.data.status === 'success', 'Response should be successful', res.data);
        patientToken = res.data.data.token;
        testPatientId = res.data.data.user.patientId; // Use patientId, not user.id
        log(`    Logged in as patient ID: ${testPatientId}`, colors.blue);
    });

    // Login as patient 2 (different patient)
    await test(`Login as patient 2 (${TEST_USERS.patient2.name})`, async () => {
        const res = await request('POST', '/api/auth/login', {
            body: { tckn: TEST_USERS.patient2.tckn, password: TEST_PASSWORD }
        });
        assert(res.status === 200, `Login should succeed - got ${res.status}`, res.data);
        assert(res.data.status === 'success', 'Response should be successful', res.data);
        patient2Token = res.data.data.token;
    });

    // Login as doctor
    await test(`Login as doctor (${TEST_USERS.doctor.name})`, async () => {
        const res = await request('POST', '/api/auth/personnel/login', {
            body: { tckn: TEST_USERS.doctor.tckn, password: TEST_PASSWORD }
        });
        assert(res.status === 200, `Login should succeed - got ${res.status}`, res.data);
        assert(res.data.status === 'success', 'Response should be successful', res.data);
        assert(res.data.data && res.data.data.token, 'Should have token', res.data);
        assert(res.data.data.user && res.data.data.user.doctorId, 'Should have doctor profile', res.data);
        doctorToken = res.data.data.token;
        testDoctorId = res.data.data.user.doctorId;
        log(`    Doctor ID: ${testDoctorId}`, colors.blue);
    });

    // Login as admin (skip if admin doesn't exist - not critical for rating tests)
    await test(`Login as admin (${TEST_USERS.admin.name})`, async () => {
        const res = await request('POST', '/api/auth/personnel/login', {
            body: { tckn: TEST_USERS.admin.tckn, password: TEST_PASSWORD }
        });
        if (res.status === 401) {
            log(`    Skipping - admin user not found (non-critical)`, colors.yellow);
            adminToken = null;
            return; // Pass the test even if admin doesn't exist
        }
        assert(res.status === 200, `Login should succeed - got ${res.status}`, res.data);
        assert(res.data.status === 'success', 'Response should be successful', res.data);
        adminToken = res.data.data.token;
    });

    // Create a DONE appointment for testing
    await test('Create appointment and set to DONE', async () => {
        // Create appointment as patient
        const createRes = await request('POST', '/api/appointments', {
            token: patientToken,
            body: {
                doctorId: testDoctorId,
                date: '01.01.2025',
                time: '10:00',
                status: 'APPROVED'
            }
        });
        assert(createRes.status === 201, 'Appointment creation should succeed');
        testAppointmentId = createRes.data.data.id;

        // Update to DONE status
        const updateRes = await request('PUT', `/api/appointments/${testAppointmentId}/status`, {
            token: doctorToken,
            body: { status: 'DONE' }
        });
        assert(updateRes.status === 200, 'Status update should succeed');
    });

    // Create an APPROVED appointment (not DONE)
    await test('Create APPROVED appointment', async () => {
        const res = await request('POST', '/api/appointments', {
            token: patientToken,
            body: {
                doctorId: testDoctorId,
                date: '02.01.2025',
                time: '11:00',
                status: 'APPROVED'
            }
        });
        assert(res.status === 201, 'Appointment creation should succeed');
        testApprovedAppointmentId = res.data.data.id;
    });
}

async function testRatingValidations() {
    logSection('Testing Rating Validations');

    await test('Should reject rating without authentication', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            body: { rating: 5 }
        });
        assert(res.status === 401, 'Should return 401 Unauthorized');
    });

    await test('Should reject rating from non-patient role', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: doctorToken,
            body: { rating: 5 }
        });
        assert(res.status === 403, 'Should return 403 Forbidden');
    });

    await test('Should reject rating below minimum (0)', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 0 }
        });
        assert(res.status === 400, 'Should return 400 Bad Request');
    });

    await test('Should reject rating above maximum (6)', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 6 }
        });
        assert(res.status === 400, 'Should return 400 Bad Request');
    });

    await test('Should reject non-integer rating (3.5)', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 3.5 }
        });
        assert(res.status === 400, 'Should return 400 Bad Request');
    });

    await test('Should reject rating without rating field', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patientToken,
            body: {}
        });
        assert(res.status === 400, 'Should return 400 Bad Request');
    });

    await test('Should reject rating of non-DONE appointment', async () => {
        const res = await request('POST', `/api/appointments/${testApprovedAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 5 }
        });
        assert(res.status === 400, 'Should return 400 Bad Request');
        assert(res.data.message.includes('tamamlanmış'), 'Error message should mention completed appointments');
    });

    await test('Should reject rating from non-owner patient', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patient2Token,
            body: { rating: 5 }
        });
        assert(res.status === 403, 'Should return 403 Forbidden');
        assert(res.data.message.includes('sahibi'), 'Error message should mention owner');
    });

    await test('Should reject rating of non-existent appointment', async () => {
        const res = await request('POST', '/api/appointments/99999/rate', {
            token: patientToken,
            body: { rating: 5 }
        });
        assert(res.status === 404, 'Should return 404 Not Found');
    });
}

async function testSuccessfulRating() {
    logSection('Testing Successful Rating Flow');

    await test('Should successfully rate a DONE appointment', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 4 }
        });
        assert(res.status === 200, 'Should return 200 OK', res.data);
        assert(res.data.status === 'success', 'Response should be successful', res.data);
        assert(res.data.data.rating === 4, 'Rating should be 4', res.data);
        assert(res.data.data.ratedAt, 'Should have ratedAt timestamp', res.data);
        assert(res.data.message && res.data.message.includes('başarıyla'), 'Should have success message', res.data);
    });

    await test('Should reject duplicate rating on same appointment', async () => {
        const res = await request('POST', `/api/appointments/${testAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 5 }
        });
        assert(res.status === 400, 'Should return 400 Bad Request');
        assert(res.data.message.includes('zaten değerlendirilmiş'), 'Error should mention already rated');
    });
}

async function testAppointmentListWithRatings() {
    logSection('Testing Appointment List with Rating Fields');

    await test('Should include rating fields in appointment list', async () => {
        const res = await request('GET', `/api/appointments?list=true&patientId=${testPatientId}`, {
            token: patientToken
        });
        assert(res.status === 200, 'Should return 200 OK', res.data);
        assert(Array.isArray(res.data.data), 'Should return array of appointments', res.data);
        
        log(`    Found ${res.data.data.length} appointments for patient ${testPatientId}`, colors.blue);
        log(`    Looking for appointment ID: ${testAppointmentId}`, colors.blue);
        
        const ratedAppointment = res.data.data.find(app => app.id === testAppointmentId);
        assert(ratedAppointment, `Should find the rated appointment ID ${testAppointmentId}`, {
            appointmentIds: res.data.data.map(a => a.id),
            searchingFor: testAppointmentId
        });
        assert(ratedAppointment.rating === 4, 'Should have rating value', ratedAppointment);
        assert(ratedAppointment.ratedAt, 'Should have ratedAt timestamp', ratedAppointment);
        
        log(`    ✓ Found rated appointment with rating: ${ratedAppointment.rating}`, colors.green);
        
        const unratedAppointment = res.data.data.find(app => app.id === testApprovedAppointmentId);
        if (unratedAppointment) {
            assert(unratedAppointment.rating === null, 'Unrated appointment should have null rating');
            assert(unratedAppointment.ratedAt === null, 'Unrated appointment should have null ratedAt');
        }
    });
}

async function testDoctorListWithRatings() {
    logSection('Testing Doctor List with Rating Statistics');

    await test('Should include rating statistics in doctor list', async () => {
        const res = await request('GET', '/api/doctors');
        assert(res.status === 200, 'Should return 200 OK');
        assert(Array.isArray(res.data.data), 'Should return array of doctors');
        
        const doctor = res.data.data.find(doc => doc.id === testDoctorId);
        assert(doctor, 'Should find the test doctor');
        assert('averageRating' in doctor, 'Doctor should have averageRating field');
        assert('totalRatings' in doctor, 'Doctor should have totalRatings field');
        
        // Our test doctor should have at least 1 rating now
        if (doctor.totalRatings > 0) {
            assert(doctor.averageRating !== null, 'Doctor with ratings should have non-null averageRating');
            assert(doctor.averageRating >= 1 && doctor.averageRating <= 5, 'Average rating should be between 1-5');
            log(`    Doctor rating: ${doctor.averageRating}/5 (${doctor.totalRatings} reviews)`, colors.blue);
        }
    });
}

async function testMultipleRatingsCalculation() {
    logSection('Testing Average Rating Calculation with Multiple Ratings');

    // Create and rate another appointment to test average calculation
    let secondAppointmentId;
    
    await test('Create second DONE appointment', async () => {
        const createRes = await request('POST', '/api/appointments', {
            token: patientToken,
            body: {
                doctorId: testDoctorId,
                date: '03.01.2025',
                time: '14:00',
                status: 'APPROVED'
            }
        });
        assert(createRes.status === 201, 'Appointment creation should succeed');
        secondAppointmentId = createRes.data.data.id;

        const updateRes = await request('PUT', `/api/appointments/${secondAppointmentId}/status`, {
            token: doctorToken,
            body: { status: 'DONE' }
        });
        assert(updateRes.status === 200, 'Status update should succeed');
    });

    await test('Rate second appointment with different rating', async () => {
        const res = await request('POST', `/api/appointments/${secondAppointmentId}/rate`, {
            token: patientToken,
            body: { rating: 5 }
        });
        assert(res.status === 200, 'Rating should succeed');
    });

    await test('Verify doctor average rating is updated correctly', async () => {
        const res = await request('GET', '/api/doctors');
        const doctor = res.data.data.find(doc => doc.id === testDoctorId);
        
        assert(doctor.totalRatings >= 2, 'Doctor should have at least 2 ratings');
        assert(doctor.averageRating !== null, 'Doctor should have averageRating');
        
        // With ratings of 4 and 5, average should be 4.5
        const expectedAverage = (4 + 5) / 2;
        assert(Math.abs(doctor.averageRating - expectedAverage) < 0.1, 
            `Average rating should be approximately ${expectedAverage}, got ${doctor.averageRating}`);
        
        log(`    Verified: ${doctor.totalRatings} ratings, average = ${doctor.averageRating}`, colors.blue);
    });
}

async function runTests() {
    log('\n🚀 Starting Doctor Rating System Tests...\n', colors.bold + colors.cyan);

    try {
        await setupTestData();
        await testRatingValidations();
        await testSuccessfulRating();
        await testAppointmentListWithRatings();
        await testDoctorListWithRatings();
        await testMultipleRatingsCalculation();
    } catch (error) {
        log(`\n❌ Test suite error: ${error.message}`, colors.red);
    }

    // Print summary
    logSection('Test Summary');
    log(`Total Tests: ${passed + failed}`, colors.blue);
    log(`Passed: ${passed}`, colors.green);
    log(`Failed: ${failed}`, colors.red);

    if (failed > 0) {
        log('\nFailed Tests:', colors.yellow);
        failedTests.forEach(({ name, error }) => {
            log(`  ✗ ${name}`, colors.red);
            log(`    ${error}`, colors.yellow);
        });
    }

    const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
    log(`\nSuccess Rate: ${successRate}%`, successRate === '100.0' ? colors.green : colors.yellow);

    if (failed === 0) {
        log('\n✅ All tests passed! Rating system is working correctly.', colors.bold + colors.green);
    } else {
        log('\n❌ Some tests failed. Please review the errors above.', colors.bold + colors.red);
        process.exit(1);
    }
}

// Run tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, colors.bold + colors.red);
    console.error(error);
    process.exit(1);
});

