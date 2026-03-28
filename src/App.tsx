import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Timer from './pages/Timer';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Rooms from './pages/Rooms';
import Friends from './pages/Friends';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import DirectMessage from './pages/DirectMessage';
import Challenges from './pages/Challenges';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="timer" element={<Timer />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="friends" element={<Friends />} />
              <Route path="friends/:id" element={<DirectMessage />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetails />} />
              <Route path="challenges" element={<Challenges />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminPanel />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
