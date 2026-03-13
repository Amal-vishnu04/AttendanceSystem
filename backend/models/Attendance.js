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
        enum: ['Present', 'Absent', 'Leave'], 
        required: true 
    },

    // ✅ Added Year Field
    year: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th'],
        required: true,
        trim: true
    },

    // ✅ Who marked attendance (Instructor/Admin)
    markedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },

}, { timestamps: true });


// 🔥 Compound unique index: one record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);