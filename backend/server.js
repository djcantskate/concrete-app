// server.js
// Express backend for Skate Tracker.
// Handles user auth (register, login, JWT verification) and session CRUD.
// All session routes require a valid JWT — userId is extracted from the token
// and used to scope all queries so users can only access their own data.
//
// Environment variables required:
//   MONGODB_URI  — MongoDB connection string
//   JWT_SECRET   — Secret used to sign and verify JWTs
//   CLIENT_URL   — Frontend origin allowed by CORS
//   PORT         — Server port (defaults to 5000)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

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

// Crash early if JWT_SECRET is missing — the app cannot function without it
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

// Validation helpers — must match the rules enforced in LoginPage.jsx
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username) => /^[a-zA-Z0-9_]{3,30}$/.test(username);

// Schemas

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

const sessionSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    date: { type: String, required: true },
    location: { type: String, required: true },
    notes: { type: String, default: '' },
    tricks: [{
        name: { type: String, required: true },
        landedAttempts: { type: Number, default: 0 },
        totalAttempts: { type: Number, default: 0 },
    }],
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);

// Normalizes a tricks array — filters blanks, parses integers, and clamps
// landedAttempts to never exceed totalAttempts
function normalizeTricks(tricks = []) {
    return tricks
        .filter((t) => t.name && t.name.trim())
        .map((t) => {
            const totalAttempts = Math.max(0, parseInt(t.totalAttempts) || 0);
            const landedAttempts = Math.min(
                Math.max(0, parseInt(t.landedAttempts) || 0),
                totalAttempts
            );
            return { name: t.name.trim(), landedAttempts, totalAttempts };
        });
}

// JWT middleware — verifies the Bearer token and attaches userId to the request
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Auth routes

app.post('/register', async (req, res, next) => {
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

        const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: savedUser._id, username: savedUser.username, email: savedUser.email },
        });
    } catch (error) {
        next(error);
    }
});

// Accepts either a username or email in the username field
app.post('/login', async (req, res, next) => {
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

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        next(error);
    }
});

app.get('/me', verifyToken, async (req, res, next) => {
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

// Session routes — all require a valid JWT

app.get('/sessions', verifyToken, async (req, res, next) => {
    try {
        const sessions = await Session.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

app.post('/sessions', verifyToken, async (req, res, next) => {
    try {
        const { label, date, location, notes, tricks } = req.body;

        if (!label || !location) {
            return res.status(400).json({ error: 'Label and location are required' });
        }

        const savedSession = await new Session({
            userId: req.userId,
            label: label.trim(),
            date: date || new Date().toISOString().slice(0, 10),
            location: location.trim(),
            notes: notes || '',
            tricks: normalizeTricks(tricks),
        }).save();

        res.status(201).json(savedSession);
    } catch (error) {
        next(error);
    }
});

app.put('/sessions/:id', verifyToken, async (req, res, next) => {
    try {
        const updates = req.body;

        if (updates.tricks) {
            updates.tricks = normalizeTricks(updates.tricks);
        }

        const session = await Session.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updates,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        next(error);
    }
});

app.delete('/sessions/:id', verifyToken, async (req, res, next) => {
    try {
        const session = await Session.findOneAndDelete({ _id: req.params.id, userId: req.userId });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        next(error);
    }
});

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
