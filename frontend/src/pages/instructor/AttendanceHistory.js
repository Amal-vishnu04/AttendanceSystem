import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AttendanceHistory = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportMonth, setExportMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
    const [exportYear, setExportYear] = useState('');
    const [exportSubject, setExportSubject] = useState('');
    const [exporting, setExporting] = useState(false);
    const [instructorSubjects, setInstructorSubjects] = useState([]);

    useEffect(() => {
        axios.get('/api/instructor/profile')
            .then(res => {
                if (res.data.subjects) setInstructorSubjects(res.data.subjects);
            })
            .catch(err => console.error(err));
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`/api/instructor/attendance?date=${date}`);
            setRecords(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchHistory(); }, [date]); // eslint-disable-line

    const handleExport = async () => {
        setExporting(true);
        try {
            const token = localStorage.getItem('aiq_token');
            let exportUrl = `/api/instructor/export?month=${exportMonth}`;
            if (exportYear) exportUrl += `&year=${exportYear}`;
            if (exportSubject) exportUrl += `&subject=${exportSubject}`;
            const response = await fetch(exportUrl, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Export failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_${exportMonth}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Export failed: ' + e.message);
        } finally { setExporting(false); }
    };

    const statusCount = records.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div className="page-header">
                <h2>Attendance History</h2>
                <p>View and export historical attendance records</p>
            </div>
            <div className="page-body fade-in">
                {/* Export section */}
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📊 Export Monthly Report</span>
                        <input type="month" className="form-control" value={exportMonth} onChange={e => setExportMonth(e.target.value)} style={{ width: 'auto' }} />
                        <select
                            className="form-control"
                            value={exportYear}
                            onChange={(e) => setExportYear(e.target.value)}
                            style={{ width: '120px' }}
                        >
                            <option value="">All Years</option>
                            <option value="1st">1st Year</option>
                            <option value="2nd">2nd Year</option>
                            <option value="3rd">3rd Year</option>
                            <option value="4th">4th Year</option>
                        </select>
                        <select
                            className="form-control"
                            value={exportSubject}
                            onChange={(e) => setExportSubject(e.target.value)}
                            style={{ width: '140px' }}
                        >
                            <option value="">All Subjects</option>
                            {instructorSubjects.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                        <button className="btn btn-success" onClick={handleExport} disabled={exporting || !exportMonth}>
                            {exporting ? 'Exporting…' : '⬇️ Download Excel'}
                        </button>
                    </div>
                </div>

                {/* Date filter */}
                <div className="toolbar">
                    <div className="toolbar-left">
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>View Date:</label>
                        <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} style={{ width: 'auto' }} />
                    </div>
                    {records.length > 0 && (
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem' }}>
                            <span style={{ color: 'var(--accent-success)' }}>Present: {statusCount['Present'] || 0}</span>
                            <span style={{ color: 'var(--accent-danger)' }}>Absent: {statusCount['Absent'] || 0}</span>
                            <span style={{ color: 'var(--accent-warning)' }}>Late: {statusCount['Late'] || 0}</span>
                        </div>
                    )}
                </div>

                {loading ? <div className="spinner" /> : records.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📅</div>
                        <p>No attendance records found for {date}.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Roll Number</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Year</th>
                                    <th>Period</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((r) => (
                                    <tr key={r._id}>
                                        <td><code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>{r.student?.rollNumber}</code></td>
                                        <td>{r.student?.name}</td>
                                        <td className="td-secondary">{r.student?.department || '—'}</td>
                                        <td className="td-secondary">{r.year || r.student?.year}</td>
                                        <td>{r.period || '-'}</td>
                                        <td className="td-secondary">{r.subject || '-'}</td>
                                        <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default AttendanceHistory;
