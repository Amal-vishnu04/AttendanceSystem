import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [role, setRole] = useState('student');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(identifier, password, role);
            navigate(`/${user.role}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const roleConfig = {
        student: { label: 'Roll Number', placeholder: 'e.g. CS2021001' },
        instructor: { label: 'Email', placeholder: 'instructor@school.com' },
        admin: { label: 'Email', placeholder: 'admin@school.com' },
    };

    return (
        <div
            className="login-page"
            style={{
                backgroundImage: "url('/suguna.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
            }}
        >

            {/* College Title */}
            <h1
                style={{
                    color: "white",
                    fontSize: "42px",
                    fontWeight: "bold",
                    textShadow: "3px 3px 10px black",
                    marginBottom: "20px",
                }}
            >
                Suguna College of Engineering
            </h1>

            <div className="login-card slide-up">
                <div className="login-brand">
                    <h1>🎓 AttendanceIQ</h1>
                    <p>Smart Attendance Management System</p>
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    {/* Role selector */}
                    <div className="form-group">
                        <label className="form-label">Login As</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['admin', 'instructor', 'student'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => { setRole(r); setIdentifier(''); setError(''); }}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '12px 0',
                                        backgroundColor: 'white',          // ✅ White background
                                        color: 'black',
                                        border: role === r ? '2px solid #007bff' : '1px solid #ccc', // Highlight selected
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: role === r ? '600' : '500',
                                        boxShadow: role === r ? '0 4px 10px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {r === 'admin' ? '🛡️' : r === 'instructor' ? '👨‍🏫' : '🎓'} {r.charAt(0).toUpperCase() + r.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <div className="alert alert-error">⚠️ {error}</div>}

                    <div className="form-group">
                        <label className="form-label">{roleConfig[role].label}</label>
                        <input
                            type={role === 'student' ? 'text' : 'email'}
                            className="form-control"
                            placeholder={roleConfig[role].placeholder}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            autoComplete="username"
                            style={{
                                backgroundColor: 'white',  // ✅ White background
                                color: 'black',             // Optional: black text for contrast
                                border: '1px solid #ccc',   // Optional: nice border
                                borderRadius: '6px',        // Rounded corners
                                padding: '10px 12px',       // Padding inside input
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                            style={{
                                backgroundColor: 'white',   // ✅ White background
                                color: 'black',              // Black text for readability
                                border: '1px solid #ccc',    // Optional border
                                borderRadius: '6px',         // Rounded corners
                                padding: '10px 12px',        // Padding inside input
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : '🔑 Sign In'}
                    </button>

                    <div className="login-divider" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Demo: admin@school.com / Admin@123
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;