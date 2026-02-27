import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminHome = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/admin/stats').then(({ data }) => {
            setStats(data);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="spinner" />;

    const cards = [
        { icon: '🎓', label: 'Total Students', value: stats?.totalStudents ?? 0, cls: 'purple' },
        { icon: '👨‍🏫', label: 'Instructors', value: stats?.totalInstructors ?? 0, cls: 'blue' },
        { icon: '✅', label: "Today's Present", value: stats?.todayAttendance ?? 0, cls: 'green' },
        { icon: '📋', label: 'Pending Leaves', value: stats?.pendingLeaves ?? 0, cls: 'amber' },
    ];

    return (
        <>
            <div className="page-header">
                <h2>Admin Dashboard</h2>
                <p>Overview of your institution's attendance system</p>
            </div>
            <div className="page-body fade-in">
                <div className="stat-grid">
                    {cards.map((c, i) => (
                        <div className="stat-card" key={i}>
                            <div className={`stat-icon ${c.cls}`}>{c.icon}</div>
                            <div>
                                <div className="stat-label">{c.label}</div>
                                <div className="stat-value">{c.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>Quick Info</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <li style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                            📌 Use the <strong>Students</strong> section to add, edit, or remove students
                        </li>
                        <li style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                            📌 Use the <strong>Instructors</strong> section to manage instructor accounts
                        </li>
                        <li style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                            📌 View all <strong>Leave Requests</strong> submitted by students across the system
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default AdminHome;
