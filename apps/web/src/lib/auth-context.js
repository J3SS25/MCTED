import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from './api';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshUser = async () => {
        try {
            const data = await apiRequest('/auth/me');
            setUser(data);
        }
        catch {
            setUser(null);
            localStorage.removeItem('mcteb_token');
        }
        finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        refreshUser();
    }, []);
    const login = async (credentials) => {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        localStorage.setItem('mcteb_token', data.token);
        setUser(data.user);
    };
    const register = async (input) => {
        const data = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(input),
        });
        localStorage.setItem('mcteb_token', data.token);
        setUser(data.user);
    };
    const logout = async () => {
        try {
            await apiRequest('/auth/logout', { method: 'POST' });
        }
        catch {
            // Ignore network errors on logout
        }
        finally {
            localStorage.removeItem('mcteb_token');
            setUser(null);
        }
    };
    return (_jsx(AuthContext.Provider, { value: { user, isLoading, login, register, logout, refreshUser }, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
//# sourceMappingURL=auth-context.js.map