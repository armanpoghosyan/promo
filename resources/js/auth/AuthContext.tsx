import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import { useLocation } from 'react-router-dom';

import api from '../services/api';

import type {
    AdminUser,
    CurrentUserResponse,
    LoginCredentials,
    LoginResponse,
} from '../types/auth';

type AuthContextValue = {
    user: AdminUser | null;
    loading: boolean;
    authenticated: boolean;

    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext =
    createContext<AuthContextValue | null>(null);

export function AuthProvider({
                                 children,
                             }: {
    children: ReactNode;
}) {
    const location = useLocation();

    const [user, setUser] =
        useState<AdminUser | null>(null);

    const [loading, setLoading] =
        useState(true);

    const refreshUser = useCallback(
        async () => {
            const token =
                localStorage.getItem(
                    'admin_access_token'
                );

            if (!token) {
                setUser(null);
                setLoading(false);

                return;
            }

            try {
                const response =
                    await api.get<CurrentUserResponse>(
                        '/admin/me'
                    );

                setUser(response.data.data);
            } catch (error: unknown) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const login = async (
        credentials: LoginCredentials
    ) => {
        const response =
            await api.post<LoginResponse>(
                '/admin/login',
                credentials
            );

        const {
            token,
            user: loggedInUser,
        } = response.data.data;

        localStorage.setItem(
            'admin_access_token',
            token
        );

        setUser(loggedInUser);
        setLoading(false);
    };

    const logout = async () => {
        try {
            await api.post('/admin/logout');
        } finally {
            localStorage.removeItem(
                'admin_access_token'
            );

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
    }, [
        location.pathname,
        refreshUser,
        user,
    ]);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
        };

        window.addEventListener(
            'admin:unauthorized',
            handleUnauthorized
        );

        return () => {
            window.removeEventListener(
                'admin:unauthorized',
                handleUnauthorized
            );
        };
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
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside AuthProvider.'
        );
    }

    return context;
}
