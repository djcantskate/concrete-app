// server.js
// Entry point for the Concrete backend.
// Responsible for app setup, middleware, database connection,
// and mounting route files. Business logic lives in routes/.
//
// Environment variables required:
//   MONGODB_URI          — MongoDB connection string
//   JWT_SECRET           — Secret used to sign and verify JWTs (required at startup)
//   CLIENT_URL           — Frontend origin allowed by CORS
//   GOOGLE_PLACES_API_KEY — Google Places, Geocoding, and Maps Static API key
//   PORT                 — Server port (defaults to 5000)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

// Crash early if JWT_SECRET is missing — the app cannot function without it
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', (err) => console.error('MongoDB connection error:', err));
db.once('open', () => console.log('Connected to MongoDB'));

// Routes
const authRoutes = require('./routes/auth.js');
const sessionRoutes = require('./routes/sessions.js');
const placesRoutes = require('./routes/places.js');

app.use('/', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/places', placesRoutes);

// Health check — used to verify the server is running
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Global error handler — catches anything passed to next(error)
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});