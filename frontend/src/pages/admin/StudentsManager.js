import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentsManager = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form, setForm] = useState({ name: '', rollNumber: '', department: '', parentContact: '', password: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchStudents = async () => {
        try {
            const { data } = await axios.get('/api/admin/students');
            setStudents(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStudents(); }, []);

    const openAdd = () => {
        setEditingStudent(null);
        setForm({ name: '', rollNumber: '', department: '', parentContact: '', password: '' });
        setError('');
        setShowModal(true);
    };

    const openEdit = (s) => {
        setEditingStudent(s);
        setForm({ name: s.name, rollNumber: s.rollNumber, department: s.department || '', parentContact: s.parentContact || '', password: '' });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            if (editingStudent) {
                await axios.put(`/api/admin/students/${editingStudent._id}`, form);
            } else {
                await axios.post('/api/admin/students', form);
            }
            setShowModal(false);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this student? They will be deactivated.')) return;
        try {
            await axios.delete(`/api/admin/students/${id}`);
            fetchStudents();
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <div className="page-header">
                <h2>Students</h2>
                <p>Manage student records and enrollment</p>
            </div>
            <div className="page-body fade-in">
                <div className="toolbar">
                    <div className="toolbar-left">
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
                        </span>
                    </div>
                    <div className="toolbar-right">
                        <button className="btn btn-primary" onClick={openAdd}>➕ Add Student</button>
                    </div>
                </div>

                {loading ? <div className="spinner" /> : students.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🎓</div>
                        <p>No students yet. Add your first student!</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Roll Number</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Parent Contact</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s._id}>
                                        <td><code style={{ background: 'var(--bg-input)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.82rem' }}>{s.rollNumber}</code></td>
                                        <td>{s.name}</td>
                                        <td className="td-secondary">{s.department || '—'}</td>
                                        <td className="td-secondary">{s.parentContact || '—'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>🗑️ Remove</button>
                                            </div>
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
                            <h3>{editingStudent ? '✏️ Edit Student' : '➕ Add Student'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        {error && <div className="alert alert-error">⚠️ {error}</div>}
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid" style={{ marginBottom: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Alice Johnson" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Roll Number *</label>
                                    <input className="form-control" value={form.rollNumber} onChange={e => setForm({ ...form, rollNumber: e.target.value })} required placeholder="CS2021004" disabled={!!editingStudent} style={editingStudent ? { opacity: 0.5 } : {}} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <input className="form-control" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Computer Science" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Parent Contact</label>
                                    <input className="form-control" value={form.parentContact} onChange={e => setForm({ ...form, parentContact: e.target.value })} placeholder="9876543210" />
                                </div>
                                {!editingStudent && (
                                    <div className="form-group">
                                        <label className="form-label">Password (default: Student@123)</label>
                                        <input type="password" className="form-control" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Leave blank for default" />
                                    </div>
                                )}
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editingStudent ? '💾 Update' : '➕ Add Student'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentsManager;
