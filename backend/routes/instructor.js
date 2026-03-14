const express = require('express');
const XLSX = require('xlsx');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('instructor'));


// ✅ GET /api/instructor/students?year=1st
router.get('/students', async (req, res) => {
    try {
        const { year } = req.query;

        const filter = { role: 'student', isActive: true };
        if (year) filter.year = year;

        const students = await User.find(filter).sort({ rollNumber: 1 });

        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ POST /api/instructor/attendance — bulk mark with year
router.post('/attendance', async (req, res) => {
    try {
        const { date, records, year } = req.body;
        // records: [{ studentId, status }]

        if (!date || !records || !Array.isArray(records) || !year) {
            return res.status(400).json({ message: 'date, year and records[] are required' });
        }

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        const ops = records.map(({ studentId, status }) => ({
            updateOne: {
                filter: { student: studentId, date: dayStart },
                update: {
                    $set: {
                        student: studentId,
                        date: dayStart,
                        status,
                        year,
                        markedBy: req.user._id
                    }
                },
                upsert: true,
            },
        }));

        await Attendance.bulkWrite(ops);

        res.json({ message: 'Attendance saved successfully' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ GET /api/instructor/attendance?date=YYYY-MM-DD&year=1st
router.get('/attendance', async (req, res) => {
    try {
        const { date, year } = req.query;
        if (!date) return res.status(400).json({ message: 'date query param required' });

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const filter = { date: { $gte: dayStart, $lt: dayEnd } };
        if (year) filter.year = year;

        const records = await Attendance.find(filter)
            .populate('student', 'name rollNumber department year');

        res.json(records);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ GET /api/instructor/export?month=YYYY-MM&year=1st
router.get('/export', async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month) {
            return res.status(400).json({ message: 'month query param required (YYYY-MM)' });
        }

        const [y, m] = month.split('-').map(Number);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 1);

        const studentFilter = { role: 'student', isActive: true };
        if (year) studentFilter.year = year;

        const students = await User.find(studentFilter).sort({ rollNumber: 1 });

        const attendanceFilter = { date: { $gte: startDate, $lt: endDate } };
        if (year) attendanceFilter.year = year;

        const records = await Attendance.find(attendanceFilter);

        const lookup = {};
        for (const r of records) {
            const sid = r.student.toString();
            const day = new Date(r.date).getDate();
            if (!lookup[sid]) lookup[sid] = {};
            lookup[sid][day] = r.status;
        }

        const daysInMonth = new Date(y, m, 0).getDate();
        const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        const headerRow = ['Roll Number', 'Name', 'Department', 'Year', ...dayHeaders, 'Present', 'Absent', 'Leave', 'Percentage'];
        const data = [headerRow];

        for (const student of students) {
            const sid = student._id.toString();
            const dayData = lookup[sid] || {};
            let present = 0, absent = 0, leave = 0;

            const dayValues = dayHeaders.map((d) => {
                const status = dayData[parseInt(d)] || '-';
                if (status === 'Present') present++;
                else if (status === 'Absent') absent++;
                else if (status === 'Late') leave++;

                return status === 'Present' ? 'P'
                    : status === 'Absent' ? 'A'
                    : status === 'Late' ? 'L'
                    : '-';
            });

            const total = present + absent + leave;
            const pct = total > 0 ? ((present / total) * 100).toFixed(1) + '%' : 'N/A';

            data.push([
                student.rollNumber,
                student.name,
                student.department || '',
                student.year || '',
                ...dayValues,
                present,
                absent,
                leave,
                pct
            ]);
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        XLSX.utils.book_append_sheet(wb, ws, `Attendance ${month}`);

        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="attendance_${month}.xlsx"`);

        res.send(buf);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ Leaves Routes (unchanged)
router.get('/leaves', async (req, res) => {
    try {
        const leaves = await Leave.find()
            .populate('student', 'name rollNumber department year')
            .sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


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
        ).populate('student', 'name rollNumber year');

        if (!leave) return res.status(404).json({ message: 'Leave request not found' });

        res.json(leave);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ GET /api/instructor/profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ✅ PUT /api/instructor/profile
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

// ✅ PUT /api/instructor/change-password
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