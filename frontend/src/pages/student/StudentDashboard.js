import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StudentAttendance from './StudentAttendance';
import ApplyLeave from './ApplyLeave';

const navItems = [
    { type: 'label', label: 'My Records' },
    { to: '/student', icon: '📊', label: 'My Attendance', end: true },
    { type: 'label', label: 'Leaves' },
    { to: '/student/leave', icon: '📝', label: 'Apply for Leave' },
];

const StudentDashboard = () => (
    <DashboardLayout navItems={navItems}>
        <Routes>
            <Route index element={<StudentAttendance />} />
            <Route path="leave" element={<ApplyLeave />} />
            <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
    </DashboardLayout>
);

export default StudentDashboard;
