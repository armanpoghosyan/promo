import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Receipts from './pages/admin/Receipts';
import ReceiptDetails from './pages/admin/ReceiptDetails';
import Draws from './pages/admin/Draws';
import DrawDetails from './pages/admin/DrawDetails';
import Participants from './pages/admin/Participants';
import ParticipantDetails from './pages/admin/ParticipantDetails';
import Prizes from "./pages/admin/Prizes";
import Reports from "./pages/admin/Reports";
import Winners from "./pages/admin/Winners";
import WinnerDetails from "./pages/admin/WinnerDetails";

export default function App() {
    return (
        <Routes>
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
                    path="/admin/draws"
                    element={<Draws />}
                />
                <Route
                    path="/admin/draws/:id"
                    element={<DrawDetails />}
                />
                <Route
                    path="/admin/participants"
                    element={<Participants />}
                />
                <Route
                    path="/admin/participants/:id"
                    element={<ParticipantDetails />}
                />
                <Route
                    path="/admin/prizes"
                    element={<Prizes />}
                />
                <Route
                    path="/admin/reports"
                    element={<Reports />}
                />
                <Route
                    path="/admin/winners"
                    element={<Winners />}
                />
                <Route
                    path="/admin/winners/:id"
                    element={<WinnerDetails />}
                />
            </Route>

            <Route
                path="*"
                element={<Navigate to="/admin" replace />}
            />
        </Routes>
    );
}
