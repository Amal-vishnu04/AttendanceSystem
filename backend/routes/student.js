const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('student'));

// GET /api/student/attendance?month=YYYY-MM
router.get('/attendance', async (req, res) => {
    try {
        const { month } = req.query;
        let filter = { student: req.user._id };

        if (month) {
            const [year, mon] = month.split('-').map(Number);
            filter.date = {
                $gte: new Date(year, mon - 1, 1),
                $lt: new Date(year, mon, 1),
            };
        }

        const records = await Attendance.find(filter).sort({ date: 1 });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/student/leave
router.post('/leave', async (req, res) => {
    try {
        const { startDate, endDate, reason } = req.body;
        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'startDate, endDate, and reason are required' });
        }
        const leave = await Leave.create({
            student: req.user._id,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            reason,
        });
        res.status(201).json(leave);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/leaves
router.get('/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find({ student: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/student/profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/student/profile
router.put('/profile', async (req, res) => {
    try {
        const { name, phone, bio, profilePicture } = req.body;

        // Validate profile picture size (max 2MB as base64)
        if (profilePicture && profilePicture.length > 2 * 1024 * 1024 * 1.37) {
            return res.status(400).json({ message: 'Profile picture too large. Max 2MB.' });
        }

        const updatedFields = {};
        if (name !== undefined) updatedFields.name = name.trim();
        if (phone !== undefined) updatedFields.phone = phone.trim();
        if (bio !== undefined) updatedFields.bio = bio.trim();
        if (profilePicture !== undefined) updatedFields.profilePicture = profilePicture;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updatedFields },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/student/change-password
router.put('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save(); // triggers bcrypt hash
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
