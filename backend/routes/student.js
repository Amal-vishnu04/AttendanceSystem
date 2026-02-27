const express = require('express');
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

module.exports = router;
