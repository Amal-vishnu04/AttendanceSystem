import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import MarkAttendance from './MarkAttendance';
import AttendanceHistory from './AttendanceHistory';
import InstructorLeaves from './InstructorLeaves';

const navItems = [
    { type: 'label', label: 'Attendance' },
    { to: '/instructor', icon: '✅', label: 'Mark Attendance', end: true },
    { to: '/instructor/history', icon: '📅', label: 'Attendance History' },
    { type: 'label', label: 'Leaves' },
    { to: '/instructor/leaves', icon: '📋', label: 'Leave Requests' },
];

const InstructorDashboard = () => (
    <DashboardLayout navItems={navItems}>
        <Routes>
            <Route index element={<MarkAttendance />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="leaves" element={<InstructorLeaves />} />
            <Route path="*" element={<Navigate to="/instructor" replace />} />
        </Routes>
    </DashboardLayout>
);

export default InstructorDashboard;
