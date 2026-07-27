const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    year: {
        type: String,
        enum: ['1st', '2nd', '3rd', '4th'],
        required: true
    }
}, { timestamps: true });

// Ensure an instructor isn't double booked for the same period and day
timetableSchema.index({ day: 1, period: 1, instructor: 1 }, { unique: true });
// Ensure a class isn't double booked for the same period and day
timetableSchema.index({ day: 1, period: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
