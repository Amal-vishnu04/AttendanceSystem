import React, { useEffect, useState } from 'react';
import axios from 'axios';

const InstructorsManager = () => {
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchInstructors = async () => {
        try {
            const { data } = await axios.get('/api/admin/instructors');
            setInstructors(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchInstructors(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true); setError('');
        try {
            await axios.post('/api/admin/instructors', form);
            setShowModal(false);
            setForm({ name: '', email: '', password: '' });
            fetchInstructors();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add instructor');
        } finally { setSaving(false); }
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Remove this instructor?')) return;
        try { await axios.delete(`/api/admin/instructors/${id}`); fetchInstructors(); }
        catch (e) { console.error(e); }
    };

    return (
        <>
            <div className="page-header">
                <h2>Instructors</h2>
                <p>Manage instructor accounts</p>
            </div>
            <div className="page-body fade-in">
                <div className="toolbar">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {instructors.length} instructor{instructors.length !== 1 ? 's' : ''}
                    </span>
                    <button className="btn btn-primary" onClick={() => { setShowModal(true); setError(''); }}>➕ Add Instructor</button>
                </div>

                {loading ? <div className="spinner" /> : instructors.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👨‍🏫</div>
                        <p>No instructors yet. Add your first instructor!</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Department</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructors.map((ins) => (
                                    <tr key={ins._id}>
                                        <td>{ins.name}</td>
                                        <td className="td-secondary">{ins.email}</td>
                                        <td className="td-secondary">{ins.department || '—'}</td>
                                        <td className="td-secondary">{new Date(ins.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleRemove(ins._id)}>🗑️ Remove</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>➕ Add Instructor</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="alert alert-error">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Dr. Jane Doe" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="instructor2@school.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password (default: Instructor@123)</label>
                                    <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Leave blank for default" />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : '➕ Add Instructor'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default InstructorsManager;
