import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { Present: '#10b981', Absent: '#ef4444', Late: '#f59e0b' };

const StudentAttendance = () => {
    const thisMonth = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const [month, setMonth] = useState(thisMonth());
    const [records, setRecords] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            axios.get(`/api/student/attendance?month=${month}`),
            axios.get('/api/student/leaves'),
        ]).then(([attRes, leaveRes]) => {
            setRecords(attRes.data);
            setLeaves(leaveRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, [month]);

    const counts = records.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, { Present: 0, Absent: 0, Late: 0 });

    const total = counts.Present + counts.Absent + counts.Late;
    const percentage = total > 0 ? ((counts.Present / total) * 100).toFixed(1) : 0;

    const pieData = [
        { name: 'Present', value: counts.Present },
        { name: 'Absent', value: counts.Absent },
        { name: 'Late', value: counts.Late },
    ].filter(d => d.value > 0);

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const percentColor = parseFloat(percentage) >= 75 ? '#10b981' : parseFloat(percentage) >= 60 ? '#f59e0b' : '#ef4444';

    return (
        <>
            <div className="page-header">
                <h2>My Attendance</h2>
                <p>Track your attendance history and statistics</p>
            </div>
            <div className="page-body fade-in">
                {/* Month filter */}
                <div className="toolbar" style={{ marginBottom: '20px' }}>
                    <div className="toolbar-left">
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Month:</label>
                        <input type="month" className="form-control" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 'auto' }} />
                    </div>
                </div>

                {loading ? <div className="spinner" /> : (
                    <>
                        {/* Stats + Chart row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            {/* Stats */}
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '16px' }}>📊 Summary</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { label: 'Present', count: counts.Present, color: '#10b981' },
                                        { label: 'Absent', count: counts.Absent, color: '#ef4444' },
                                        { label: 'Late', count: counts.Late, color: '#f59e0b' },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.color }}>{item.count} / {total}</span>
                                            </div>
                                            <div className="progress-bar-wrap">
                                                <div className="progress-bar-fill" style={{ width: total > 0 ? `${(item.count / total) * 100}%` : '0%', background: item.color }} />
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: percentColor }}>{percentage}%</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Attendance Rate</div>
                                        {parseFloat(percentage) < 75 && (
                                            <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#fca5a5' }}>⚠️ Below 75% threshold</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Pie Chart */}
                            <div className="card">
                                <div className="section-title" style={{ marginBottom: '12px' }}>🥧 Distribution</div>
                                {pieData.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '30px' }}>
                                        <div className="empty-icon">📅</div>
                                        <p style={{ fontSize: '0.82rem' }}>No data for this month</p>
                                    </div>
                                ) : (
                                    <div className="chart-wrapper">
                                        <ResponsiveContainer width="100%" height={180}>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                                                    {pieData.map((entry) => (
                                                        <Cell key={entry.name} fill={COLORS[entry.name]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.82rem' }}
                                                    itemStyle={{ color: 'var(--text-primary)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="chart-legend">
                                            {pieData.map(d => (
                                                <span key={d.name} style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                                                    <span className="legend-dot" style={{ background: COLORS[d.name] }} />
                                                    {d.name}: {d.value}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Attendance records table */}
                        <div className="card" style={{ marginBottom: '20px' }}>
                            <div className="section-title" style={{ marginBottom: '16px' }}>📅 Daily Records</div>
                            {records.length === 0 ? (
                                <div className="empty-state" style={{ padding: '30px' }}>
                                    <div className="empty-icon">📅</div>
                                    <p>No attendance records for this month.</p>
                                </div>
                            ) : (
                                <div className="table-wrapper" style={{ border: 'none' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Day</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records.map((r) => {
                                                const d = new Date(r.date);
                                                return (
                                                    <tr key={r._id}>
                                                        <td>{fmtDate(r.date)}</td>
                                                        <td className="td-secondary">{d.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                                                        <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Leave history */}
                        <div className="card">
                            <div className="section-title" style={{ marginBottom: '16px' }}>📋 My Leave Applications</div>
                            {leaves.length === 0 ? (
                                <div className="empty-state" style={{ padding: '30px' }}>
                                    <div className="empty-icon">📝</div>
                                    <p>No leave applications yet.</p>
                                </div>
                            ) : (
                                <div className="table-wrapper" style={{ border: 'none' }}>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>From</th>
                                                <th>To</th>
                                                <th>Reason</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaves.map((l) => (
                                                <tr key={l._id}>
                                                    <td className="td-secondary">{fmtDate(l.startDate)}</td>
                                                    <td className="td-secondary">{fmtDate(l.endDate)}</td>
                                                    <td style={{ fontSize: '0.85rem' }}>{l.reason}</td>
                                                    <td><span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default StudentAttendance;
