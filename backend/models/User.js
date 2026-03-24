// models/User.js
// Mongoose schema and model for app users.
// Username and email are both unique — either can be used to log in.
// Passwords are stored as bcrypt hashes, never plaintext.

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);