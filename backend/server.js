// server.js
// Starts the Concrete backend and establishes the MongoDB connection.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app.js');
const validateEnvironment = require('./startup/startServer.js');
const startBackend = require('./startup/startBackend.js');

dotenv.config();

// Validate required environment variables before starting the server.
validateEnvironment();

const PORT = process.env.PORT || 5000;

// Monitor MongoDB connection events.
mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});

startBackend({
    mongoose,
    app,
    port: PORT,
});