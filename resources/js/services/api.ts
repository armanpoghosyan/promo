import axios from 'axios';

const api = axios.create({
    baseURL: '/api',

    headers: {
        Accept: 'application/json',
    },

    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token =
            localStorage.getItem(
                'admin_access_token'
            );

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    }
);

api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem(
                'admin_access_token'
            );

            window.dispatchEvent(
                new CustomEvent(
                    'admin:unauthorized'
                )
            );
        }

        return Promise.reject(error);
    }
);

export default api;
