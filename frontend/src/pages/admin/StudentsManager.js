import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentsManager = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    department: '',
    year: '',          // ✅ Year included
    parentContact: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // ==============================
  // Fetch all students
  // ==============================
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

  useEffect(() => {
    fetchStudents();
  }, []);

  // ==============================
  // Open Add Student Modal
  // ==============================
  const openAdd = () => {
    setEditingStudent(null);
    setForm({
      name: '',
      rollNumber: '',
      department: '',
      year: '',
      parentContact: '',
      password: ''
    });
    setError('');
    setShowModal(true);
  };

  // ==============================
  // Open Edit Student Modal
  // ==============================
  const openEdit = (student) => {
    setEditingStudent(student);
    setForm({
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department || '',
      year: student.year || '',
      parentContact: student.parentContact || '',
      password: ''
    });
    setError('');
    setShowModal(true);
  };

  // ==============================
  // Submit Form (Add / Edit)
  // ==============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // ✅ Simple Frontend Validation
    if (!form.year) {
      setError('Year is required');
      setSaving(false);
      return;
    }

    try {
      if (editingStudent) {
        // Edit student
        await axios.put(`/api/admin/students/${editingStudent._id}`, form);
      } else {
        // Add student
        await axios.post('/api/admin/students', form);
      }

      setShowModal(false);
      fetchStudents();

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  // ==============================
  // Delete Student
  // ==============================
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student? They will be deactivated.')) return;

    try {
      await axios.delete(`/api/admin/students/${id}`);
      fetchStudents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Students</h2>
        <p>Manage student records and enrollment</p>
      </div>

      <div className="page-body fade-in">
        <div className="toolbar">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </span>
          <button className="btn btn-primary" onClick={openAdd}>➕ Add Student</button>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : students.length === 0 ? (
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
                  <th>Year</th>
                  <th>Parent Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <code style={{
                        background: 'var(--bg-input)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.82rem'
                      }}>{s.rollNumber}</code>
                    </td>
                    <td>{s.name}</td>
                    <td className="td-secondary">{s.department || '—'}</td>
                    <td className="td-secondary">{s.year || '—'}</td>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingStudent ? '✏️ Edit Student' : '➕ Add Student'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input
                    className="form-control"
                    value={form.rollNumber}
                    onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                    required
                    disabled={!!editingStudent}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    className="form-control"
                    value={form.department}
                    onChange={e => setForm({ ...form, department: e.target.value })}
                  />
                </div>

                {/* Year Dropdown */}
                <div className="form-group">
                  <label className="form-label">Year *</label>
                  <select
                    className="form-control"
                    value={form.year}
                    onChange={e => setForm({ ...form, year: e.target.value })}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Parent Contact</label>
                  <input
                    className="form-control"
                    value={form.parentContact}
                    onChange={e => setForm({ ...form, parentContact: e.target.value })}
                  />
                </div>

                {!editingStudent && (
                  <div className="form-group">
                    <label className="form-label">Password (default: Student@123)</label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editingStudent ? '💾 Update' : '➕ Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentsManager;