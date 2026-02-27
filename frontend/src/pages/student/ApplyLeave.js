import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApplyLeave = () => {
    const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [loadingLeaves, setLoadingLeaves] = useState(true);

    const fetchLeaves = async () => {
        try {
            const { data } = await axios.get('/api/student/leaves');
            setLeaves(data);
        } catch (e) { console.error(e); }
        finally { setLoadingLeaves(false); }
    };

    useEffect(() => { fetchLeaves(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.endDate < form.startDate) {
            setMessage({ type: 'error', text: 'End date cannot be before start date.' });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        try {
            await axios.post('/api/student/leave', form);
            setMessage({ type: 'success', text: 'Leave application submitted successfully! ✅' });
            setForm({ startDate: '', endDate: '', reason: '' });
            fetchLeaves();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit leave.' });
        } finally { setSubmitting(false); }
    };

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    const minDate = new Date().toISOString().split('T')[0];

    return (
        <>
            <div className="page-header">
                <h2>Apply for Leave</h2>
                <p>Submit a leave request with your date range and reason</p>
            </div>
            <div className="page-body fade-in">
                {/* Apply form */}
                <div className="card" style={{ maxWidth: '600px', marginBottom: '28px' }}>
                    <div className="section-title" style={{ marginBottom: '20px' }}>📝 New Leave Request</div>
                    {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid" style={{ marginBottom: '16px' }}>
                            <div className="form-group">
                                <label className="form-label">Start Date *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={form.startDate}
                                    min={minDate}
                                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">End Date *</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={form.endDate}
                                    min={form.startDate || minDate}
                                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Reason *</label>
                            <textarea
                                className="form-control"
                                placeholder="Please describe your reason for leave (e.g., medical appointment, family event)…"
                                value={form.reason}
                                onChange={e => setForm({ ...form, reason: e.target.value })}
                                required
                                rows={4}
                            />
                        </div>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Submitting…' : '📤 Submit Leave Request'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Leave history */}
                <div className="card">
                    <div className="section-title" style={{ marginBottom: '16px' }}>📋 My Leave History</div>
                    {loadingLeaves ? <div className="spinner" style={{ padding: '30px' }} /> : leaves.length === 0 ? (
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
                                        <th>Applied</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map((l) => (
                                        <tr key={l._id}>
                                            <td className="td-secondary">{fmtDate(l.startDate)}</td>
                                            <td className="td-secondary">{fmtDate(l.endDate)}</td>
                                            <td style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                                                <span title={l.reason} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</span>
                                            </td>
                                            <td>
                                                <span className={`badge badge-${l.status.toLowerCase()}`}>
                                                    {l.status === 'Pending' ? '⏳' : l.status === 'Approved' ? '✅' : '❌'} {l.status}
                                                </span>
                                            </td>
                                            <td className="td-secondary">{fmtDate(l.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ApplyLeave;
