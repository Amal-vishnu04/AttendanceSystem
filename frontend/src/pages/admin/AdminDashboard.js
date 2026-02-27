import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import AdminHome from './AdminHome';
import StudentsManager from './StudentsManager';
import InstructorsManager from './InstructorsManager';
import LeavesManager from './LeavesManager';

const navItems = [
    { type: 'label', label: 'Overview' },
    { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
    { type: 'label', label: 'Management' },
    { to: '/admin/students', icon: '🎓', label: 'Students' },
    { to: '/admin/instructors', icon: '👨‍🏫', label: 'Instructors' },
    { to: '/admin/leaves', icon: '📋', label: 'Leave Requests' },
];

const AdminDashboard = () => (
    <DashboardLayout navItems={navItems}>
        <Routes>
            <Route index element={<AdminHome />} />
            <Route path="students" element={<StudentsManager />} />
            <Route path="instructors" element={<InstructorsManager />} />
            <Route path="leaves" element={<LeavesManager />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
    </DashboardLayout>
);

export default AdminDashboard;
