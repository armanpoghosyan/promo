import axios from 'axios';

const api = axios.create({
    baseURL: '/api',

    headers: {
        Accept: 'application/json',
    },

    withCredentials: true,
    withXSRFToken: true,
});

api.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(
                new CustomEvent('admin:unauthorized')
            );
        }

        return Promise.reject(error);
    }
);

export default api;
