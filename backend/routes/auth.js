// routes/auth.js
// Authentication routes — register, login, and get current user.
// Validation rules here must stay in sync with LoginPage.jsx on the frontend.
// Passwords are hashed with bcrypt before storage, never stored in plaintext.
// JWTs are signed with JWT_SECRET and expire after 24 hours.

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const verifyToken = require('../middleware/auth.js');

const rateLimit = require('express-rate-limit');

// Limits auth attempts to 10 requests per 15 minutes per IP.
// Protects against brute force attacks on login and register.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username) => /^[a-zA-Z0-9_]{3,30}$/.test(username);

// POST /register — creates a new user account
router.post('/register', authLimiter, async (req, res, next) => {
    try {
        const { username, password, email } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, password, and email are required' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, underscores only)' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already taken' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const savedUser = await new User({
            username: username.trim(),
            password: hashedPassword,
            email: email.trim(),
        }).save();

        const token = jwt.sign({ userId: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: savedUser._id, username: savedUser.username, email: savedUser.email },
        });
    } catch (error) {
        next(error);
    }
});

// POST /login — authenticates a user, accepts either username or email
router.post('/login', authLimiter, async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username/email and password are required' });
        }

        const query = validateEmail(username) ? { email: username } : { username };
        const user = await User.findOne(query);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        next(error);
    }
});

// GET /me — returns the currently authenticated user's profile
router.get('/me', verifyToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ id: user._id, username: user.username, email: user.email });
    } catch (error) {
        next(error);
    }
});

module.exports = router;