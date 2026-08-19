export type UserRole =
    | 'admin'
    | 'super_admin';

export interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;

    data: {
        token: string;
        user: AdminUser;
    };
}

export interface CurrentUserResponse {
    data: AdminUser;
}
