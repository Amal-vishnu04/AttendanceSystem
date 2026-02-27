const express = require('express');
const XLSX = require('xlsx');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('instructor'));

// GET /api/instructor/students
router.get('/students', async (req, res) => {
    try {
        const students = await User.find({ role: 'student', isActive: true }).sort({ rollNumber: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/instructor/attendance — bulk mark
router.post('/attendance', async (req, res) => {
    try {
        const { date, records } = req.body;
        // records: [{ studentId, status }]
        if (!date || !records || !Array.isArray(records)) {
            return res.status(400).json({ message: 'date and records[] are required' });
        }

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        const ops = records.map(({ studentId, status }) => ({
            updateOne: {
                filter: { student: studentId, date: dayStart },
                update: { $set: { student: studentId, date: dayStart, status, markedBy: req.user._id } },
                upsert: true,
            },
        }));

        await Attendance.bulkWrite(ops);
        res.json({ message: 'Attendance saved successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/instructor/attendance?date=YYYY-MM-DD
router.get('/attendance', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'date query param required' });

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const records = await Attendance.find({ date: { $gte: dayStart, $lt: dayEnd } })
            .populate('student', 'name rollNumber department');
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/instructor/export?month=YYYY-MM
router.get('/export', async (req, res) => {
    try {
        const { month } = req.query;
        if (!month) return res.status(400).json({ message: 'month query param required (YYYY-MM)' });

        const [year, mon] = month.split('-').map(Number);
        const startDate = new Date(year, mon - 1, 1);
        const endDate = new Date(year, mon, 1);

        const students = await User.find({ role: 'student', isActive: true }).sort({ rollNumber: 1 });
        const records = await Attendance.find({ date: { $gte: startDate, $lt: endDate } });

        // Build lookup: studentId -> { day -> status }
        const lookup = {};
        for (const r of records) {
            const sid = r.student.toString();
            const day = new Date(r.date).getDate();
            if (!lookup[sid]) lookup[sid] = {};
            lookup[sid][day] = r.status;
        }

        // Days in month
        const daysInMonth = new Date(year, mon, 0).getDate();
        const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        const headerRow = ['Roll Number', 'Name', 'Department', ...dayHeaders, 'Present', 'Absent', 'Leave', 'Percentage'];
        const data = [headerRow];

        for (const student of students) {
            const sid = student._id.toString();
            const dayData = lookup[sid] || {};
            let present = 0, absent = 0, leave = 0;
            const dayValues = dayHeaders.map((d) => {
                const status = dayData[parseInt(d)] || '-';
                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
                else if (status === 'Leave') leave++;
                return status === 'Present' ? 'P' : status === 'Absent' ? 'A' : status === 'Leave' ? 'L' : '-';
            });
            const total = present + absent + leave;
            const pct = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : 'N/A';
            data.push([student.rollNumber, student.name, student.department || '', ...dayValues, present, absent, leave, pct]);
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        // Column widths
        ws['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 16 }, ...dayHeaders.map(() => ({ wch: 4 })), { wch: 9 }, { wch: 9 }, { wch: 7 }, { wch: 11 }];
        XLSX.utils.book_append_sheet(wb, ws, `Attendance ${month}`);

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_${month}.xlsx"`);
        res.send(buf);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/instructor/leaves
router.get('/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('student', 'name rollNumber department')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH /api/instructor/leaves/:id
router.patch('/leaves/:id', async (req, res) => {
    try {
        const { status, reviewNote } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'status must be Approved or Rejected' });
        }
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            { status, reviewNote, reviewedBy: req.user._id },
            { new: true }
        ).populate('student', 'name rollNumber');
        if (!leave) return res.status(404).json({ message: 'Leave request not found' });
        res.json(leave);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
