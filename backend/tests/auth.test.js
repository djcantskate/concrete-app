// tests/auth.test.js
// Tests for Concrete's authentication routes

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set a test-only JWT secret before importing the app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'concrete-test-secret';

const app = require('../app.js');
const User = require('../models/User.js');

let mongoServer;

// Start a temporary MongoDB database before the tests
before(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    // Make sure MongoDB creates the User model's unique indexes
    await User.init();
});

// Clear users before each test so tests don't affect one another
beforeEach(async () => {
    await User.deleteMany({});
});

// Disconnect and shut down the temporary database after testing
after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

test('connects to the temporary test database', () => {
    assert.equal(mongoose.connection.readyState, 1);
});

test('POST /register creates a new user account', async () => {
    const response = await request(app)
    .post('/register')
    .send({
        username: 'testuser',
        password: 'testpassword',
        email: 'test@email.com',
    });

    // Verify HTTP response
    assert.equal(response.status, 201);
    assert.equal(response.body.user.username, 'testuser');
    assert.equal(response.body.user.email, 'test@email.com');
    assert.ok(response.body.token);

    //Verify user was saved to MongoDB
    const savedUser = await User.findOne({ username: 'testuser' });

    assert.ok(savedUser);
    assert.notEqual(savedUser.password, 'testpassword');
});

test('POST /register rejects an existing username or email', async () => {
    // Create first account
    await request(app)
        .post('/register')
        .send({
            username: 'testuser',
            password: 'testpassword',
            email: 'test@email.com',
        });

    // Attempt to register with the same username and email
    const response = await request(app)
        .post('/register')
        .send({
            username: 'testuser',
            password: 'testpassword',
            email: 'test@email.com',
        });

    assert.equal(response.status, 409);
    assert.equal(response.body.error, 'Username or email already taken');

    // Confirm only one account exists
    const userCount = await User.countDocuments();
    assert.equal(userCount, 1);
});

test('POST /register rejects invalid registration data', async () => {
    const invalidRequests = [
        {
            // Missing email
            username: 'testuser',
            password: 'password123',
        },
        {
            // Invalid email
            username: 'testuser',
            password: 'password123',
            email: 'invalid-email',
        },
        {
            // Username is too short
            username: 'ab',
            password: 'password123',
            email: 'test@example.com',
        },
        {
            // Password is too short
            username: 'testuser',
            password: 'short',
            email: 'test@example.com',
        },
    ];

    for (const userData of invalidRequests) {
        const response = await request(app)
            .post('/register')
            .send(userData);

        assert.equal(response.status, 400);
    }

    // None of the invalid requests should create an account
    const userCount = await User.countDocuments();
    assert.equal(userCount, 0);
});

test('POST /login authenticates a user with their username', async () => {
    // Create account first
    await request(app)
        .post('/register')
        .send({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com',
        });

    // Try logging in
    const response = await request(app)
        .post('/login')
        .send({
            username: 'testuser',
            password: 'password123',
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Login successful');
    assert.equal(response.body.user.username, 'testuser');
    assert.ok(response.body.token);
});

test('POST /login authenticates a user with their email', async () => {
    // Create account
    await request(app)
        .post('/register')
        .send({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com',
        });

    // Log in using email instead of username
    const response = await request(app)
        .post('/login')
        .send({
            username: 'test@example.com',
            password: 'password123',
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Login successful');
    assert.equal(response.body.user.email, 'test@example.com');
    assert.ok(response.body.token);
});

test('POST /login rejects an incorrect password', async () => {
    // Create account
    await request(app)
        .post('/register')
        .send({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com',
        });

    // Attempt the wrong password
    const response = await request(app)
        .post('/login')
        .send({
            username: 'testuser',
            password: 'wrongpassword',
        });

    assert.equal(response.status, 401);
    assert.equal(response.body.error, 'Invalid credentials');
});

test('POST /login rejects a nonexistent user', async () => {
    const response = await request(app)
        .post('/login')
        .send({
            username: 'unknownuser',
            password: 'password123',
        });

    assert.equal(response.status, 401);
    assert.equal(response.body.error, 'Invalid credentials');
});

test('GET /me rejects requests without an authentication token', async () => {
    const response = await request(app).get('/me');

    assert.equal(response.status, 401);
});

test('GET /me returns the authenticated user profile', async () => {
    // Register user and obtain token
    const registration = await request(app)
        .post('/register')
        .send({
            username: 'testuser',
            password: 'password123',
            email: 'test@example.com',
        });

    const token = registration.body.token;

    // Use token to access protected route
    const response = await request(app)
        .get('/me')
        .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.username, 'testuser');
    assert.equal(response.body.email, 'test@example.com');
    assert.ok(response.body.id);
});

test('GET /me rejects an invalid authentication token', async () => {
    const response = await request(app)
        .get('/me')
        .set('Authorization', 'Bearer invalid-token');

    assert.equal(response.status, 401);
});