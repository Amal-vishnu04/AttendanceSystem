import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AdminProfile = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({ name: '', phone: '', bio: '' });
    const [profilePicture, setProfilePicture] = useState(null);
    const [previewPic, setPreviewPic] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState(null);

    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwMsg, setPwMsg] = useState(null);
    const [showPw, setShowPw] = useState({ current: false, newpw: false, confirm: false });

    useEffect(() => {
        if (user) {
            setForm({ name: user.name || '', phone: user.phone || '', bio: user.bio || '' });
            setPreviewPic(user.profilePicture || null);
            setProfilePicture(null);
        }
    }, [user]);

    const handlePicChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setSaveMsg({ type: 'error', text: '❌ Image too large. Max 2MB allowed.' });
            return;
        }
        if (!file.type.startsWith('image/')) {
            setSaveMsg({ type: 'error', text: '❌ Please select a valid image file.' });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewPic(reader.result);
            setProfilePicture(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePic = () => {
        setPreviewPic(null);
        setProfilePicture('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setSaveMsg({ type: 'error', text: '❌ Name cannot be empty.' });
            return;
        }
        setSaving(true);
        setSaveMsg(null);
        try {
            const payload = { ...form };
            if (profilePicture !== null) payload.profilePicture = profilePicture;
            const { data } = await axios.put('/api/admin/profile', payload);
            updateUser(data);
            setProfilePicture(null);
            setSaveMsg({ type: 'success', text: '✅ Profile updated successfully!' });
        } catch (err) {
            setSaveMsg({ type: 'error', text: `❌ ${err.response?.data?.message || 'Failed to save profile.'}` });
        } finally {
            setSaving(false);
        }
    };

    const handlePwChange = async (e) => {
        e.preventDefault();
        setPwMsg(null);
        if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            setPwMsg({ type: 'error', text: '❌ All fields are required.' });
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            setPwMsg({ type: 'error', text: '❌ New passwords do not match.' });
            return;
        }
        if (pwForm.newPassword.length < 6) {
            setPwMsg({ type: 'error', text: '❌ Password must be at least 6 characters.' });
            return;
        }
        setPwSaving(true);
        try {
            await axios.put('/api/admin/change-password', {
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
            });
            setPwMsg({ type: 'success', text: '✅ Password changed successfully!' });
            setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setPwMsg({ type: 'error', text: `❌ ${err.response?.data?.message || 'Failed to change password.'}` });
        } finally {
            setPwSaving(false);
        }
    };

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    const pwStrength = pwForm.newPassword.length >= 10 ? 'Strong 💪' : pwForm.newPassword.length >= 6 ? 'Fair ⚠️' : 'Weak ❌';
    const pwStrengthColor = pwForm.newPassword.length >= 10 ? 'var(--accent-success)' : pwForm.newPassword.length >= 6 ? 'var(--accent-warning)' : 'var(--accent-danger)';

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>⚙️ Admin Profile</h2>
                <p>Manage your administrator account, profile photo, and security settings</p>
            </div>

            <div className="page-body">
                {/* Profile Hero Card */}
                <div className="profile-hero-card" style={{ marginBottom: '24px' }}>
                    <div className="profile-hero-bg" />
                    <div className="profile-hero-content">
                        {/* Avatar */}
                        <div className="profile-avatar-wrap">
                            <div className="profile-avatar-ring">
                                <div className="profile-avatar-img">
                                    {previewPic
                                        ? <img src={previewPic} alt="Profile" />
                                        : <span>{initials}</span>
                                    }
                                </div>
                            </div>
                            <button
                                className="profile-cam-btn"
                                onClick={() => fileInputRef.current?.click()}
                                title="Change profile picture"
                            >
                                📷
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handlePicChange}
                            />
                        </div>

                        {/* Info */}
                        <div className="profile-hero-info">
                            <h3 className="profile-hero-name">{user?.name}</h3>
                            <div className="profile-hero-badges">
                                <span className="profile-badge purple">🛡️ Administrator</span>
                                {user?.email && <span className="profile-badge blue">✉️ {user?.email}</span>}
                                {user?.phone && <span className="profile-badge teal">📞 {user?.phone}</span>}
                            </div>
                        </div>

                        {previewPic && (
                            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={handleRemovePic}>
                                🗑️ Remove Photo
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-grid">
                    {/* Edit Info */}
                    <div className="card slide-up">
                        <div className="section-header">
                            <h3 className="section-title">✏️ Edit Information</h3>
                        </div>

                        {saveMsg && (
                            <div className={`alert ${saveMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                                {saveMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleSave}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-control"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Administrator full name"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input
                                        className="form-control"
                                        value={form.phone}
                                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="+91 9876543210"
                                        type="tel"
                                    />
                                </div>

                                {/* Read-only fields */}
                                <div className="form-grid" style={{ gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-control" value={user?.email || '—'} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <input className="form-control" value="Administrator" readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Bio <span style={{ color: 'var(--text-muted)', textTransform: 'none', fontWeight: 400 }}>(max 200 chars)</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        value={form.bio}
                                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                                        placeholder="Brief description about the admin..."
                                        maxLength={200}
                                        rows={3}
                                    />
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                        {form.bio.length}/200
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? '⏳ Saving...' : '💾 Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Change Password */}
                        <div className="card slide-up">
                            <div className="section-header">
                                <h3 className="section-title">🔐 Change Password</h3>
                            </div>

                            {pwMsg && (
                                <div className={`alert ${pwMsg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                                    {pwMsg.text}
                                </div>
                            )}

                            <form onSubmit={handlePwChange}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {/* Current Password */}
                                    <div className="form-group">
                                        <label className="form-label">Current Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-control"
                                                type={showPw.current ? 'text' : 'password'}
                                                value={pwForm.currentPassword}
                                                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                                                placeholder="Enter current password"
                                                autoComplete="current-password"
                                                style={{ paddingRight: '44px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
                                            >{showPw.current ? '🙈' : '👁️'}</button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div className="form-group">
                                        <label className="form-label">New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-control"
                                                type={showPw.newpw ? 'text' : 'password'}
                                                value={pwForm.newPassword}
                                                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                                                placeholder="Min 6 characters"
                                                autoComplete="new-password"
                                                style={{ paddingRight: '44px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(s => ({ ...s, newpw: !s.newpw }))}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
                                            >{showPw.newpw ? '🙈' : '👁️'}</button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="form-group">
                                        <label className="form-label">Confirm New Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="form-control"
                                                type={showPw.confirm ? 'text' : 'password'}
                                                value={pwForm.confirmPassword}
                                                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                                                placeholder="Repeat new password"
                                                autoComplete="new-password"
                                                style={{ paddingRight: '44px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                                                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)' }}
                                            >{showPw.confirm ? '🙈' : '👁️'}</button>
                                        </div>
                                    </div>

                                    {/* Password strength */}
                                    {pwForm.newPassword && (
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                                Strength: <strong style={{ color: pwStrengthColor }}>{pwStrength}</strong>
                                            </div>
                                            <div className="progress-bar-wrap">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{
                                                        width: `${Math.min(100, (pwForm.newPassword.length / 12) * 100)}%`,
                                                        background: pwStrengthColor
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Match indicator */}
                                    {pwForm.confirmPassword && (
                                        <div style={{ fontSize: '0.78rem', color: pwForm.newPassword === pwForm.confirmPassword ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                                            {pwForm.newPassword === pwForm.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                                        </div>
                                    )}

                                    <div className="form-actions">
                                        <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                                            {pwSaving ? '⏳ Updating...' : '🔑 Update Password'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Account Info Card */}
                        <div className="card">
                            <div className="section-header">
                                <h3 className="section-title">ℹ️ Account Info</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { label: 'Status', value: user?.isActive ? '🟢 Active' : '🔴 Inactive', valueColor: user?.isActive ? 'var(--accent-success)' : 'var(--accent-danger)' },
                                    { label: 'Access Level', value: '🛡️ Full Administrator' },
                                    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                                    { label: 'Last Updated', value: user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                                ].map(({ label, value, valueColor }) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: valueColor || 'var(--text-primary)' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
