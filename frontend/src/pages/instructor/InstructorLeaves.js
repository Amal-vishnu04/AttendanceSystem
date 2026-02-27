import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InstructorLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [processing, setProcessing] = useState(null);

    const fetchLeaves = async () => {
        try {
            const { data } = await axios.get('/api/instructor/leaves');
            setLeaves(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleAction = async (id, status) => {
        setProcessing(id + status);
        try {
            await axios.patch(`/api/instructor/leaves/${id}`, { status });
            fetchLeaves();
        } catch (e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <>
            <div className="page-header">
                <h2>Leave Requests</h2>
                <p>Review and approve or reject student leave applications</p>
            </div>
            <div className="page-body fade-in">
                <div className="toolbar">
                    <div className="toolbar-left">
                        {['Pending', 'Approved', 'Rejected', 'All'].map(s => (
                            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
                        ))}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? <div className="spinner" /> : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}leave requests.</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((l) => (
                                    <tr key={l._id}>
                                        <td>{l.student?.name || '—'}</td>
                                        <td className="td-secondary">{l.student?.rollNumber || '—'}</td>
                                        <td className="td-secondary">{fmtDate(l.startDate)}</td>
                                        <td className="td-secondary">{fmtDate(l.endDate)}</td>
                                        <td style={{ maxWidth: '160px' }}>
                                            <span title={l.reason} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px', fontSize: '0.85rem' }}>{l.reason}</span>
                                        </td>
                                        <td><span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span></td>
                                        <td>
                                            {l.status === 'Pending' ? (
                                                <div style={{ display: 'flex', gap: '6px' }}>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleAction(l._id, 'Approved')}
                                                        disabled={processing === l._id + 'Approved'}
                                                    >✅ Approve</button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleAction(l._id, 'Rejected')}
                                                        disabled={processing === l._id + 'Rejected'}
                                                    >❌ Reject</button>
                                                </div>
                                            ) : (
                                                <span className="td-secondary" style={{ fontSize: '0.78rem' }}>Reviewed</span>
                                            )}
                                        </td>
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

export default InstructorLeaves;
