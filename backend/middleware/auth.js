const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Protect Route Middleware
const protect = async (req, res, next) => {
    let token;

    // Check Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // No token
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user to request (without password)
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Optional: Check if user is active
        if (!req.user.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        next();

    } catch (err) {
        return res.status(401).json({ message: 'Token invalid or expired' });
    }
};


// 🔐 Role-based Authorization Middleware
const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Role '${req.user.role}' is not allowed to access this resource`
            });
        }

        next();
    };
};

module.exports = { protect, authorize };