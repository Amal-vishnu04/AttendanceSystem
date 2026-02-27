const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { identifier, password, role } = req.body;
        if (!identifier || !password || !role) {
            return res.status(400).json({ message: 'Please provide identifier, password, and role' });
        }

        let user;
        if (role === 'student') {
            user = await User.findOne({ rollNumber: identifier.toUpperCase(), role: 'student' });
        } else {
            user = await User.findOne({ email: identifier.toLowerCase(), role });
        }

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            token: generateToken(user._id),
            user: user.toJSON(),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;
