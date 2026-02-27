import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import StudentDashboard from './pages/student/StudentDashboard';

const PrivateRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="spinner" style={{ height: '100vh' }} />;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
    return children;
};

const RoleRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="spinner" style={{ height: '100vh' }} />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'instructor') return <Navigate to="/instructor" replace />;
    return <Navigate to="/student" replace />;
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<RoleRedirect />} />

                    {/* Admin Routes */}
                    <Route path="/admin/*" element={
                        <PrivateRoute roles={['admin']}>
                            <AdminDashboard />
                        </PrivateRoute>
                    } />

                    {/* Instructor Routes */}
                    <Route path="/instructor/*" element={
                        <PrivateRoute roles={['instructor']}>
                            <InstructorDashboard />
                        </PrivateRoute>
                    } />

                    {/* Student Routes */}
                    <Route path="/student/*" element={
                        <PrivateRoute roles={['student']}>
                            <StudentDashboard />
                        </PrivateRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
