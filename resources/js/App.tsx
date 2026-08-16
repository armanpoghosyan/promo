import {Navigate, Route, Routes} from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Receipts from './pages/admin/Receipts';
import ReceiptDetails from './pages/admin/ReceiptDetails';
import Draws from './pages/admin/Draws';
import DrawDetails from './pages/admin/DrawDetails';
import Participants from './pages/admin/Participants';
import ParticipantDetails from './pages/admin/ParticipantDetails';
import Prizes from './pages/admin/Prizes';
import Reports from './pages/admin/Reports';
import Winners from './pages/admin/Winners';
import WinnerDetails from './pages/admin/WinnerDetails';

function AdminNotFound() {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
                Page not found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
                The requested admin page does not exist.
            </p>
        </div>
    );
}

export default function App() {
    return (
        <Routes>

            {/* Public */}
            <Route
                path="/"
                element={<Landing />}
            />
            <Route
                path="/login"
                element={<Login />}
            />

            {/* Protected Admin */}
            <Route
                element={<ProtectedRoute />}
            >
                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        index
                        element={<Dashboard />}
                    />
                    <Route
                        path="receipts"
                        element={<Receipts />}
                    />
                    <Route
                        path="receipts/:id"
                        element={<ReceiptDetails />}
                    />
                    <Route
                        path="draws"
                        element={<Draws />}
                    />
                    <Route
                        path="draws/:id"
                        element={<DrawDetails />}
                    />
                    <Route
                        path="participants"
                        element={<Participants />}
                    />
                    <Route
                        path="participants/:id"
                        element={<ParticipantDetails />}
                    />
                    <Route
                        path="prizes"
                        element={<Prizes />}
                    />
                    <Route
                        path="reports"
                        element={<Reports />}
                    />
                    <Route
                        path="winners"
                        element={<Winners />}
                    />
                    <Route
                        path="winners/:id"
                        element={<WinnerDetails />}
                    />

                    {/* Unknown admin page */}
                    <Route
                        path="*"
                        element={<AdminNotFound />}
                    />
                </Route>
            </Route>

            {/* Unknown public path */}
            <Route
                path="*"
                element={
                    <Navigate to="/" replace/>
                }
            />

        </Routes>
    );
}
