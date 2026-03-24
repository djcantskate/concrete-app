// models/Session.js
// Mongoose schema and model for skate sessions.
// Each session belongs to a user via userId (indexed for faster queries).
// Tricks are embedded as a subdocument array rather than a separate collection
// since they are always fetched and updated with their parent session.

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId:   { type: String, required: true, index: true },
    label:    { type: String, required: true },
    date:     { type: String, required: true },
    location: { type: String, required: true },
    notes:    { type: String, default: '' },
    tricks: [{
        name:           { type: String, required: true },
        landedAttempts: { type: Number, default: 0 },
        totalAttempts:  { type: Number, default: 0 },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);