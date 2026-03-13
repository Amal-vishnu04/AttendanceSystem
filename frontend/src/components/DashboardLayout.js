import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ navItems, children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : '?';

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h1>🎓 AttendanceIQ</h1>
                    <p>Smart Attendance System</p>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item, idx) => {
                        if (item.type === 'label') {
                            return <div key={idx} className="nav-label">{item.label}</div>;
                        }
                        return (
                            <NavLink
                                key={idx}
                                to={item.to}
                                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                                end={item.end}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">
                            {user?.profilePicture
                                ? <img src={user.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : initials
                            }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                            <div className="user-role">{user?.role}</div>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
