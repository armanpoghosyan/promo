import {createContext, useCallback, useContext, useEffect, useState, type ReactNode} from 'react';
import api from '../services/api';

export type AdminUser = {
    id: number;
    name: string;
    email?: string | null;
};

type LoginCredentials = {
    email: string;
    password: string;
};

type AuthContextValue = {
    user: AdminUser | null;
    loading: boolean;
    authenticated: boolean;

    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;

    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: { children: ReactNode; }) {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser =
        useCallback(async () => {
            try {
                const response = await api.get('/admin/me');

                const loadedUser =
                    response.data?.data ??
                    response.data?.user ??
                    response.data;

                setUser(loadedUser);
            } catch (error: any) {
                if (error.response?.status !== 401) {
                    console.error('Unable to load admin user.', error);
                }

                setUser(null);
            } finally {
                setLoading(false);
            }
        }, []);

    const login = async (credentials: LoginCredentials) => {
        const response =
            await api.post('/admin/login', credentials);

        const token =   response.data?.access_token ??
                        response.data?.token ??
                        response.data?.data?.access_token ??
                        response.data?.data?.token;

        if (token) {
            localStorage.setItem('admin_access_token', token);
        }

        await refreshUser();
    };

    const logout = async () => {
        try {await api.post('/admin/logout');
        } finally {
            localStorage.removeItem('admin_access_token');

            setUser(null);
        }
    };

    useEffect(() => {
        const shouldCheckAuth =
            location.pathname === '/login' ||
            location.pathname.startsWith('/admin');

        if (!shouldCheckAuth) {
            setLoading(false);
            return;
        }

        if (user) {
            setLoading(false);
            return;
        }

        refreshUser();
    }, [location.pathname, refreshUser, user]);

    useEffect(() => {
        const handleUnauthorized = () => {setUser(null);};

        window.addEventListener('admin:unauthorized', handleUnauthorized);

        return () => {window.removeEventListener('admin:unauthorized', handleUnauthorized);};
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,

                authenticated: user !== null,

                login,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
