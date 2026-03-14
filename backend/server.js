require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ---------------- Middleware ----------------
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '5mb' }));

// ---------------- Routes ----------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/instructor', require('./routes/instructor'));
app.use('/api/student', require('./routes/student'));

// ---------------- Health Check ----------------
app.get('/', (req, res) => {
    res.json({ status: 'AttendanceIQ API is running' });
});

// ---------------- 404 Handler ----------------
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// ---------------- Error Handler ----------------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Server error',
        error: err.message
    });
});

// ---------------- MongoDB Connection ----------------
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log('✅ MongoDB Atlas Connected');

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
})
.catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});