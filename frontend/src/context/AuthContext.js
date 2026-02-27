import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('aiq_token'));
    const [loading, setLoading] = useState(true);

    // Axios defaults
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    // On mount: fetch current user
    useEffect(() => {
        const fetchMe = async () => {
            if (!token) { setLoading(false); return; }
            try {
                const { data } = await axios.get('/api/auth/me');
                setUser(data);
            } catch {
                logout();
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
        // eslint-disable-next-line
    }, []);

    const login = async (identifier, password, role) => {
        const { data } = await axios.post('/api/auth/login', { identifier, password, role });
        localStorage.setItem('aiq_token', data.token);
        setToken(data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        localStorage.removeItem('aiq_token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
