import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const today = () => new Date().toISOString().split('T')[0];

const MarkAttendance = () => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: 'Present'|'Absent'|'Leave' }
    const [date, setDate] = useState(today());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [studRes, attRes] = await Promise.all([
                axios.get('/api/instructor/students'),
                axios.get(`/api/instructor/attendance?date=${date}`),
            ]);
            setStudents(studRes.data);

            // Build map from existing attendance
            const map = {};
            attRes.data.forEach(r => { map[r.student._id] = r.status; });
            // Default unset students to 'Present'
            studRes.data.forEach(s => {
                if (!map[s._id]) map[s._id] = 'Present';
            });
            setAttendance(map);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [date]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const setStatus = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const records = students.map(s => ({ studentId: s._id, status: attendance[s._id] || 'Absent' }));
            await axios.post('/api/instructor/attendance', { date, records });
            setMessage({ type: 'success', text: 'Attendance saved successfully! ✅' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save attendance' });
        } finally { setSaving(false); }
    };

    const counts = Object.values(attendance).reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div className="page-header">
                <h2>Mark Attendance</h2>
                <p>Select a date and mark attendance for all students</p>
            </div>
            <div className="page-body fade-in">
                <div className="toolbar">
                    <div className="toolbar-left">
                        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--accent-success)' }}>P: {counts['Present'] || 0}</span>
                            <span style={{ color: 'var(--accent-danger)' }}>A: {counts['Absent'] || 0}</span>
                            <span style={{ color: 'var(--accent-warning)' }}>L: {counts['Leave'] || 0}</span>
                        </div>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                            const all = {};
                            students.forEach(s => all[s._id] = 'Present');
                            setAttendance(all);
                        }}>✅ All Present</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
                            {saving ? 'Saving…' : '💾 Save Attendance'}
                        </button>
                    </div>
                </div>

                {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                {loading ? <div className="spinner" /> : students.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎓</div>
                        <p>No students found. Ask admin to add students.</p>
                    </div>
                ) : (
                    <div>
                        {students.map((s) => (
                            <div key={s._id} className="attendance-row">
                                <div>
                                    <div className="attendance-student">{s.name}</div>
                                    <div className="attendance-roll">{s.rollNumber} · {s.department || 'N/A'}</div>
                                </div>
                                <div className="attendance-toggle">
                                    {['Present', 'Absent', 'Leave'].map((status) => (
                                        <button
                                            key={status}
                                            className={`toggle-btn ${attendance[s._id] === status ? `active-${status.toLowerCase()}` : ''}`}
                                            onClick={() => setStatus(s._id, status)}
                                        >
                                            {status === 'Present' ? 'P' : status === 'Absent' ? 'A' : 'L'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default MarkAttendance;
