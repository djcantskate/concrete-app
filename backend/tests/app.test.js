// tests/app.test.js
// Basic tests for the Concrete Express application.

const { test } = require("node:test");
const express = require("express");
const errorHandler = require("../middleware/errorHandler.js");
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app.js');

// Separate Express app for testing error-handling middleware.
const testApp = express();

testApp.use(express.json());

testApp.get('/test-error', (req, res, next) => {
    const error = new Error('Sensitive database details');
    error.status = 500;
    next(error);
});

testApp.get('/test-client-error', (req, res, next) => {
    const error = new Error('Invalid session data');
    error.status = 400;
    next(error);
});

testApp.use(errorHandler);

test('GET /health returns an OK status', async () => {
    const response = await request(app).get('/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {status: 'OK'});
});

test('Global error handler hides internal errors in production', async (t) => {
    t.mock.method(console, 'error', () => {});
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
        const response = await request(testApp).get('/test-error');

        assert.equal(response.status, 500);
        assert.deepEqual(response.body, {
            error: 'Internal Server Error',
        });
    } finally {
        if (previousEnv === undefined) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = previousEnv;
        }
    }
});

test('Global error handler preserves client errors in production', async (t) => {
    t.mock.method(console, 'error', () => {});
    const previousEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
        const response = await request(testApp).get('/test-client-error');

        assert.equal(response.status, 400);
        assert.deepEqual(response.body, {
            error: 'Invalid session data',
        });
    } finally {
        if (previousEnv === undefined) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = previousEnv;
        }
    }
});

test('Malformed JSON returns a clean 400 response', async (t) => {
    t.mock.method(console, 'error', () => {});

    const response = await request(testApp)
        .post('/malformed-json')
        .set('Content-Type', 'application/json')
        .send('{"label":');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, {
        error: 'Invalid JSON request body',
    });
});