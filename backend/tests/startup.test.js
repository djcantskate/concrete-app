// startup.test.js
// Tests the backend startup configuration and validation logic.

const test = require('node:test');
const assert = require('node:assert/strict');

const validateEnvironment = require('../startup/startServer.js');
const startBackend = require('../startup/startBackend.js');

test('rejects startup when JWT_SECRET is missing', () => {
    const originalSecret = process.env.JWT_SECRET;

    delete process.env.JWT_SECRET;

    try {
        assert.throws(
            () => validateEnvironment(),
            {
                message: 'JWT_SECRET environment variable is required',
            }
        );
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }
    }
});

test('rejects startup when MONGODB_URI is missing', () => {
    const originalSecret = process.env.JWT_SECRET;
    const originalUri = process.env.MONGODB_URI;

    // Provide a valid JWT_SECRET so validation reaches the MongoDB check.
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.MONGODB_URI;

    try {
        assert.throws(
            () => validateEnvironment(),
            {
                message: 'MONGODB_URI environment variable is required',
            }
        );
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }

        if (originalUri === undefined) {
            delete process.env.MONGODB_URI;
        } else {
            process.env.MONGODB_URI = originalUri;
        }
    }
});

test('allows startup when all required environment variables are present', () => {
    const originalSecret = process.env.JWT_SECRET;
    const originalUri = process.env.MONGODB_URI;

    process.env.JWT_SECRET = 'test-secret';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test';

    try {
        assert.doesNotThrow(() => validateEnvironment());
    } finally {
        if (originalSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = originalSecret;
        }

        if (originalUri === undefined) {
            delete process.env.MONGODB_URI;
        } else {
            process.env.MONGODB_URI = originalUri;
        }
    }
});

test('does not start Express when MongoDB connection fails', async (t) => {
    const originalExitCode = process.exitCode;
    const originalConsoleError = console.error;

    let listenCalled = false;

    const fakeMongoose = {
        connect: async () => {
            throw new Error('Database connection failed');
        },
    };

    const fakeApp = {
        listen: () => {
            listenCalled = true;
        },
    };

    t.mock.method(process, 'exit', (code) => {
        process.exitCode = code;
    });

    t.mock.method(console, 'error', () => {});

    try {
        await startBackend({
            mongoose: fakeMongoose,
            app: fakeApp,
            port: 5000,
        });

        assert.equal(listenCalled, false);
        assert.equal(process.exitCode, 1);
    } finally {
        process.exitCode = originalExitCode;
        console.error = originalConsoleError;
    }
});

test('starts Express after MongoDB connects successfully', async (t) => {
    const startupOrder = [];

    const fakeMongoose = {
        connect: async () => {
            startupOrder.push('database');
        },
    };

    const fakeApp = {
        listen: (port, callback) => {
            startupOrder.push('server');
            callback();
        },
    };

    t.mock.method(console, 'log', () => {});

    await startBackend({
        mongoose: fakeMongoose,
        app: fakeApp,
        port: 5000,
    });

    assert.deepEqual(startupOrder, ['database', 'server']);
});