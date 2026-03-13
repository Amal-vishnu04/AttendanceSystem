const express = require('express');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));


// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
        const totalInstructors = await User.countDocuments({ role: 'instructor', isActive: true });
        const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAttendance = await Attendance.countDocuments({
            date: { $gte: today, $lt: tomorrow },
            status: 'Present',
        });

        res.json({ totalStudents, totalInstructors, pendingLeaves, todayAttendance });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// GET /api/admin/students
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student', isActive: true }).sort({ rollNumber: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST /api/admin/students
router.post('/students', async (req, res) => {
    try {
        const { name, email, rollNumber, department, year, parentContact, password } = req.body;

        // Basic validation
        if (!name || !rollNumber || !year) {
            return res.status(400).json({ message: 'Name, Roll Number and Year are required' });
        }

        // Check duplicate roll number
        const existingRoll = await User.findOne({ rollNumber: rollNumber.toUpperCase() });
        if (existingRoll) {
            return res.status(400).json({ message: 'Roll number already exists' });
        }

        // Check duplicate email (if provided)
        if (email) {
            const existingEmail = await User.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already exists' });
            }
        }

        const student = await User.create({
            name,
            email: email?.toLowerCase(),
            rollNumber: rollNumber.toUpperCase(),
            department,
            year,
            parentContact,
            password: password || 'Student@123',
            role: 'student',
        });

        res.status(201).json(student);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// PUT /api/admin/students/:id
router.put('/students/:id', async (req, res) => {
    try {
        const { name, rollNumber, department, year, parentContact } = req.body;
        const student = await User.findByIdAndUpdate(
            req.params.id,
            { name, rollNumber: rollNumber?.toUpperCase(), department, year, parentContact },
            { new: true, runValidators: true }
        );
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// DELETE /api/admin/students/:id
router.delete('/students/:id', async (req, res) => {
    try {
        const student = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// GET /api/admin/instructors
router.get('/instructors', async (req, res) => {
    try {
        const instructors = await User.find({ role: 'instructor', isActive: true }).sort({ name: 1 });
        res.json(instructors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// POST /api/admin/instructors
router.post('/instructors', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ message: 'Email already exists' });

        const instructor = await User.create({
            name,
            email: email.toLowerCase(),
            password: password || 'Instructor@123',
            role: 'instructor',
        });
        res.status(201).json(instructor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// DELETE /api/admin/instructors/:id
router.delete('/instructors/:id', async (req, res) => {
    try {
        const instructor = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
        res.json({ message: 'Instructor removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// GET /api/admin/leaves
router.get('/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('student', 'name rollNumber department year')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;