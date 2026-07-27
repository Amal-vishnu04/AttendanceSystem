const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({

    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },

    date: { 
        type: Date, 
        required: true 
    },

    status: { 
        type: String, 
        enum: ['Present', 'Absent', 'Late'], 
        required: true 
    },

    // ✅ Added Year Field
    year: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th'],
        required: true,
        trim: true
    },

    // ✅ Added Period (1-7)
    period: {
        type: Number,
        min: 1,
        max: 7,
        required: true
    },

    // ✅ Added Subject
    subject: {
        type: String,
        required: true,
        trim: true
    },

    // ✅ Added Day
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },

    // ✅ Added Activity
    activity: {
        type: String,
        enum: ['Lecture', 'Lab', 'Seminar', 'Test', 'Assignment'],
        required: true
    },

    // ✅ Who marked attendance (Instructor/Admin)
    markedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },

}, { timestamps: true });


// 🔥 Compound unique index: one record per student per day per period
attendanceSchema.index({ student: 1, date: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);