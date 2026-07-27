const express = require('express');
const XLSX = require('xlsx');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Timetable = require('../models/Timetable');
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


// ✅ GET /api/instructor/timetable/today
router.get('/timetable/today', async (req, res) => {
    try {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday
        const todayStr = days[currentDayIndex];

        if (todayStr === 'Sunday') {
            return res.json([]); // No timetable on Sunday
        }

        const timetable = await Timetable.find({
            instructor: req.user._id,
            day: todayStr
        }).sort({ period: 1 });

        res.json({ day: todayStr, timetable });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// ✅ POST /api/instructor/attendance — bulk mark with year, day, activity
router.post('/attendance', async (req, res) => {
    try {
        const { date, records, year, period, subject, day, activity } = req.body;
        // records: [{ studentId, status }]

        if (!date || !records || !Array.isArray(records) || !year || !period || !subject || !day || !activity) {
            return res.status(400).json({ message: 'date, year, period, subject, day, activity and records[] are required' });
        }

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);

        const ops = records.map(({ studentId, status }) => ({
            updateOne: {
                filter: { student: studentId, date: dayStart, period },
                update: {
                    $set: {
                        student: studentId,
                        date: dayStart,
                        status,
                        period,
                        subject,
                        year,
                        day,
                        activity,
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
        const { date, year, period, subject } = req.query;
        if (!date) return res.status(400).json({ message: 'date query param required' });

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const filter = { date: { $gte: dayStart, $lt: dayEnd } };
        if (year) filter.year = year;
        if (period) filter.period = period;
        if (subject) filter.subject = subject;

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
        const { month, year, subject } = req.query;

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
        if (subject) attendanceFilter.subject = subject;

        const records = await Attendance.find(attendanceFilter);

        const lookup = {};
        for (const r of records) {
            const sid = r.student.toString();
            const day = new Date(r.date).getDate();
            if (!lookup[sid]) lookup[sid] = {};
            // Instead of overwriting, we might keep track of multiple periods,
            // but for the export let's count percentage of classes attended if a subject is selected
            // If multiple periods marked "Present" in a single day, or "Absent", just store all data
            if (!lookup[sid][day]) lookup[sid][day] = [];
            lookup[sid][day].push(r.status);
        }

        const daysInMonth = new Date(y, m, 0).getDate();
        const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        const headerRow = ['Roll Number', 'Name', 'Department', 'Year', ...dayHeaders, 'Present classes', 'Absent classes', 'Late classes', 'Percentage'];
        const data = [headerRow];

        for (const student of students) {
            const sid = student._id.toString();
            const dayData = lookup[sid] || {};
            let present = 0, absent = 0, leave = 0;

            const dayValues = dayHeaders.map((d) => {
                const statuses = dayData[parseInt(d)] || [];
                if (statuses.length === 0) return '-';
                
                statuses.forEach(status => {
                    if (status === 'Present') present++;
                    else if (status === 'Absent') absent++;
                    else if (status === 'Late') leave++;
                });

                // Displaying a summary for the day in the cell e.g., P:2, A:1
                let p = 0, a = 0, l = 0;
                statuses.forEach(s => {
                    if (s === 'Present') p++;
                    else if (s === 'Absent') a++;
                    else if (s === 'Late') l++;
                });
                return `${p ? 'P:'+p+' ' : ''}${a ? 'A:'+a+' ' : ''}${l ? 'L:'+l : ''}`.trim() || '-';
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