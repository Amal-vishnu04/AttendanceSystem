import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const today = () => new Date().toISOString().split('T')[0];

const MarkAttendance = () => {
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(today());
    const [year, setYear] = useState(""); // ✅ Added year state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // ✅ Fetch students + attendance by year & date
    const fetchData = useCallback(async () => {
        if (!year) return;

        setLoading(true);
        try {
            const [studRes, attRes] = await Promise.all([
                axios.get(`/api/instructor/students?year=${year}`),
                axios.get(`/api/instructor/attendance?date=${date}&year=${year}`)
            ]);

            setStudents(studRes.data);

            const map = {};
            attRes.data.forEach(r => {
                map[r.student._id] = r.status;
            });

            // Default Present if not marked
            studRes.data.forEach(s => {
                if (!map[s._id]) map[s._id] = 'Present';
            });

            setAttendance(map);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [date, year]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setStatus = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!year) {
            setMessage({ type: 'error', text: 'Please select a year first' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            const records = students.map(s => ({
                studentId: s._id,
                status: attendance[s._id] || 'Absent'
            }));

            await axios.post('/api/instructor/attendance', {
                date,
                year, // ✅ sending year
                records
            });

            setMessage({ type: 'success', text: 'Attendance saved successfully! ✅' });

        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to save attendance'
            });
        } finally {
            setSaving(false);
        }
    };

    const counts = Object.values(attendance).reduce((acc, v) => {
        acc[v] = (acc[v] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div className="page-header">
                <h2>Mark Attendance</h2>
                <p>Select year, date and mark attendance</p>
            </div>

            <div className="page-body fade-in">
                <div className="toolbar">

                    <div className="toolbar-left">

                        {/* ✅ Year Dropdown */}
                        <select
                            className="form-control"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            style={{ width: '150px' }}
                        >
                            <option value="">Select Year</option>
                            <option value="1st">1st Year</option>
                            <option value="2nd">2nd Year</option>
                            <option value="3rd">3rd Year</option>
                            <option value="4th">4th Year</option>
                        </select>

                        <input
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ width: 'auto' }}
                        />

                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--accent-success)' }}>
                                P: {counts['Present'] || 0}
                            </span>
                            <span style={{ color: 'var(--accent-danger)' }}>
                                A: {counts['Absent'] || 0}
                            </span>
                            <span style={{ color: 'var(--accent-warning)' }}>
                                L: {counts['Late'] || 0}
                            </span>
                        </div>
                    </div>

                    <div className="toolbar-right">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                                const all = {};
                                students.forEach(s => all[s._id] = 'Present');
                                setAttendance(all);
                            }}
                        >
                            ✅ All Present
                        </button>

                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={saving || loading || !year}
                        >
                            {saving ? 'Saving…' : '💾 Save Attendance'}
                        </button>
                    </div>
                </div>

                {message && (
                    <div className={`alert alert-${message.type}`}>
                        {message.text}
                    </div>
                )}

                {!year ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <p>Please select a year to view students</p>
                    </div>
                ) : loading ? (
                    <div className="spinner" />
                ) : students.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎓</div>
                        <p>No students found for this year.</p>
                    </div>
                ) : (
                    <div>
                        {students.map((s) => (
                            <div key={s._id} className="attendance-row">
                                <div>
                                    <div className="attendance-student">{s.name}</div>
                                    <div className="attendance-roll">
                                        {s.rollNumber} · {s.department || 'N/A'}
                                    </div>
                                </div>

                                <div className="attendance-toggle">
                                    {['Present', 'Absent', 'Late'].map((status) => (
                                        <button
                                            key={status}
                                            className={`toggle-btn ${
                                                attendance[s._id] === status
                                                    ? `active-${status.toLowerCase()}`
                                                    : ''
                                            }`}
                                            onClick={() => setStatus(s._id, status)}
                                        >
                                            {status === 'Present' ? 'P' :
                                             status === 'Absent' ? 'A' : 'L'}
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