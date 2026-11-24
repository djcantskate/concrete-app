// startServer.js
// Validates the environment configuration required to start the Concrete backend.

function validateEnvironment() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required');
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is required');
    }
}

module.exports = validateEnvironment;