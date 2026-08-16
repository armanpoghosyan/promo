import '../css/app.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './auth/AuthContext';

import App from './App';

const rootElement = document.getElementById('app');

if (!rootElement) {
    throw new Error('App root element not found.');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <LanguageProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </LanguageProvider>
        </BrowserRouter>
    </React.StrictMode>
);
