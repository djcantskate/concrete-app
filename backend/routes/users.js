// routes/users.js
// Protected account-management routes for the logged-in user.
// Handles changing a username, email, or password for the logged-in user.
// Passwords are always verified and hashed on the server.

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User.js');
const verifyToken = require('../middleware/auth.js');

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username) => /^[a-zA-Z0-9_]{3,30}$/.test(username);

// PUT /users/me/username — changes the authenticated user's username.
router.put('/me/username', verifyToken, async (req, res, next) => {
    try {
        const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        if (!validateUsername(username)) {
            return res.status(400).json({
                error: 'Username must be 3-30 characters (letters, numbers, underscores only)',
            });
        }

        const existingUser = await User.findOne({ username });

        // Allow the user to submit their current username unchanged.
        if (existingUser && existingUser._id.toString() !== req.userId) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { username },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Username updated successfully',
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Username already taken' });
        }
        next(error);
    }
});

// PUT /users/me/email — changes the authenticated user's email address.
router.put('/me/email', verifyToken, async (req, res, next) => {
    try {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const existingUser = await User.findOne({ email });

        // Allow the user to submit their current email unchanged.
        if (existingUser && existingUser._id.toString() !== req.userId) {
            return res.status(409).json({ error: 'Email already taken' });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { email },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            message: 'Email updated successfully',
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Email already taken' });
        }
        next(error);
    }
});

// PUT /users/me/password — verifies the old password before saving a new hash.
router.put('/me/password', verifyToken, async (req, res, next) => {
    try {
        const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';

        const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Current password and new password are required',
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters',
            });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const passwordMatches = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;