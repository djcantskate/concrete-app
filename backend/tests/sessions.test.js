/* tests/sessions.test.js
*  Automated tests for session API routes
*  Verifies session creation, retrieval, updating, and deletion
*  Includes authentication, user ownership, input validation,
*  trick data normalization, and protection against unauthorized
*  edits to data
*
*  Uses in-memory MongoDB database to run tests without affecting
*  the actual DB*/

const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'concrete-test-secret';

const app = require('../app.js');
const User = require('../models/User.js');
const Session = require('../models/Session.js');

let mongoServer;

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await User.init();
    await Session.init();
});

beforeEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

async function createAuthenticatedUser(username = 'testuser') {
    const response = await request(app)
        .post('/register')
        .send({
            username,
            password: 'password123',
            email: `${username}@example.com`,
        });

    return {
        token: response.body.token,
        user: response.body.user,
    };
}

test('POST /sessions creates a session for the authenticated user', async () => {
    const { token, user } = await createAuthenticatedUser();

    const response = await request(app)
        .post('/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
            label: 'Evening Skate',
            date: '2026-11-22',
            location: 'Local skatepark',
            notes: 'Worked on kickflips',
            tricks: [
                {
                    name: 'Kickflip',
                    totalAttempts: 10,
                    landedAttempts: 4,
                },
            ],
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.label, 'Evening Skate');
    assert.equal(response.body.location, 'Local skatepark');
    assert.equal(response.body.userId, user.id);

    const savedSession = await Session.findById(response.body._id);
    assert.ok(savedSession);
});


