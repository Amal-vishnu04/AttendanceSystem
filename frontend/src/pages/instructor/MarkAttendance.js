import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const today = () => new Date().toISOString().split('T')[0];

const MarkAttendance = () => {
    const [timetable, setTimetable] = useState([]);
    const [todayDay, setTodayDay] = useState("");
    const [selectedClass, setSelectedClass] = useState(null);

    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(today());
    const [activity, setActivity] = useState("Lecture");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Fetch timetable for today
    useEffect(() => {
        const fetchTimetable = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/instructor/timetable/today');
                setTodayDay(res.data.day);
                setTimetable(res.data.timetable || []);
            } catch (err) {
                console.error("Error fetching timetable:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, []);

    // Fetch students + attendance when a class is selected
    const fetchData = useCallback(async () => {
        if (!selectedClass) return;

        setLoading(true);
        try {
            const { year, period, subject } = selectedClass;
            const [studRes, attRes] = await Promise.all([
                axios.get(`/api/instructor/students?year=${year}`),
                axios.get(`/api/instructor/attendance?date=${date}&year=${year}&period=${period}&subject=${subject}`)
            ]);

            setStudents(studRes.data);

            const map = {};
            attRes.data.forEach(r => {
                map[r.student._id] = r.status;
                if (r.activity) setActivity(r.activity); // Set activity if already saved
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
    }, [date, selectedClass]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const setStatus = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleSave = async () => {
        if (!selectedClass || !activity) {
            setMessage({ type: 'error', text: 'Class and Activity are required' });
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
                year: selectedClass.year,
                period: selectedClass.period,
                subject: selectedClass.subject,
                day: todayDay,
                activity,
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

    if (!selectedClass) {
        return (
            <>
                <div className="page-header">
                    <h2>Today's Timetable ({todayDay || new Date().toLocaleDateString('en-US', { weekday: 'long' })})</h2>
                    <p>Select a class to mark attendance</p>
                </div>
                <div className="page-body fade-in">
                    {loading ? (
                        <div className="spinner" />
                    ) : timetable.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📅</div>
                            <p>No classes assigned for today.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {timetable.map(entry => (
                                <div key={entry._id} style={{
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '15px 20px', 
                                    background: 'var(--surface-color)', 
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)',
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-color)' }}>
                                            Period {entry.period} – {entry.subject}
                                        </h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {entry.year} Year Students
                                        </p>
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => setSelectedClass(entry)}
                                    >
                                        Mark Attendance
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <div className="page-header">
                <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => { setSelectedClass(null); setMessage(null); }}
                    style={{ marginBottom: '15px' }}
                >
                    ⬅ Back to Timetable
                </button>
                <h2>Mark Attendance - Period {selectedClass.period}</h2>
                <p>{selectedClass.subject} ({selectedClass.year} Year)</p>
            </div>

            <div className="page-body fade-in">
                <div className="toolbar" style={{ flexWrap: 'wrap', gap: '15px' }}>

                    <div className="toolbar-left">
                        {/* ✅ Date */}
                        <input
                            type="date"
                            className="form-control"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ width: 'auto' }}
                        />

                        {/* ✅ Activity Dropdown */}
                        <select
                            className="form-control"
                            value={activity}
                            onChange={(e) => setActivity(e.target.value)}
                            style={{ width: '130px' }}
                        >
                            <option value="Lecture">Lecture</option>
                            <option value="Lab">Lab</option>
                            <option value="Seminar">Seminar</option>
                            <option value="Test">Test</option>
                            <option value="Assignment">Assignment</option>
                        </select>

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
                            disabled={saving || loading}
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

                {loading ? (
                    <div className="spinner" />
                ) : students.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎓</div>
                        <p>No students found for this year.</p>
                    </div>
                ) : (
                    <div style={{ marginTop: '20px' }}>
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