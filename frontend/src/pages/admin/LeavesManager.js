import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeavesManager = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        axios.get('/api/admin/leaves').then(({ data }) => setLeaves(data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'All' ? leaves : leaves.filter(l => l.status === filter);

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
        <>
            <div className="page-header">
                <h2>Leave Requests</h2>
                <p>All leave requests submitted across the system</p>
            </div>
            <div className="page-body fade-in">
                <div className="toolbar">
                    <div className="toolbar-left">
                        {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
                            <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(s)}>{s}</button>
                        ))}
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {loading ? <div className="spinner" /> : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <p>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}leave requests found.</p>
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
                                    <th>Reviewed By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((l) => (
                                    <tr key={l._id}>
                                        <td>{l.student?.name || '—'}</td>
                                        <td className="td-secondary">{l.student?.rollNumber || '—'}</td>
                                        <td className="td-secondary">{fmtDate(l.startDate)}</td>
                                        <td className="td-secondary">{fmtDate(l.endDate)}</td>
                                        <td style={{ maxWidth: '200px' }}>
                                            <span title={l.reason} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontSize: '0.85rem' }}>{l.reason}</span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${l.status.toLowerCase()}`}>{l.status}</span>
                                        </td>
                                        <td className="td-secondary">{l.reviewedBy?.name || '—'}</td>
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

export default LeavesManager;