test('POST /sessions rejects missing or invalid required fields', async () => {
    const { token } = await createAuthenticatedUser();

    const invalidRequests = [
        {
            location: 'Local skatepark',
        },
        {
            label: 'Evening Skate',
        },
        {
            label: '',
            location: 'Local skatepark',
        },
        {
            label: 'Evening Skate',
            location: '',
        },
        {
            label: 123,
            location: 'Local skatepark',
        },
        {
            label: 'Evening Skate',
            location: 123,
        },
    ];

    for (const sessionData of invalidRequests) {
        const response = await request(app)
            .post('/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send(sessionData);

        assert.equal(response.status, 400);
    }
});


test('POST /sessions normalizes trick data', async () => {
    const { token } = await createAuthenticatedUser();

    const response = await request(app)
        .post('/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
            label: 'Evening Skate',
            location: 'Local skatepark',
            tricks: [
                {
                    name: ' Kickflip ',
                    totalAttempts: 10,
                    landedAttempts: 4,
                },
                {
                    name: 'Heelflip',
                    totalAttempts: -5,
                    landedAttempts: 3,
                },
                {
                    name: 'Tre Flip',
                    totalAttempts: 5,
                    landedAttempts: 12,
                },
                {
                    name: '   ',
                    totalAttempts: 5,
                    landedAttempts: 2,
                },
                null,
            ],
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.tricks.length, 3);

    assert.deepEqual(
        response.body.tricks.map(({ name, totalAttempts, landedAttempts }) => ({
            name,
            totalAttempts,
            landedAttempts,
        })),
        [
            {
                name: 'Kickflip',
                totalAttempts: 10,
                landedAttempts: 4,
            },
            {
                name: 'Heelflip',
                totalAttempts: 0,
                landedAttempts: 0,
            },
            {
                name: 'Tre Flip',
                totalAttempts: 5,
                landedAttempts: 5,
            },
        ]
    );
});

test('GET /sessions only returns sessions belonging to the authenticated user', async () => {
    const firstUser = await createAuthenticatedUser('firstuser');
    const secondUser = await createAuthenticatedUser('seconduser');

    await Session.create([
        {
            userId: firstUser.user.id,
            label: 'First User Session',
            date: '2026-11-22',
            location: 'Local skatepark',
        },
        {
            userId: secondUser.user.id,
            label: 'Second User Session',
            date: '2026-11-22',
            location: 'Another skatepark',
        },
    ]);

    const response = await request(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${firstUser.token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].label, 'First User Session');
    assert.equal(response.body[0].userId, firstUser.user.id);
});


test('GET /sessions rejects requests without an authentication token', async () => {
    const response = await request(app).get('/sessions');

    assert.equal(response.status, 401);
});


test('PUT /sessions/:id updates a session belonging to the authenticated user', async () => {
    const { token, user } = await createAuthenticatedUser();

    const session = await Session.create({
        userId: user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
        notes: 'Practiced ollies',
    });

    const response = await request(app)
        .put(`/sessions/${session._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            label: 'Evening Skate',
            location: 'New skatepark',
            notes: 'Practiced kickflips',
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.label, 'Evening Skate');
    assert.equal(response.body.location, 'New skatepark');
    assert.equal(response.body.notes, 'Practiced kickflips');
    assert.equal(response.body.userId, user.id);
});


test('PUT /sessions/:id prevents users from changing protected fields', async () => {
    const firstUser = await createAuthenticatedUser('firstuser');
    const secondUser = await createAuthenticatedUser('seconduser');

    const session = await Session.create({
        userId: firstUser.user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
    });

    const response = await request(app)
        .put(`/sessions/${session._id}`)
        .set('Authorization', `Bearer ${firstUser.token}`)
        .send({
            label: 'Updated Skate',
            userId: secondUser.user.id,
            _id: new mongoose.Types.ObjectId().toString(),
        });

    assert.equal(response.status, 200);
    assert.equal(response.body.label, 'Updated Skate');
    assert.equal(response.body.userId, firstUser.user.id);
    assert.equal(response.body._id, session._id.toString());

    const savedSession = await Session.findById(session._id);

    assert.equal(savedSession.userId.toString(), firstUser.user.id);
});


test('PUT /sessions/:id prevents users from updating another user session', async () => {
    const firstUser = await createAuthenticatedUser('firstuser');
    const secondUser = await createAuthenticatedUser('seconduser');

    const session = await Session.create({
        userId: firstUser.user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
    });

    const response = await request(app)
        .put(`/sessions/${session._id}`)
        .set('Authorization', `Bearer ${secondUser.token}`)
        .send({
            label: 'Unauthorized Update',
        });

    assert.equal(response.status, 404);

    const savedSession = await Session.findById(session._id);

    assert.equal(savedSession.label, 'Afternoon Skate');
    assert.equal(savedSession.userId.toString(), firstUser.user.id);
});


test('PUT /sessions/:id rejects invalid session data', async () => {
    const { token, user } = await createAuthenticatedUser();

    const session = await Session.create({
        userId: user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
    });

    const invalidUpdates = [
        { label: 123 },
        { date: 123 },
        { location: 123 },
        { notes: 123 },
        { tricks: 'Kickflip' },
    ];

    for (const updates of invalidUpdates) {
        const response = await request(app)
            .put(`/sessions/${session._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updates);

        assert.equal(response.status, 400);
    }
});


test('DELETE /sessions/:id deletes a session belonging to the authenticated user', async () => {
    const { token, user } = await createAuthenticatedUser();

    const session = await Session.create({
        userId: user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
    });

    const response = await request(app)
        .delete(`/sessions/${session._id}`)
        .set('Authorization', `Bearer ${token}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.message, 'Session deleted successfully');

    const deletedSession = await Session.findById(session._id);

    assert.equal(deletedSession, null);
});


test('DELETE /sessions/:id prevents users from deleting another user session', async () => {
    const firstUser = await createAuthenticatedUser('firstuser');
    const secondUser = await createAuthenticatedUser('seconduser');

    const session = await Session.create({
        userId: firstUser.user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
    });

    const response = await request(app)
        .delete(`/sessions/${session._id}`)
        .set('Authorization', `Bearer ${secondUser.token}`);

    assert.equal(response.status, 404);

    const savedSession = await Session.findById(session._id);

    assert.ok(savedSession);
    assert.equal(savedSession.userId.toString(), firstUser.user.id);
});


test('POST, PUT, and DELETE /sessions reject requests without an authentication token', async () => {
    const responsePost = await request(app)
        .post('/sessions')
        .send({
            label: 'Evening Skate',
            date: '2026-11-22',
            location: 'Local skatepark',
        });

    const responsePut = await request(app)
        .put(`/sessions/${new mongoose.Types.ObjectId()}`)
        .send({
            label: 'Updated Skate',
        });

    const responseDelete = await request(app)
        .delete(`/sessions/${new mongoose.Types.ObjectId()}`);

    assert.equal(responsePost.status, 401);
    assert.equal(responsePut.status, 401);
    assert.equal(responseDelete.status, 401);
});


test('PUT /sessions/:id rejects blank labels and locations', async () => {
    const { token, user } = await createAuthenticatedUser();

    const session = await Session.create({
        userId: user.id,
        label: 'Afternoon Skate',
        date: '2026-11-22',
        location: 'Local skatepark',
    });

    const invalidUpdates = [
        { label: '' },
        { label: '   ' },
        { location: '' },
        { location: '   ' },
    ];

    for (const updates of invalidUpdates) {
        const response = await request(app)
            .put(`/sessions/${session._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(updates);

        assert.equal(response.status, 400);
    }

    const savedSession = await Session.findById(session._id);

    assert.equal(savedSession.label, 'Afternoon Skate');
    assert.equal(savedSession.location, 'Local skatepark');
});


test('PUT and DELETE /sessions/:id return 404 for nonexistent sessions', async () => {
    const { token } = await createAuthenticatedUser();

    const nonexistentId = new mongoose.Types.ObjectId().toString();

    const responsePut = await request(app)
        .put(`/sessions/${nonexistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
            label: 'Updated Skate',
        });

    const responseDelete = await request(app)
        .delete(`/sessions/${nonexistentId}`)
        .set('Authorization', `Bearer ${token}`);

    assert.equal(responsePut.status, 404);
    assert.equal(responseDelete.status, 404);
});
