'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = ''; // Relative path leverages next.config.mjs proxy

export function AdminAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('admin_token');
        const savedUser = localStorage.getItem('admin_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const res = await fetch(`${API_URL}/api/admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return data.data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setToken(null);
        setUser(null);
    }, []);

    const authFetch = useCallback(async (endpoint, options = {}) => {
        const currentToken = localStorage.getItem('admin_token');
        if (!currentToken) {
            logout();
            throw new Error('Sesi berakhir, silakan login kembali');
        }
        const res = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`,
                ...options.headers
            }
        });
        if (res.status === 401) {
            logout();
            throw new Error('Sesi berakhir, silakan login kembali');
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
        return data;
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AdminAuthProvider');
    return ctx;
}
