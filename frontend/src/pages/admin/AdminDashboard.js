import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import AdminHome from './AdminHome';
import StudentsManager from './StudentsManager';
import InstructorsManager from './InstructorsManager';
import LeavesManager from './LeavesManager';
import AdminProfile from './AdminProfile';

const navItems = [
    { type: 'label', label: 'Overview' },
    { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
    { type: 'label', label: 'Management' },
    { to: '/admin/students', icon: '🎓', label: 'Students' },
    { to: '/admin/instructors', icon: '👨‍🏫', label: 'Instructors' },
    { to: '/admin/leaves', icon: '📋', label: 'Leave Requests' },
    { type: 'label', label: 'Account' },
    { to: '/admin/profile', icon: '⚙️', label: 'My Profile' },
];

const AdminDashboard = () => (
    <DashboardLayout navItems={navItems}>
        <Routes>
            <Route index element={<AdminHome />} />
            <Route path="students" element={<StudentsManager />} />
            <Route path="instructors" element={<InstructorsManager />} />
            <Route path="leaves" element={<LeavesManager />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    </DashboardLayout>
);

export default AdminDashboard;
