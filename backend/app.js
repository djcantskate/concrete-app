// app.js
// Creates and configures the Express app
// Middleware and routes are registered here
// Database connections and server startup are handled separately in server.js

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler.js');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.js");
const sessionRoutes = require("./routes/sessions.js");
const placesRoutes = require("./routes/places.js");
const usersRoutes = require("./routes/users.js");

app.use('/', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/places', placesRoutes);
app.use('/users', usersRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({status: 'OK'});
});

// Global error handler
app.use(errorHandler);

module.exports = app;