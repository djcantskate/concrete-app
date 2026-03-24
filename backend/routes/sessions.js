// routes/sessions.js
// Session CRUD routes — all require a valid JWT via verifyToken.
// userId is extracted from the token so users can only access their own sessions.
// Tricks are normalized on every write to filter blanks and clamp landed to total.

const router = require('express').Router();
const Session = require('../models/Session.js');
const verifyToken = require('../middleware/auth.js');

// Filters blank tricks, parses integers, and clamps landedAttempts to totalAttempts
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

// GET /sessions — returns all sessions for the authenticated user, newest first
router.get('/', verifyToken, async (req, res, next) => {
    try {
        const sessions = await Session.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
});

// POST /sessions — creates a new session
router.post('/', verifyToken, async (req, res, next) => {
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

// PUT /sessions/:id — updates an existing session
// findOneAndUpdate scopes by both _id and userId so users cannot edit others' sessions
router.put('/:id', verifyToken, async (req, res, next) => {
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

// DELETE /sessions/:id — deletes a session
// findOneAndDelete scopes by both _id and userId so users cannot delete others' sessions
router.delete('/:id', verifyToken, async (req, res, next) => {
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

module.exports = router;