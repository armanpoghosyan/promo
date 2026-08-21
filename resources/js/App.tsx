import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import Landing from './pages/Landing';
import ActivityLog from './pages/admin/ActivityLog';
import Dashboard from './pages/admin/Dashboard';
import DrawDetails from './pages/admin/DrawDetails';
import Draws from './pages/admin/Draws';
import Login from './pages/admin/Login';
import ParticipantDetails from './pages/admin/ParticipantDetails';
import Participants from './pages/admin/Participants';
import Prizes from './pages/admin/Prizes';
import ReceiptDetails from './pages/admin/ReceiptDetails';
import Receipts from './pages/admin/Receipts';
import Reports from './pages/admin/Reports';
import WinnerDetails from './pages/admin/WinnerDetails';
import Winners from './pages/admin/Winners';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Landing />}/>
            <Route path="/login" element={<Login />}/>

            <Route element={<ProtectedRoute />}>
                <Route path="/admin" element={<AdminLayout />}>

                    <Route index                    element={<Dashboard />}/>
                    <Route path="receipts"          element={<Receipts />}/>
                    <Route path="receipts/:id"      element={<ReceiptDetails />}/>
                    <Route path="draws"             element={<Draws />}/>
                    <Route path="draws/:id"         element={<DrawDetails />}/>
                    <Route path="participants"      element={<Participants />}/>
                    <Route path="participants/:id"  element={<ParticipantDetails />}/>
                    <Route path="prizes"            element={<Prizes />}/>
                    <Route path="winners"           element={<Winners />}/>
                    <Route path="winners/:id"       element={<WinnerDetails />}/>
                    <Route path="reports"           element={<Reports />}/>
                    <Route path="activity"          element={<ActivityLog />}/>
                    <Route path="*"                 element={<AdminNotFound />}/>

                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace/>}/>
        </Routes>
    );
}

function AdminNotFound() {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
            <p className="mt-2 text-sm text-gray-500">The requested admin page does not exist.</p>
        </div>
    );
}
