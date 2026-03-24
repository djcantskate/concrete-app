// middleware/auth.js
// JWT verification middleware.
// Extracts and verifies the Bearer token from the Authorization header,
// then attaches the decoded userId to req so route handlers can use it.
// Returns 401 immediately if the token is missing or invalid.

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = verifyToken;