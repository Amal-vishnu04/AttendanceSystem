require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB connected');

        // Clear existing data
        await User.deleteMany({});
        await Attendance.deleteMany({});
        await Leave.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Create Admin
        await User.create({
            name: 'System Admin',
            email: 'admin@school.com',
            password: 'Admin@123',
            role: 'admin',
        });
        console.log('👤 Admin created: admin@school.com / Admin@123');

        // Create Instructor
        await User.create({
            name: 'Dr. John Smith',
            email: 'instructor@school.com',
            password: 'Instructor@123',
            role: 'instructor',
            department: 'Computer Science',
        });
        console.log('👨‍🏫 Instructor created: instructor@school.com / Instructor@123');

        // Create Students
        const students = [
            { name: 'Alice Johnson', rollNumber: 'CS2021001', department: 'Computer Science', parentContact: '9876543210' },
            { name: 'Bob Williams', rollNumber: 'CS2021002', department: 'Computer Science', parentContact: '9876543211' },
            { name: 'Carol Davis', rollNumber: 'CS2021003', department: 'Computer Science', parentContact: '9876543212' },
        ];

        for (const s of students) {
            await User.create({ ...s, password: 'Student@123', role: 'student' });
            console.log(`🎓 Student created: ${s.rollNumber} / Student@123`);
        }

        console.log('\n🌱 Seeding complete!');
        console.log('='.repeat(50));
        console.log('Login Credentials:');
        console.log('  Admin:      admin@school.com      | Admin@123');
        console.log('  Instructor: instructor@school.com | Instructor@123');
        console.log('  Students:   CS2021001/002/003     | Student@123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
